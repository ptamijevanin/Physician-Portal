import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getPreferredAudioMimeType,
  transcribeAudioWithWhisper,
} from '../services/whisperService';
import {
  applyTranscript,
  mergeDisplayText,
  stripTrailingStopCommand,
  transcriptRequestsStop,
} from '../utils/dictationCommands';

export type WhisperStatus = 'idle' | 'recording' | 'transcribing' | 'error';
export type WhisperLanguage = 'en' | 'ar';

interface UseWhisperDictationOptions {
  applyVoiceCommands?: boolean;
  language?: WhisperLanguage;
  prompt?: string;
}

const TIMESLICE_MS = 400;
const LIVE_UPDATE_INTERVAL_MS = 2500;
const MIN_AUDIO_BYTES = 3500;
/** Still check for "stop" after this, but skip rewriting the field (keeps CPU down). */
const LIVE_TEXT_MAX_MS = 30000;
const LIVE_TIMEOUT_MS = 25000;
const FINAL_TIMEOUT_MS = 90000;

const appendPlainTranscript = (baseText: string, transcript: string) => {
  const cleaned = transcript.trim();
  if (!cleaned) return baseText;
  if (!baseText.trim()) return cleaned;
  const needsSpace = !/\s$/.test(baseText) && !/^[.,;:!?]/.test(cleaned);
  return `${baseText}${needsSpace ? ' ' : ''}${cleaned}`;
};

const pickBestTranscript = (a: string, b: string) => {
  const left = a.trim();
  const right = b.trim();
  if (!left) return right;
  if (!right) return left;
  if (right.length >= left.length * 0.8) return right;
  return left.length >= right.length ? left : right;
};

/** Detect spoken stop from the latest live transcript (and new words since last pass). */
const shouldEndFromTranscript = (raw: string, previousRaw: string): boolean => {
  if (transcriptRequestsStop(raw)) return true;

  const currNorm = raw.trim().toLowerCase();
  const prevNorm = previousRaw.trim().toLowerCase();
  if (!currNorm) return false;

  // New content since last live result — catches a lone spoken "stop"
  if (prevNorm && currNorm.startsWith(prevNorm)) {
    const delta = currNorm.slice(prevNorm.length).trim();
    if (delta && (transcriptRequestsStop(delta) || /^(?:please\s+)?(?:stop|stopped|stopp)\b/i.test(delta))) {
      return true;
    }
  } else if (prevNorm) {
    const tail = currNorm.slice(Math.max(0, currNorm.length - 48)).trim();
    if (transcriptRequestsStop(tail) || /(?:^|\s)(?:stop|stopped)\.?$/i.test(tail)) {
      return true;
    }
  }

  return false;
};

export const useWhisperDictation = (
  onTranscript: (text: string) => void,
  options: UseWhisperDictationOptions = {},
) => {
  const { applyVoiceCommands = false, language = 'en', prompt } = options;
  const [status, setStatus] = useState<WhisperStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [liveHint, setLiveHint] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const baseTextRef = useRef('');
  const sessionTextRef = useRef('');
  const lastLiveRawRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);
  const applyVoiceCommandsRef = useRef(applyVoiceCommands);
  const listenForStopRef = useRef(false);
  const transcribeInFlightRef = useRef(false);
  const finalizedRef = useRef(false);
  const mimeTypeRef = useRef('audio/webm');
  const sessionIdRef = useRef(0);
  const recordingStartedAtRef = useRef(0);
  const stopRecorderRef = useRef<() => void>(() => undefined);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstLiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    applyVoiceCommandsRef.current = applyVoiceCommands;
  }, [applyVoiceCommands]);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined',
    );
  }, []);

  const formatTranscript = useCallback((raw: string) => {
    const stripped = stripTrailingStopCommand(raw);
    if (!stripped) return '';
    if (!applyVoiceCommandsRef.current) return stripped;
    const pieces = applyTranscript([], stripped, { allowDelete: true });
    return stripTrailingStopCommand(mergeDisplayText('', pieces, '').trim()) || stripped;
  }, []);

  const publishSession = useCallback(
    (raw: string, opts?: { allowEmpty?: boolean; preferLonger?: boolean }) => {
      const formatted = formatTranscript(raw);
      const previous = sessionTextRef.current.trim();

      if (!formatted) {
        if (!opts?.allowEmpty && previous) {
          onTranscriptRef.current(appendPlainTranscript(baseTextRef.current, previous));
          return;
        }
        sessionTextRef.current = '';
        onTranscriptRef.current(baseTextRef.current);
        return;
      }

      if (!opts?.allowEmpty && previous && formatted.length < Math.min(12, previous.length * 0.35)) {
        onTranscriptRef.current(appendPlainTranscript(baseTextRef.current, previous));
        return;
      }

      const next = opts?.preferLonger && previous ? pickBestTranscript(previous, formatted) : formatted;
      sessionTextRef.current = next;
      onTranscriptRef.current(appendPlainTranscript(baseTextRef.current, next));
    },
    [formatTranscript],
  );

  const getFullAudioBlob = useCallback(() => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: mimeTypeRef.current });
  }, []);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (firstLiveTimerRef.current) {
      clearTimeout(firstLiveTimerRef.current);
      firstLiveTimerRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    clearTimers();
    abortRef.current?.abort();
    abortRef.current = null;
    listenForStopRef.current = false;
    transcribeInFlightRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, [clearTimers]);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const stop = useCallback(() => {
    listenForStopRef.current = false;
    clearTimers();
    abortRef.current?.abort();
    abortRef.current = null;
    transcribeInFlightRef.current = false;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.requestData();
      } catch {
        /* ignore */
      }
      recorder.stop();
      return;
    }
    cleanupStream();
    setLiveHint(null);
    setStatus('idle');
  }, [cleanupStream, clearTimers]);

  useEffect(() => {
    stopRecorderRef.current = stop;
  }, [stop]);

  const endRecordingFromVoice = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    listenForStopRef.current = false;
    setLiveHint('Finalizing…');
    setStatus('transcribing');
    stopRecorderRef.current();
  }, []);

  const runLiveTranscribe = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!listenForStopRef.current || finalizedRef.current) return;
    if (transcribeInFlightRef.current) return;

    const blob = getFullAudioBlob();
    if (!blob || blob.size < MIN_AUDIO_BYTES) return;

    const elapsed = Date.now() - recordingStartedAtRef.current;
    const updateField = elapsed <= LIVE_TEXT_MAX_MS;
    const previousRaw = lastLiveRawRef.current;

    const controller = new AbortController();
    abortRef.current = controller;
    transcribeInFlightRef.current = true;
    setLiveHint(updateField ? 'Updating…' : 'Recording… say Stop or tap mic when finished');

    const timeout = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);

    try {
      const raw = await transcribeAudioWithWhisper(blob, {
        language,
        prompt: prompt || undefined,
        finalize: false,
        signal: controller.signal,
      });

      if (sessionId !== sessionIdRef.current) return;
      if (finalizedRef.current) return;
      if (!raw.trim()) return;

      if (updateField) {
        publishSession(raw, { preferLonger: true });
      }

      const stopHeard = shouldEndFromTranscript(raw, previousRaw);
      lastLiveRawRef.current = raw;

      if (listenForStopRef.current && stopHeard) {
        publishSession(raw, { preferLonger: true });
        endRecordingFromVoice();
        return;
      }

      if (listenForStopRef.current) {
        setLiveHint(updateField ? 'Listening…' : 'Recording… say Stop or tap mic when finished');
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      console.warn('Live Whisper update failed:', err);
      if (sessionId === sessionIdRef.current && listenForStopRef.current && !finalizedRef.current) {
        setLiveHint('Listening… (retrying)');
      }
    } finally {
      clearTimeout(timeout);
      // Never let a finished/previous session clear flags for the active one
      if (sessionId === sessionIdRef.current) {
        if (abortRef.current === controller) abortRef.current = null;
        transcribeInFlightRef.current = false;
      }
    }
  }, [endRecordingFromVoice, getFullAudioBlob, language, prompt, publishSession]);

  const start = useCallback(
    async (baseText: string) => {
      setError(null);
      setLiveHint(null);

      if (!isSupported) {
        const message = 'Audio recording is not supported in this browser.';
        setError(message);
        setStatus('error');
        alert(message);
        return;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        stop();
        return;
      }

      try {
        // Tear down leftovers from a prior session before starting a new one.
        clearTimers();
        abortRef.current?.abort();
        abortRef.current = null;

        sessionIdRef.current += 1;
        const sessionId = sessionIdRef.current;

        baseTextRef.current = baseText;
        sessionTextRef.current = '';
        lastLiveRawRef.current = '';
        chunksRef.current = [];
        listenForStopRef.current = true;
        transcribeInFlightRef.current = false;
        finalizedRef.current = false;
        recordingStartedAtRef.current = Date.now();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1,
          },
        });

        if (sessionId !== sessionIdRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const mimeType = getPreferredAudioMimeType();
        mimeTypeRef.current = mimeType || 'audio/webm';
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onerror = () => {
          setError('Recording failed. Please try again.');
          setStatus('error');
          setLiveHint(null);
          cleanupStream();
        };

        recorder.onstop = async () => {
          const stopSessionId = sessionId;
          listenForStopRef.current = false;
          clearTimers();
          abortRef.current?.abort();
          abortRef.current = null;

          const audioBlob = getFullAudioBlob();
          const previousLive = sessionTextRef.current.trim();

          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          mediaRecorderRef.current = null;
          chunksRef.current = [];
          transcribeInFlightRef.current = false;

          if (stopSessionId !== sessionIdRef.current) return;

          if (!audioBlob || audioBlob.size < 500) {
            if (previousLive) {
              onTranscriptRef.current(appendPlainTranscript(baseTextRef.current, previousLive));
              setStatus('idle');
              setError(null);
              setLiveHint(null);
              finalizedRef.current = false;
              return;
            }
            setError('Recording was too short. Hold a moment longer and try again.');
            setStatus('error');
            setLiveHint(null);
            finalizedRef.current = false;
            return;
          }

          setStatus('transcribing');
          setLiveHint('Finalizing transcript…');

          const controller = new AbortController();
          abortRef.current = controller;
          const timeout = setTimeout(() => controller.abort(), FINAL_TIMEOUT_MS);

          try {
            const raw = await transcribeAudioWithWhisper(audioBlob, {
              language,
              prompt: prompt || undefined,
              finalize: true,
              signal: controller.signal,
            });
            if (stopSessionId !== sessionIdRef.current) return;

            const cleaned = stripTrailingStopCommand(raw);
            const best = pickBestTranscript(previousLive, cleaned);
            if (best.trim()) {
              publishSession(best, { preferLonger: true });
            } else if (previousLive) {
              onTranscriptRef.current(appendPlainTranscript(baseTextRef.current, previousLive));
            }

            setStatus('idle');
            setError(null);
            setLiveHint(null);
          } catch (err) {
            if (stopSessionId !== sessionIdRef.current) return;
            if (previousLive) {
              onTranscriptRef.current(appendPlainTranscript(baseTextRef.current, previousLive));
              setStatus('idle');
              setError(null);
              setLiveHint(null);
              return;
            }
            const message =
              (err as Error)?.name === 'AbortError'
                ? 'Transcription timed out. Try a shorter dictation, or use WHISPER_MODEL=base for speed.'
                : err instanceof Error
                  ? err.message
                  : 'Transcription failed.';
            setError(message);
            setStatus('error');
            setLiveHint(null);
          } finally {
            clearTimeout(timeout);
            if (stopSessionId === sessionIdRef.current) {
              if (abortRef.current === controller) abortRef.current = null;
              finalizedRef.current = false;
              lastLiveRawRef.current = '';
            }
          }
        };

        recorder.start(TIMESLICE_MS);
        setStatus('recording');
        setLiveHint('Listening…');

        pollTimerRef.current = setInterval(() => {
          if (sessionIdRef.current !== sessionId) return;
          if (listenForStopRef.current && !finalizedRef.current) {
            void runLiveTranscribe();
          }
        }, LIVE_UPDATE_INTERVAL_MS);

        firstLiveTimerRef.current = setTimeout(() => {
          if (sessionIdRef.current !== sessionId) return;
          if (listenForStopRef.current && !finalizedRef.current) {
            void runLiveTranscribe();
          }
        }, 1000);
      } catch (err) {
        cleanupStream();
        finalizedRef.current = false;
        const message =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Microphone access was denied. Allow microphone permission and try again.'
            : 'Unable to access the microphone.';
        setError(message);
        setStatus('error');
        alert(message);
      }
    },
    [
      cleanupStream,
      clearTimers,
      getFullAudioBlob,
      isSupported,
      language,
      prompt,
      publishSession,
      runLiveTranscribe,
      stop,
    ],
  );

  const toggle = useCallback(
    (baseText: string) => {
      if (status === 'recording') {
        stop();
        return;
      }
      // Wait until finalizing finishes before starting another session
      if (status === 'transcribing') return;
      if (status !== 'idle') return;
      void start(baseText);
    },
    [start, status, stop],
  );

  return {
    status,
    error,
    liveHint,
    isRecording: status === 'recording',
    isTranscribing: status === 'transcribing',
    isBusy: status === 'recording' || status === 'transcribing',
    isSupported,
    start,
    stop,
    toggle,
  };
};

import { useCallback, useRef, useState } from 'react';
import {
  applyTranscript,
  type DictationPiece,
  mergeDisplayText,
} from '../utils/dictationCommands';

type DictationStatus = 'idle' | 'starting' | 'listening';

const getSpeechRecognitionCtor = () =>
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechDictation = (onTranscript: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<DictationStatus>('idle');
  const recognitionRef = useRef<any>(null);
  const keepListeningRef = useRef(false);
  const baseTextRef = useRef('');
  const piecesRef = useRef<DictationPiece[]>([]);

  const updateDisplay = useCallback(
    (interim = '') => {
      onTranscript(mergeDisplayText(baseTextRef.current, piecesRef.current, interim));
    },
    [onTranscript],
  );

  const stop = useCallback(() => {
    keepListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus('idle');
  }, []);

  const start = useCallback(
    (baseText: string) => {
      const SpeechRecognition = getSpeechRecognitionCtor();
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
        return;
      }

      stop();

      keepListeningRef.current = true;
      baseTextRef.current = baseText;
      piecesRef.current = [];
      setIsListening(true);
      setStatus('starting');

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setStatus('listening');

      recognition.onresult = (event: any) => {
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            piecesRef.current = applyTranscript(piecesRef.current, transcript, { allowDelete: true });
          } else {
            interim += transcript;
          }
        }

        updateDisplay(interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          keepListeningRef.current = false;
          setIsListening(false);
          setStatus('idle');
          alert('Microphone access was denied. Allow microphone permission and try again.');
          return;
        }

        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        if (!keepListeningRef.current) {
          updateDisplay();
          setIsListening(false);
          setStatus('idle');
          recognitionRef.current = null;
          return;
        }

        const restart = () => {
          if (!keepListeningRef.current || recognitionRef.current !== recognition) return;
          try {
            recognition.start();
          } catch (error) {
            console.error('Failed to restart recognition', error);
            keepListeningRef.current = false;
            setIsListening(false);
            setStatus('idle');
            recognitionRef.current = null;
          }
        };

        window.setTimeout(restart, 200);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (error) {
        console.error('Failed to start recognition', error);
        keepListeningRef.current = false;
        setIsListening(false);
        setStatus('idle');
      }
    },
    [stop, updateDisplay],
  );

  return {
    isListening,
    status,
    start,
    stop,
    isSupported: typeof getSpeechRecognitionCtor() === 'function',
  };
};

const DEFAULT_WHISPER_BASE = '/api/whisper';

/** Base URL for the local Whisper server (proxied in Vite for local.req.dev). */
export const getWhisperBaseUrl = () =>
  (import.meta.env.VITE_WHISPER_URL as string | undefined)?.trim() || DEFAULT_WHISPER_BASE;

/**
 * Local Whisper needs a running server (see whisper-server/), not an API key.
 * Always true from the client — actual availability is checked at transcribe time.
 */
export const isWhisperConfigured = () => true;

export const getPreferredAudioMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

const serverStartHint =
  'Start the local Whisper server: npm run whisper:server (requires Python, ffmpeg, and whisper-server/.venv).';

export const checkWhisperHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getWhisperBaseUrl()}/health`, { method: 'GET' });
    if (!response.ok) return false;
    const payload = (await response.json()) as { status?: string };
    return payload.status === 'ok';
  } catch {
    return false;
  }
};

export const transcribeAudioWithWhisper = async (
  audioBlob: Blob,
  options?: { language?: string; prompt?: string; finalize?: boolean; signal?: AbortSignal },
): Promise<string> => {
  const extension = audioBlob.type.includes('mp4')
    ? 'mp4'
    : audioBlob.type.includes('ogg')
      ? 'ogg'
      : 'webm';

  const formData = new FormData();
  formData.append('file', audioBlob, `dictation.${extension}`);
  if (options?.language) formData.append('language', options.language);
  if (options?.prompt) formData.append('prompt', options.prompt);
  if (options?.finalize) formData.append('finalize', 'true');

  let response: Response;
  try {
    response = await fetch(`${getWhisperBaseUrl()}/transcribe`, {
      method: 'POST',
      body: formData,
      signal: options?.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new Error(`Local Whisper is unreachable. ${serverStartHint}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = errorBody?.detail || errorBody?.error?.message || JSON.stringify(errorBody);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Whisper transcription failed (${response.status}). ${serverStartHint}`);
  }

  const payload = (await response.json()) as { text?: string };
  return (payload.text || '').trim();
};

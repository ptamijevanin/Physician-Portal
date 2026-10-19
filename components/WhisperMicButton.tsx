import React from 'react';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { WhisperStatus } from '../hooks/useWhisperDictation';

interface WhisperMicButtonProps {
  status: WhisperStatus;
  disabled?: boolean;
  onClick: () => void;
  labelIdle?: string;
  className?: string;
  compact?: boolean;
}

const WhisperMicButton: React.FC<WhisperMicButtonProps> = ({
  status,
  disabled,
  onClick,
  labelIdle = 'Whisper Dictation',
  className = '',
  compact = false,
}) => {
  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';
  const isBusy = isRecording || isTranscribing;

  const label = isRecording ? 'Stop & Transcribe' : isTranscribing ? 'Transcribing...' : labelIdle;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isTranscribing}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        compact ? 'h-8 w-8 px-0' : 'h-8 px-3'
      } ${
        isRecording
          ? 'bg-rose-500 text-white animate-pulse'
          : isTranscribing
            ? 'bg-amber-500 text-white'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
      } ${className}`}
    >
      {isTranscribing ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={12} />
      ) : (
        <Mic size={12} />
      )}
      {!compact && <span>{label}</span>}
      {compact && <span className="sr-only">{label}</span>}
      {isBusy && !compact ? null : null}
    </button>
  );
};

export default WhisperMicButton;

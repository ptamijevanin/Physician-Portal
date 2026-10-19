import React, { useState } from 'react';
import { Loader2, Mic } from 'lucide-react';
import WhisperMicButton from './WhisperMicButton';
import { useWhisperDictation, WhisperLanguage } from '../hooks/useWhisperDictation';

interface WhisperTextAreaProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
  applyVoiceCommands?: boolean;
  whisperPrompt?: string;
  defaultLanguage?: WhisperLanguage;
}

const WhisperTextArea: React.FC<WhisperTextAreaProps> = ({
  id,
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  className = '',
  labelClassName = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest',
  disabled = false,
  applyVoiceCommands = false,
  whisperPrompt,
  defaultLanguage = 'en',
}) => {
  const [language, setLanguage] = useState<WhisperLanguage>(defaultLanguage);

  const whisper = useWhisperDictation(onChange, {
    applyVoiceCommands,
    language,
    prompt: whisperPrompt,
  });

  const baseAtStartRef = React.useRef(value);

  const handleMicClick = () => {
    if (whisper.isTranscribing) return;
    if (whisper.isRecording) {
      whisper.stop();
      return;
    }
    baseAtStartRef.current = value;
    whisper.start(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className={labelClassName} htmlFor={id}>
          {label}
        </label>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {whisper.isRecording && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1 text-white shadow-sm animate-pulse">
              <Mic size={11} />
              <span className="font-semibold text-[9px] uppercase tracking-widest">
                Recording · say Stop
              </span>
            </div>
          )}
          {whisper.isTranscribing && !whisper.isRecording && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1 text-white shadow-sm">
              <Loader2 size={11} className="animate-spin" />
              <span className="font-semibold text-[9px] uppercase tracking-widest">
                Transcribing…
              </span>
            </div>
          )}
          {!disabled && (
            <div
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              role="group"
              aria-label="Dictation language"
            >
              {(['en', 'ar'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  disabled={whisper.isBusy}
                  onClick={() => setLanguage(code)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                    language === code
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  } disabled:opacity-50`}
                >
                  {code === 'en' ? 'English' : 'Arabic'}
                </button>
              ))}
            </div>
          )}
          {!disabled && (
            <WhisperMicButton
              status={whisper.status}
              compact
              onClick={handleMicClick}
              labelIdle="Dictate with Whisper"
            />
          )}
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        readOnly={disabled || whisper.isBusy}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${className} ${whisper.isRecording ? 'ring-2 ring-rose-300/60' : ''}`}
      />
      {whisper.liveHint && (
        <p className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5">
          {whisper.liveHint}
        </p>
      )}
      {whisper.error && (
        <p className="text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
          {whisper.error}
        </p>
      )}
    </div>
  );
};

export default WhisperTextArea;

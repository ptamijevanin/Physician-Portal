import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, Save, Check } from 'lucide-react';
import ModulePageHeader from './ModulePageHeader';
import WhisperTextArea from './WhisperTextArea';

const STORAGE_PREFIX = 'physician_private_note_';

interface PrivateNoteProps {
  patientId: string;
}

const PrivateNote: React.FC<PrivateNoteProps> = ({ patientId }) => {
  const storageKey = `${STORAGE_PREFIX}${patientId}`;
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setNote(stored || '');
    const ts = localStorage.getItem(`${storageKey}_ts`);
    setLastSavedAt(ts);
    setSaved(false);
  }, [storageKey]);

  const persist = useCallback(
    (text: string) => {
      localStorage.setItem(storageKey, text);
      const ts = new Date().toLocaleString();
      localStorage.setItem(`${storageKey}_ts`, ts);
      setLastSavedAt(ts);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [storageKey],
  );

  const handleChange = useCallback(
    (value: string) => {
      setNote(value);
      setSaved(false);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persist(value), 1200);
    },
    [persist],
  );

  const handleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    persist(note);
  };

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const fieldClassName =
    'w-full min-h-[200px] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 text-sm font-medium text-slate-800 transition-all resize-none leading-relaxed';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <ModulePageHeader
        title="Private Note"
        subtitle="Personal notes for this patient — visible only to you, across all cases"
        actions={
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900 w-full sm:w-auto"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? 'Saved' : 'Save'}
          </button>
        }
      />

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
              Your Private Note
            </h4>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              Not shared with other staff. Stored locally in this browser.
            </p>
          </div>
        </div>

        <WhisperTextArea
          id="private-note"
          label="Note"
          value={note}
          onChange={handleChange}
          rows={10}
          className={fieldClassName}
          placeholder="Write your private notes about this patient here…"
          applyVoiceCommands
          whisperPrompt="Private physician note."
        />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 uppercase tracking-wider">
            <Lock size={12} />
            Private — browser only
          </div>
          {lastSavedAt && (
            <span className="text-[10px] font-medium text-slate-400">
              Last saved: {lastSavedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivateNote;

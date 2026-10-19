import React, { useState } from 'react';
import { Save, ShieldCheck, StickyNote, Clock, Building2, User } from 'lucide-react';
import { OccupationalGroupCode, ProgressNoteEntry } from '../types';
import ModulePageHeader from './ModulePageHeader';
import WhisperTextArea from './WhisperTextArea';

const OCCUPATIONAL_GROUPS: Record<
  OccupationalGroupCode,
  { label: string; color: string; bg: string; border: string; accent: string }
> = {
  DOCT: { label: 'Physician', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', accent: 'border-l-blue-500' },
  NURS: { label: 'Nursing', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'border-l-emerald-500' },
  OTHE: { label: 'Other', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'border-l-slate-400' },
  PHYS: { label: 'Physiotherapy', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'border-l-orange-500' },
  PHAR: { label: 'Pharmacist', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'border-l-purple-500' },
  TRIA: { label: 'Triage Staff', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', accent: 'border-l-red-500' },
  TECH: { label: 'Technician', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', accent: 'border-l-cyan-500' },
  THER: { label: 'Therapist', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'border-l-indigo-500' },
  ITST: { label: 'IT Department Staff', color: 'text-zinc-700', bg: 'bg-zinc-50', border: 'border-zinc-200', accent: 'border-l-zinc-500' },
  DIET: { label: 'Dietician', color: 'text-lime-700', bg: 'bg-lime-50', border: 'border-lime-200', accent: 'border-l-lime-500' },
  PSYC: { label: 'Psychologist', color: 'text-fuchsia-700', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', accent: 'border-l-fuchsia-500' },
  SPTH: { label: 'Speech Therapist', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', accent: 'border-l-teal-500' },
  RTTH: { label: 'Respiratory Therapist', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', accent: 'border-l-sky-500' },
  SOWR: { label: 'Social Worker', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'border-l-amber-500' },
};

const noteFieldClass =
  'w-full min-h-[100px] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 text-sm font-medium text-slate-800 transition-all resize-none leading-relaxed';

const ProgressNotes: React.FC<{ patientId: string; readOnly?: boolean }> = ({ readOnly }) => {
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<ProgressNoteEntry[]>([]);
  const [filterGroup, setFilterGroup] = useState<OccupationalGroupCode | 'ALL'>('ALL');

  const currentUser = {
    name: 'Dr. Sarah Connor',
    groupCode: 'DOCT' as OccupationalGroupCode,
    ou: 'Cardiology Unit 1',
  };

  const currentGroupStyle = OCCUPATIONAL_GROUPS[currentUser.groupCode];

  const handleSaveEntry = () => {
    if (!note.trim()) return;

    const newEntry: ProgressNoteEntry = {
      id: Math.random().toString(36).substr(2, 9),
      text: note.trim(),
      timestamp: new Date().toLocaleString(),
      user: currentUser.name,
      groupCode: currentUser.groupCode,
      groupLabel: OCCUPATIONAL_GROUPS[currentUser.groupCode].label,
      ou: currentUser.ou,
    };

    setEntries([newEntry, ...entries]);
    setNote('');
  };

  const filteredEntries =
    filterGroup === 'ALL' ? entries : entries.filter((e) => e.groupCode === filterGroup);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <ModulePageHeader
        title="Progress Notes"
        subtitle="Official clinical progress note entries"
        actions={
          !readOnly ? (
            <button
              type="button"
              onClick={handleSaveEntry}
              disabled={!note.trim()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Save size={13} />
              Save Entry
            </button>
          ) : undefined
        }
      />

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <StickyNote size={18} />
            </div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">New Entry</h4>
          </div>
          <span
            className={`text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-md border ${currentGroupStyle.bg} ${currentGroupStyle.color} ${currentGroupStyle.border}`}
          >
            {currentUser.groupCode}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <User size={10} />
            {currentUser.name}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${currentGroupStyle.bg} ${currentGroupStyle.color} ${currentGroupStyle.border}`}
          >
            {currentGroupStyle.label}
          </span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Building2 size={10} />
            {currentUser.ou}
          </span>
        </div>

        <WhisperTextArea
          id="progress-note"
          label="Clinical Note"
          value={note}
          onChange={setNote}
          disabled={!!readOnly}
          rows={5}
          className={`${noteFieldClass} ${readOnly ? 'cursor-default opacity-80' : ''}`}
          placeholder={readOnly ? 'No active case — notes are read-only' : 'Document clinical findings...'}
          applyVoiceCommands
          whisperPrompt="Clinical progress note."
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3 pt-3 border-t border-slate-100 sm:justify-between">
          {readOnly ? (
            <p className="text-xs font-medium text-slate-400 italic">Read-only mode</p>
          ) : (
            <p className="text-[10px] font-medium text-slate-400">
              Choose English or Arabic. Text updates about every 2 seconds while you speak; a higher-quality
              pass runs when you say &quot;stop&quot; or tap the mic.
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 uppercase tracking-wider shrink-0">
            <ShieldCheck size={12} />
            Secure entry
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <StickyNote size={18} />
            </div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Clinical History</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100">
              {filteredEntries.length} Entries
            </span>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value as OccupationalGroupCode | 'ALL')}
              className="text-[10px] font-semibold uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-4 focus:ring-violet-500/10 text-slate-600"
            >
              <option value="ALL">All Groups</option>
              {Object.entries(OCCUPATIONAL_GROUPS).map(([code, { label }]) => (
                <option key={code} value={code}>
                  {code} — {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => {
              const groupStyle = OCCUPATIONAL_GROUPS[entry.groupCode];
              return (
                <div
                  key={entry.id}
                  className={`text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100 border-l-4 ${groupStyle.accent}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-700 font-medium">{entry.user}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Clock size={10} />
                      {entry.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${groupStyle.bg} ${groupStyle.color} ${groupStyle.border}`}
                    >
                      {entry.groupCode}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {entry.groupLabel}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 size={10} />
                      {entry.ou}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs font-medium text-slate-400 italic">No clinical entries</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressNotes;

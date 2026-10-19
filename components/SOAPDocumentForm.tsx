import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, FileText, Stethoscope, Sparkles, Loader2, Search } from 'lucide-react';
import { Diagnosis } from '../types';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import { getSmartDiagnosis, suggestIcdFromSoapText, SuggestedIcdCode } from '../services/geminiService';
import WhisperTextArea from './WhisperTextArea';

export interface SOAPIcdDiagnosis {
  code: string;
  description: string;
}

export interface SOAPDocumentData {
  purposeOfVisit: string;
  complaints: string[];
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icdDiagnoses: SOAPIcdDiagnosis[];
}

interface SOAPDocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SOAPDocumentData) => void;
  diagnoses: Diagnosis[];
  initialData?: SOAPDocumentData | null;
  formMode?: 'create' | 'edit' | 'newVersion';
  versionNumber?: number;
}

const fieldClassName =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none';

const labelClassName = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest';

const SOAPDocumentForm: React.FC<SOAPDocumentFormProps> = ({
  isOpen,
  onClose,
  onSave,
  diagnoses,
  initialData,
  formMode = 'create',
  versionNumber,
}) => {
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const [purposeOfVisit, setPurposeOfVisit] = useState('');
  const [complaints, setComplaints] = useState<string[]>(['']);
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [icdDiagnoses, setIcdDiagnoses] = useState<SOAPIcdDiagnosis[]>([]);
  const [error, setError] = useState('');
  const [icdSuggestions, setIcdSuggestions] = useState<SuggestedIcdCode[]>([]);
  const [suggestingIcd, setSuggestingIcd] = useState(false);
  const [suggestIcdMessage, setSuggestIcdMessage] = useState('');

  const [icdQuery, setIcdQuery] = useState('');
  const [icdSearchResults, setIcdSearchResults] = useState<
    { code: string; description: string; context?: string }[]
  >([]);
  const [icdSearchLoading, setIcdSearchLoading] = useState(false);
  const [showIcdDropdown, setShowIcdDropdown] = useState(false);
  const icdSearchRef = useRef<HTMLDivElement>(null);
  const icdSearchCache = useRef<Record<string, { code: string; description: string; context?: string }[]>>(
    {},
  );
  const icdDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formSubtitle =
    formMode === 'newVersion'
      ? `New Version (v${versionNumber ?? 2})`
      : formMode === 'edit'
        ? `Edit SOAP Document${versionNumber ? ` · v${versionNumber}` : ''}`
        : 'Create SOAP Document';

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setPurposeOfVisit(initialData.purposeOfVisit);
      setComplaints(initialData.complaints.length ? initialData.complaints : ['']);
      setSubjective(initialData.subjective);
      setObjective(initialData.objective);
      setAssessment(initialData.assessment);
      setPlan(initialData.plan);
      setIcdDiagnoses(initialData.icdDiagnoses || []);
      setError('');
      setIcdSuggestions([]);
      setSuggestIcdMessage('');
      setIcdQuery('');
      setIcdSearchResults([]);
      setShowIcdDropdown(false);
      return;
    }

    setPurposeOfVisit('');
    setComplaints(['']);
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setIcdDiagnoses([]);
    setError('');
    setIcdSuggestions([]);
    setSuggestIcdMessage('');
    setIcdQuery('');
    setIcdSearchResults([]);
    setShowIcdDropdown(false);
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (icdSearchRef.current && !icdSearchRef.current.contains(event.target as Node)) {
        setShowIcdDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (icdDebounceRef.current) clearTimeout(icdDebounceRef.current);

    const trimmed = icdQuery.trim().toLowerCase();
    if (trimmed.length < 2) {
      setIcdSearchResults([]);
      setShowIcdDropdown(false);
      setIcdSearchLoading(false);
      return;
    }

    if (icdSearchCache.current[trimmed]) {
      setIcdSearchResults(icdSearchCache.current[trimmed]);
      setShowIcdDropdown(true);
      setIcdSearchLoading(false);
      return;
    }

    setIcdSearchLoading(true);
    setShowIcdDropdown(true);

    icdDebounceRef.current = setTimeout(async () => {
      try {
        const fromCatalog = await getSmartDiagnosis(trimmed);
        const fromPatient = diagnoses
          .filter(
            (d) =>
              d.code.toLowerCase().includes(trimmed) ||
              d.description.toLowerCase().includes(trimmed),
          )
          .map((d) => ({ code: d.code, description: d.description, context: 'Patient chart' }));

        const merged = new Map<string, { code: string; description: string; context?: string }>();
        [...fromPatient, ...fromCatalog].forEach((item) => {
          if (!merged.has(item.code)) merged.set(item.code, item);
        });

        const results = Array.from(merged.values());
        icdSearchCache.current[trimmed] = results;
        setIcdSearchResults(results);
      } catch {
        setIcdSearchResults([]);
      } finally {
        setIcdSearchLoading(false);
      }
    }, 150);

    return () => {
      if (icdDebounceRef.current) clearTimeout(icdDebounceRef.current);
    };
  }, [icdQuery, diagnoses, isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setPurposeOfVisit('');
    setComplaints(['']);
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setIcdDiagnoses([]);
    setError('');
    setIcdSuggestions([]);
    setSuggestIcdMessage('');
    setIcdQuery('');
    setIcdSearchResults([]);
    setShowIcdDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addIcdDiagnosis = (item: { code: string; description: string }) => {
    setIcdDiagnoses((prev) => {
      if (prev.some((d) => d.code === item.code)) return prev;
      return [...prev, { code: item.code, description: item.description }];
    });
    setIcdQuery('');
    setIcdSearchResults([]);
    setShowIcdDropdown(false);
    setError('');
  };

  const removeIcdDiagnosis = (code: string) => {
    setIcdDiagnoses((prev) => prev.filter((d) => d.code !== code));
  };

  const handleSuggestIcd = async () => {
    const hasContent =
      purposeOfVisit.trim() ||
      assessment.trim() ||
      subjective.trim() ||
      complaints.some((c) => c.trim());

    if (!hasContent) {
      setSuggestIcdMessage('Enter purpose of visit, complaints, or assessment before suggesting ICD codes.');
      setIcdSuggestions([]);
      return;
    }

    setSuggestingIcd(true);
    setSuggestIcdMessage('');
    try {
      const results = await suggestIcdFromSoapText({
        purposeOfVisit,
        complaints,
        subjective,
        assessment,
        plan,
      });
      setIcdSuggestions(results);
      setSuggestIcdMessage(
        results.length === 0
          ? 'No ICD suggestions matched this note. Add more clinical detail or search manually.'
          : 'AI draft suggestions — click to add one or more codes.',
      );
    } catch {
      setSuggestIcdMessage('Unable to generate ICD suggestions. Please try again.');
      setIcdSuggestions([]);
    } finally {
      setSuggestingIcd(false);
    }
  };

  const applySuggestedIcd = (suggestion: SuggestedIcdCode) => {
    addIcdDiagnosis({ code: suggestion.code, description: suggestion.description });
  };

  const addComplaint = () => {
    setComplaints((prev) => [...prev, '']);
  };

  const updateComplaint = (index: number, value: string) => {
    setComplaints((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeComplaint = (index: number) => {
    setComplaints((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
  };

  const handleSave = () => {
    if (!purposeOfVisit.trim()) {
      setError('Please enter the purpose of visit.');
      return;
    }
    if (icdDiagnoses.length === 0) {
      setError('Please add at least one ICD-10 diagnosis.');
      return;
    }

    onSave({
      purposeOfVisit: purposeOfVisit.trim(),
      complaints: complaints.map((c) => c.trim()).filter(Boolean),
      subjective: subjective.trim(),
      objective: objective.trim(),
      assessment: assessment.trim(),
      plan: plan.trim(),
      icdDiagnoses,
    });

    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Medical Notes</h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                {formSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <WhisperTextArea
              id="purpose-of-visit"
              label="Purpose of Visit"
              value={purposeOfVisit}
              onChange={(value) => {
                setPurposeOfVisit(value);
                setError('');
              }}
              rows={3}
              placeholder="Describe the reason for today's visit..."
              className={fieldClassName}
              labelClassName={labelClassName}
              applyVoiceCommands
              whisperPrompt="SOAP purpose of visit."
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClassName}>Complaints</label>
                <button
                  type="button"
                  onClick={addComplaint}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Plus size={14} />
                  Add Complaint
                </button>
              </div>
              <div className="space-y-2">
                {complaints.map((complaint, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <input
                      type="text"
                      value={complaint}
                      onChange={(e) => updateComplaint(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      placeholder={`Complaint ${index + 1}`}
                      className={`${fieldClassName} resize-none py-2.5`}
                    />
                    {complaints.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          requestDelete(
                            () => removeComplaint(index),
                            {
                              itemLabel: complaint.trim() || `Complaint ${index + 1}`,
                              message: 'It will be removed from this document.',
                            },
                          )
                        }
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                        aria-label="Remove complaint"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Diagnosis</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <WhisperTextArea
                  id="subjective"
                  label="Subjective"
                  value={subjective}
                  onChange={setSubjective}
                  rows={5}
                  placeholder="Patient-reported symptoms and history..."
                  className={fieldClassName}
                  labelClassName={labelClassName}
                  applyVoiceCommands
                  whisperPrompt="SOAP subjective."
                />
                <WhisperTextArea
                  id="objective"
                  label="Objective"
                  value={objective}
                  onChange={setObjective}
                  rows={5}
                  placeholder="Clinical findings, vitals, and exam results..."
                  className={fieldClassName}
                  labelClassName={labelClassName}
                  applyVoiceCommands
                  whisperPrompt="SOAP objective."
                />
              </div>

              <WhisperTextArea
                id="assessment"
                label="Assessment"
                value={assessment}
                onChange={setAssessment}
                rows={4}
                placeholder="Clinical impression and diagnostic reasoning..."
                className={fieldClassName}
                labelClassName={labelClassName}
                applyVoiceCommands
                whisperPrompt="SOAP assessment."
              />

              <WhisperTextArea
                id="plan"
                label="Plan"
                value={plan}
                onChange={setPlan}
                rows={4}
                placeholder="Treatment plan, follow-up, and recommendations..."
                className={fieldClassName}
                labelClassName={labelClassName}
                applyVoiceCommands
                whisperPrompt="SOAP plan."
              />

              <p className="text-[10px] font-medium text-slate-400">
                Select English or Arabic. Live updates ~2s; final polish on &quot;stop&quot; or mic tap.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className={labelClassName} htmlFor="icd10-search">
                  ICD-10 Diagnoses
                </label>
                <button
                  type="button"
                  onClick={handleSuggestIcd}
                  disabled={suggestingIcd}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {suggestingIcd ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Suggest from note
                </button>
              </div>

              <div ref={icdSearchRef} className="relative">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="icd10-search"
                    type="text"
                    value={icdQuery}
                    onChange={(e) => setIcdQuery(e.target.value)}
                    onFocus={() => {
                      if (icdQuery.trim().length >= 2) setShowIcdDropdown(true);
                    }}
                    placeholder="Search by ICD-10 code or diagnosis text..."
                    className={`${fieldClassName} pl-10 py-2.5 resize-none`}
                    autoComplete="off"
                  />
                  {icdSearchLoading && (
                    <Loader2
                      size={15}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin"
                    />
                  )}
                </div>

                {showIcdDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {icdSearchResults.length === 0 && !icdSearchLoading ? (
                      <p className="px-4 py-3 text-xs text-slate-400 font-medium">No matching diagnoses</p>
                    ) : (
                      icdSearchResults.map((item) => {
                        const alreadyAdded = icdDiagnoses.some((d) => d.code === item.code);
                        return (
                          <button
                            key={item.code}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => addIcdDiagnosis(item)}
                            className={`w-full text-left px-4 py-2.5 border-b border-slate-50 last:border-0 transition-colors ${
                              alreadyAdded
                                ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                                : 'hover:bg-indigo-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-800 font-mono">{item.code}</span>
                              {alreadyAdded && (
                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                                  Added
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 mt-0.5">{item.description}</p>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {icdDiagnoses.length > 0 ? (
                <div className="space-y-2">
                  {icdDiagnoses.map((item) => (
                    <div
                      key={item.code}
                      className="flex items-start justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-indigo-900 font-mono">{item.code}</p>
                        <p className="text-[11px] font-medium text-indigo-700 mt-0.5">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          requestDelete(
                            () => removeIcdDiagnosis(item.code),
                            {
                              itemLabel: `${item.code} — ${item.description}`,
                              message: 'It will be removed from this SOAP document.',
                            },
                          )
                        }
                        className="p-1.5 text-indigo-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all shrink-0"
                        aria-label={`Remove ${item.code}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] font-medium text-slate-400 italic px-1">
                  No ICD-10 diagnoses added yet. Search by code or description above.
                </p>
              )}

              {suggestIcdMessage && (
                <p className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  {suggestIcdMessage}
                </p>
              )}

              {icdSuggestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  {icdSuggestions.map((suggestion) => {
                    const alreadyAdded = icdDiagnoses.some((d) => d.code === suggestion.code);
                    return (
                      <button
                        key={suggestion.code}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => applySuggestedIcd(suggestion)}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                          alreadyAdded
                            ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">{suggestion.code}</span>
                          <span
                            className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                              alreadyAdded
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : suggestion.confidence === 'High'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : suggestion.confidence === 'Medium'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {alreadyAdded ? 'Added' : suggestion.confidence}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 mt-0.5">{suggestion.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Matched: {suggestion.matchedTerms.join(', ')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {ConfirmDeleteDialog}
    </div>
  );
};

export default SOAPDocumentForm;

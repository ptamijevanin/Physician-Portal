import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { SapInstitution } from '../services/sapAuthService';

interface InstitutionSelectorModalProps {
  isOpen: boolean;
  institutions: SapInstitution[];
  selectedInstitution: SapInstitution | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (institution: SapInstitution) => void;
  onClose: () => void;
}

const InstitutionSelectorModal: React.FC<InstitutionSelectorModalProps> = ({
  isOpen,
  institutions,
  selectedInstitution,
  isLoading,
  error,
  onRetry,
  onSelect,
  onClose,
}) => {
  const [chosenId, setChosenId] = useState(selectedInstitution?.id || '');

  useEffect(() => {
    if (isOpen) setChosenId(selectedInstitution?.id || '');
  }, [isOpen, selectedInstitution?.id]);

  if (!isOpen) return null;

  const chosenInstitution = institutions.find((institution) => institution.id === chosenId);
  const canDismiss = !!selectedInstitution || (!isLoading && (!!error || institutions.length === 0));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="institution-selector-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Building2 size={19} /></span>
            <div>
              <h2 id="institution-selector-title" className="text-base font-semibold text-slate-900">Select Institution</h2>
              <p className="mt-1 text-xs text-slate-500">Choose the Institution for this session.</p>
            </div>
          </div>
          {canDismiss && (
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close institution selector">
              <X size={18} />
            </button>
          )}
        </header>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto p-4 sm:p-5">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin text-blue-600" /> Loading Institution...
            </div>
          )}
          {!isLoading && error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">{error}</div>
              <button type="button" onClick={onRetry} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-rose-100" aria-label="Retry loading institutions">
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}
          {!isLoading && !error && institutions.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">No Institution were returned for this user.</div>
          )}
          {!isLoading && institutions.map((institution) => {
            const isChosen = chosenId === institution.id;
            return (
              <button
                key={institution.id}
                type="button"
                onClick={() => setChosenId(institution.id)}
                aria-pressed={isChosen}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${isChosen ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-3">
                    <Building2 size={17} className={`mt-0.5 shrink-0 ${isChosen ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">Institution Name: {institution.name}</span>
                      <span className="mt-1 block text-[11px] text-slate-500">Institution ID: {institution.id}</span>
                    </span>
                  </span>
                  {isChosen && <Check size={17} className="shrink-0 text-blue-700" />}
                </span>
              </button>
            );
          })}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          {canDismiss && (
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/70">Cancel</button>
          )}
          <button
            type="button"
            disabled={!chosenInstitution || isLoading}
            onClick={() => chosenInstitution && onSelect(chosenInstitution)}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Use institution
          </button>
        </footer>
      </section>
    </div>
  );
};

export default InstitutionSelectorModal;
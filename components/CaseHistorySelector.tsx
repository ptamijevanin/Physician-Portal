import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { PatientCaseSummary } from '../types';

interface CaseHistorySelectorProps {
  cases: PatientCaseSummary[];
  selectedCaseNumber: string;
  primaryCaseNumber?: string;
  onCaseChange: (caseNumber: string) => void;
}

const CaseHistorySelector: React.FC<CaseHistorySelectorProps> = ({
  cases,
  selectedCaseNumber,
  primaryCaseNumber,
  onCaseChange,
}) => {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCase = cases.find((c) => c.caseNumber === selectedCaseNumber) || cases[0];
  const showHistoricalBadge = selectedCase?.status === 'Closed';
  const showActiveBadge =
    selectedCase?.status === 'Active' &&
    !!primaryCaseNumber &&
    selectedCaseNumber !== primaryCaseNumber;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = containerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;

      if (isMobile) {
        const gutter = 16;
        setPanelStyle({
          position: 'fixed',
          top: Math.min(rect.bottom + 8, window.innerHeight - 80),
          left: gutter,
          right: gutter,
          width: 'auto',
          maxWidth: 'none',
        });
      } else {
        setPanelStyle({
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 'auto',
          marginTop: 8,
          width: Math.min(320, window.innerWidth - 32),
          maxWidth: 'calc(100vw - 2rem)',
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  if (!selectedCase || cases.length <= 1) {
    return (
      <span className="text-blue-600 font-bold">
        Case: {selectedCaseNumber || 'N/A'}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-700 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <History size={11} className="shrink-0" />
        <span>Case: {selectedCaseNumber}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        {showHistoricalBadge && (
          <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
            Historical
          </span>
        )}
        {showActiveBadge && (
          <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
            Active
          </span>
        )}
      </button>

      {open && (
        <div
          className="z-[120] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={panelStyle}
        >
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Case History</p>
          </div>
          <ul className="max-h-[min(16rem,50vh)] overflow-y-auto py-1" role="listbox">
            {cases.map((patientCase) => {
              const isSelected = patientCase.caseNumber === selectedCaseNumber;
              return (
                <li key={patientCase.caseNumber}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onCaseChange(patientCase.caseNumber);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 font-mono truncate">
                        {patientCase.caseNumber}
                      </span>
                      <span
                        className={`shrink-0 text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          patientCase.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {patientCase.status}
                      </span>
                    </div>
                    <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mt-1 truncate">
                      {patientCase.department} · {patientCase.admissionDate}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">{patientCase.diagnosis}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CaseHistorySelector;

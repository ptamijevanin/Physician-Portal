
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, Stethoscope, ShieldCheck, Check, AlertCircle, Clock, X, ArrowLeft } from 'lucide-react';
import { getSmartDiagnosis } from '../services/geminiService';
import { Diagnosis } from '../types';
import ModulePageHeader from './ModulePageHeader';
import { useConfirmDelete } from '../hooks/useConfirmDelete';

interface DiagnosisViewProps {
  diagnoses: Diagnosis[];
  onUpdate: (diagnoses: Diagnosis[]) => void;
  readOnly?: boolean;
}

const DiagnosisView: React.FC<DiagnosisViewProps> = ({ diagnoses, onUpdate, readOnly }) => {
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState<Diagnosis['type']>('Admitting');
  const [selectedMarkers, setSelectedMarkers] = useState<Diagnosis['markers']>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState<'search' | 'review'>('search');
  const [selectedDiag, setSelectedDiag] = useState<any | null>(null);
  const searchCache = useRef<Record<string, any[]>>({});
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ICD-10 suggestions with debouncing and cache
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.length >= 2) {
      const trimmedQuery = query.trim().toLowerCase();

      if (searchCache.current[trimmedQuery]) {
        setResults(searchCache.current[trimmedQuery]);
        setLoading(false);
        setShowDropdown(true);
        return;
      }

      setLoading(true);
      setShowDropdown(true);

      debounceTimer.current = setTimeout(async () => {
        try {
          const data = await getSmartDiagnosis(trimmedQuery);
          searchCache.current[trimmedQuery] = data;
          setResults(data);
        } catch (e) {
          console.error(e);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 150);
    } else {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const closeAddModal = () => {
    setShowAddModal(false);
    setModalStep('search');
    setSelectedDiag(null);
    setQuery('');
    setResults([]);
    setSelectedMarkers([]);
    setSelectedType('Admitting');
    setShowDropdown(false);
  };

  const handleSelectDiagnosis = (item: any) => {
    setSelectedDiag(item);
    if (window.matchMedia('(max-width: 767px)').matches) {
      setModalStep('review');
    }
  };

  const saveDiagnosis = () => {
    if (!selectedDiag) return;

    const newDiag: Diagnosis = {
      id: Math.random().toString(),
      code: selectedDiag.code,
      description: selectedDiag.description,
      date: new Date().toISOString().split('T')[0],
      status: 'Active',
      type: selectedType,
      markers: selectedMarkers
    };
    onUpdate([newDiag, ...diagnoses]);
    closeAddModal();
  };

  const openAddModal = () => {
    setSelectedDiag(null);
    setQuery('');
    setResults([]);
    setSelectedMarkers([]);
    setSelectedType('Admitting');
    setModalStep('search');
    setShowAddModal(true);
  };

  const diagTypes: Diagnosis['type'][] = ['Admitting', 'Discharge', 'Pre-Operative', 'Post-Operative'];
  const markerOptions: NonNullable<Diagnosis['markers']>[number][] = ['Confirmed', 'Chronic', 'Secondary'];

  const toggleMarker = (marker: NonNullable<Diagnosis['markers']>[number]) => {
    setSelectedMarkers(prev => 
      prev?.includes(marker) ? prev.filter(m => m !== marker) : [...(prev || []), marker]
    );
  };

  const getTypeBadgeClass = (type: Diagnosis['type']) => {
    switch (type) {
      case 'Discharge':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Pre-Operative':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Post-Operative':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <ModulePageHeader
        title="Diagnoses"
        subtitle="ICD-10 codes, types, and diagnostic markers"
        actions={
          !readOnly ? (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900 w-full sm:w-auto"
            >
              <Plus size={13} />
              Add Diagnosis
            </button>
          ) : undefined
        }
      />
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Stethoscope size={18} />
            </div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Diagnostic Log</h4>
          </div>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100">
            {diagnoses.length} Records
          </span>
        </div>
        <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
          {diagnoses.length > 0 ? diagnoses.map((diag) => (
            <div
              key={diag.id}
              className="group text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-slate-700 shrink-0">{diag.code}</span>
                  <span className="text-slate-600 truncate">{diag.description}</span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      requestDelete(
                        () => onUpdate(diagnoses.filter((d) => d.id !== diag.id)),
                        { itemLabel: `${diag.code} — ${diag.description}` },
                      )
                    }
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                    aria-label={`Remove ${diag.code}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${getTypeBadgeClass(diag.type)}`}>
                  {diag.type}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={10} />
                  {diag.date}
                </span>
                {diag.markers?.map(m => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-md border border-slate-200 bg-white text-[10px] font-medium text-slate-500 uppercase tracking-wider"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )) : (
            <p className="text-xs font-medium text-slate-400 italic">No active diagnoses</p>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {modalStep === 'review' && (
                  <button
                    type="button"
                    onClick={() => setModalStep('search')}
                    className="md:hidden p-2 -ml-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0"
                    aria-label="Back to search"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Stethoscope size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {modalStep === 'review' ? 'Configure Diagnosis' : 'Add New Diagnosis'}
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {modalStep === 'review' ? 'Set category and clinical markers' : 'Search ICD-10 database'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Mobile: step-based flow */}
              <div className="md:hidden">
                {modalStep === 'search' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Search ICD-10
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                          type="text"
                          autoFocus
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Diagnosis or ICD code..."
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium text-slate-800 transition-all"
                        />
                        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
                      </div>
                    </div>
                    <DiagnosisSearchResults
                      query={query}
                      loading={loading}
                      results={results}
                      selectedCode={selectedDiag?.code}
                      onSelect={handleSelectDiagnosis}
                    />
                  </div>
                ) : selectedDiag ? (
                  <DiagnosisReviewPanel
                    selectedDiag={selectedDiag}
                    selectedType={selectedType}
                    selectedMarkers={selectedMarkers}
                    diagTypes={diagTypes}
                    markerOptions={markerOptions}
                    onTypeChange={setSelectedType}
                    onToggleMarker={toggleMarker}
                    onSave={saveDiagnosis}
                  />
                ) : null}
              </div>

              {/* Desktop: side-by-side */}
              <div className="hidden md:grid md:grid-cols-12 gap-6">
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Search ICD-10
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Diagnosis or ICD code..."
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium text-slate-800 transition-all"
                      />
                      {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
                    </div>
                  </div>
                  <DiagnosisSearchResults
                    query={query}
                    loading={loading}
                    results={results}
                    selectedCode={selectedDiag?.code}
                    onSelect={handleSelectDiagnosis}
                  />
                </div>
                <div className="md:col-span-5">
                  {selectedDiag ? (
                    <DiagnosisReviewPanel
                      selectedDiag={selectedDiag}
                      selectedType={selectedType}
                      selectedMarkers={selectedMarkers}
                      diagTypes={diagTypes}
                      markerOptions={markerOptions}
                      onTypeChange={setSelectedType}
                      onToggleMarker={toggleMarker}
                      onSave={saveDiagnosis}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 min-h-[280px]">
                      <ShieldCheck size={28} className="text-slate-200 mb-3" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a diagnosis</p>
                      <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest mt-1">
                        Choose from search results to configure
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={closeAddModal}
                className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              {selectedDiag && (
                <button
                  type="button"
                  onClick={saveDiagnosis}
                  className="md:hidden inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all"
                >
                  <Check size={14} />
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {ConfirmDeleteDialog}
    </div>
  );
};

interface DiagnosisSearchResultsProps {
  query: string;
  loading: boolean;
  results: any[];
  selectedCode?: string;
  onSelect: (item: any) => void;
}

const DiagnosisSearchResults: React.FC<DiagnosisSearchResultsProps> = ({
  query,
  loading,
  results,
  selectedCode,
  onSelect,
}) => (
  <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden min-h-[200px] sm:min-h-[280px] max-h-[40vh] sm:max-h-[320px] flex flex-col">
    {loading && results.length === 0 ? (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-100 animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-1/4 mb-2" />
            <div className="h-2 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    ) : query.length >= 2 ? (
      <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
        {results.length > 0 ? (
          results.map((res, i) => {
            const isSelected = selectedCode === res.code;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(res)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-700 text-xs font-medium shrink-0">{res.code}</span>
                      <span className="text-slate-600 text-xs font-medium truncate">{res.description}</span>
                    </div>
                    {res.context && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{res.context}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          !loading && (
            <div className="py-10 text-center">
              <AlertCircle size={24} className="mx-auto text-slate-200 mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching codes</p>
            </div>
          )
        )}
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Search size={24} className="text-slate-200 mb-2" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter diagnosis to search</p>
      </div>
    )}
  </div>
);

interface DiagnosisReviewPanelProps {
  selectedDiag: any;
  selectedType: Diagnosis['type'];
  selectedMarkers: Diagnosis['markers'];
  diagTypes: Diagnosis['type'][];
  markerOptions: NonNullable<Diagnosis['markers']>[number][];
  onTypeChange: (type: Diagnosis['type']) => void;
  onToggleMarker: (marker: NonNullable<Diagnosis['markers']>[number]) => void;
  onSave: () => void;
}

const DiagnosisReviewPanel: React.FC<DiagnosisReviewPanelProps> = ({
  selectedDiag,
  selectedType,
  selectedMarkers,
  diagTypes,
  markerOptions,
  onTypeChange,
  onToggleMarker,
  onSave,
}) => (
  <div className="space-y-4">
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-slate-700 text-xs font-medium shrink-0">{selectedDiag.code}</span>
        <span className="text-slate-600 text-xs font-medium truncate">{selectedDiag.description}</span>
      </div>
    </div>

    <div className="space-y-2">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Encounter Category</span>
      <div className="grid grid-cols-2 gap-2">
        {diagTypes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={`px-2.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all border ${
              selectedType === t
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinical Markers</span>
      <div className="flex flex-wrap gap-2">
        {markerOptions.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onToggleMarker(m)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all border ${
              selectedMarkers?.includes(m)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {selectedMarkers?.includes(m) && <Check size={10} className="inline mr-1" />}
            {m}
          </button>
        ))}
      </div>
    </div>

    <button
      type="button"
      onClick={onSave}
      className="hidden md:flex w-full items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all"
    >
      <Check size={14} />
      Save Diagnosis
    </button>
  </div>
);

export default DiagnosisView;

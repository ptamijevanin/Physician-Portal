
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Trash2, Loader2, Pill, AlertCircle, X, Check, ShieldCheck, Activity, Printer, ArrowLeft } from 'lucide-react';
import { getSmartMedication } from '../services/geminiService';
import MedicationPrescriptionPDF from './MedicationPrescriptionPDF';
import { Medication, Patient } from '../types';
import ModulePageHeader from './ModulePageHeader';
import { useConfirmDelete } from '../hooks/useConfirmDelete';

interface CaseDetails {
  caseNumber: string;
  admissionDate: string;
  deptOu: string;
  attendingPhysician: string;
  wardBed: string;
}

interface MedicationModuleProps {
  medications: Medication[];
  onUpdate: (medications: Medication[]) => void;
  patient: Patient;
  caseDetails: CaseDetails;
  readOnly?: boolean;
}

const MedicationModule: React.FC<MedicationModuleProps> = ({ medications, onUpdate, patient, caseDetails, readOnly }) => {
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState<'search' | 'review'>('search');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchCache = useRef<Record<string, any[]>>({});
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [newMed, setNewMed] = useState({
    dosage: '',
    frequency: 'Once Daily',
    route: 'Oral',
    validityDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default 1 week from now
    responsibleEmployee: 'Dr. Sarah Connor'
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          const data = await getSmartMedication(trimmedQuery);
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

  const defaultNewMed = () => ({
    dosage: '',
    frequency: 'Once Daily',
    route: 'Oral',
    validityDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    responsibleEmployee: 'Dr. Sarah Connor',
  });

  const closeAddModal = () => {
    setShowAddModal(false);
    setModalStep('search');
    setSelectedDrug(null);
    setQuery('');
    setResults([]);
    setNewMed(defaultNewMed());
  };

  const handleSelectMedication = (item: any) => {
    setSelectedDrug(item);
    setNewMed((prev) => ({
      ...prev,
      dosage: item.dosage?.split(',')[0] || prev.dosage || 'As directed',
    }));
    if (window.matchMedia('(max-width: 767px)').matches) {
      setModalStep('review');
    }
  };

  const saveMedication = () => {
    if (!selectedDrug) return;

    const validityDays = selectedDrug.defaultValidityDays || 7;
    const validityDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    const med: Medication = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedDrug.brandName || selectedDrug.genericName,
      genericName: selectedDrug.genericName,
      dosage: newMed.dosage || 'As directed',
      frequency: newMed.frequency,
      route: newMed.route,
      startDate: new Date().toISOString().split('T')[0],
      validityDate: newMed.validityDate || validityDate,
      responsibleEmployee: newMed.responsibleEmployee,
      status: 'Signed',
    };
    onUpdate([med, ...medications]);
    closeAddModal();
  };

  const getMedicationStatus = (validityDate?: string) => {
    if (!validityDate) return 'Signed';
    const now = new Date();
    const validity = new Date(validityDate);
    return validity > now ? 'Signed' : 'Completed';
  };

  const activeMedications = useMemo(
    () => medications.filter((med) => getMedicationStatus(med.validityDate) === 'Signed'),
    [medications],
  );

  const selectedMedications = useMemo(
    () => activeMedications.filter((med) => selectedForPrint.has(med.id)),
    [activeMedications, selectedForPrint],
  );

  const allActiveSelected =
    activeMedications.length > 0 && activeMedications.every((med) => selectedForPrint.has(med.id));

  const toggleMedicationSelection = (medId: string) => {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(medId)) next.delete(medId);
      else next.add(medId);
      return next;
    });
  };

  const toggleSelectAllActive = () => {
    if (allActiveSelected) {
      setSelectedForPrint(new Set());
      return;
    }
    setSelectedForPrint(new Set(activeMedications.map((med) => med.id)));
  };

  const handlePrintPrescriptions = () => {
    if (selectedMedications.length === 0) return;
    setShowPrintPreview(true);
  };

  const frequencies = ['Once Daily', 'Twice Daily', 'Three Times Daily', 'Four Times Daily', 'Every 4 Hours', 'Every 6 Hours', 'Every 8 Hours', 'As Needed (PRN)', 'At Bedtime'];
  const routes = ['Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical', 'Inhalation'];

  const openAddModal = () => {
    setSelectedDrug(null);
    setQuery('');
    setResults([]);
    setNewMed(defaultNewMed());
    setModalStep('search');
    setShowAddModal(true);
  };

  const getDrugKey = (drug: any) => drug.brandName || drug.genericName;

  const confirmRemoveMedication = (med: Medication) => {
    requestDelete(
      () => onUpdate(medications.filter((m) => m.id !== med.id)),
      { itemLabel: med.name },
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <ModulePageHeader
        title="Medication"
        subtitle="Active prescriptions and drug orders"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {!readOnly && (
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900"
              >
                <Plus size={13} />
                Add Medication
              </button>
            )}
            <button
              type="button"
              onClick={handlePrintPrescriptions}
              disabled={selectedMedications.length === 0}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-semibold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print Selected ({selectedMedications.length})</span>
              <span className="sm:hidden">Print ({selectedMedications.length})</span>
            </button>
          </div>
        }
      />
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Pill size={18} />
            </div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Medications</h4>
          </div>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100">
            {medications.length} Records
          </span>
        </div>

        {activeMedications.length > 0 && (
          <label className="flex items-center gap-2 mb-3 text-[10px] font-medium text-slate-500 uppercase tracking-widest cursor-pointer">
            <input
              type="checkbox"
              checked={allActiveSelected}
              onChange={toggleSelectAllActive}
              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Select all for print
          </label>
        )}

        <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
          {medications.length > 0 ? medications.map((med) => {
            const isActive = getMedicationStatus(med.validityDate) === 'Signed';
            const status = getMedicationStatus(med.validityDate);
            return (
              <div
                key={med.id}
                className="group text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedForPrint.has(med.id)}
                      onChange={() => toggleMedicationSelection(med.id)}
                      disabled={!isActive}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30 shrink-0"
                      aria-label={`Select ${med.name} for printing`}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 min-w-0 flex-1">
                      <span className="text-slate-700 shrink-0">{med.name}</span>
                      <span className="text-slate-600 sm:ml-2 truncate">
                        {med.dosage} — {med.frequency}
                      </span>
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => confirmRemoveMedication(med)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                      aria-label={`Remove ${med.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-5">
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${
                      status === 'Signed'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {status}
                  </span>
                  <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-white text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {med.route}
                  </span>
                  {med.genericName && med.genericName !== med.name && (
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
                      {med.genericName}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    End: {med.validityDate?.replace('T', ' ') || 'N/A'}
                  </span>
                  {med.responsibleEmployee && (
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate max-w-[160px]">
                      {med.responsibleEmployee}
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            <p className="text-xs font-medium text-slate-400 italic">No active medications</p>
          )}
        </div>
      </div>

      <MedicationPrescriptionPDF
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        patient={patient}
        caseDetails={caseDetails}
        medications={selectedMedications}
      />

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
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <Pill size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {modalStep === 'review' ? 'Configure Prescription' : 'New Medication Order'}
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {modalStep === 'review' ? 'Set dosage, route and frequency' : 'Search medication database'}
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
              <div className="md:hidden">
                {modalStep === 'search' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Search Medication
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                          type="text"
                          autoFocus
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Brand or generic name..."
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium text-slate-800 transition-all"
                        />
                        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
                      </div>
                    </div>
                    <MedicationSearchResults
                      query={query}
                      loading={loading}
                      results={results}
                      selectedKey={selectedDrug ? getDrugKey(selectedDrug) : undefined}
                      onSelect={handleSelectMedication}
                    />
                  </div>
                ) : selectedDrug ? (
                  <MedicationReviewPanel
                    selectedDrug={selectedDrug}
                    newMed={newMed}
                    frequencies={frequencies}
                    routes={routes}
                    onMedChange={setNewMed}
                    onSave={saveMedication}
                  />
                ) : null}
              </div>

              <div className="hidden md:grid md:grid-cols-12 gap-6">
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Search Medication
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Brand or generic name..."
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium text-slate-800 transition-all"
                      />
                      {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
                    </div>
                  </div>
                  <MedicationSearchResults
                    query={query}
                    loading={loading}
                    results={results}
                    selectedKey={selectedDrug ? getDrugKey(selectedDrug) : undefined}
                    onSelect={handleSelectMedication}
                  />
                </div>
                <div className="md:col-span-5">
                  {selectedDrug ? (
                    <MedicationReviewPanel
                      selectedDrug={selectedDrug}
                      newMed={newMed}
                      frequencies={frequencies}
                      routes={routes}
                      onMedChange={setNewMed}
                      onSave={saveMedication}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 min-h-[280px]">
                      <Activity size={28} className="text-slate-200 mb-3" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a medication</p>
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
              {selectedDrug && (
                <button
                  type="button"
                  onClick={saveMedication}
                  className="md:hidden inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all"
                >
                  <Check size={14} />
                  Save & Sign
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

interface MedicationSearchResultsProps {
  query: string;
  loading: boolean;
  results: any[];
  selectedKey?: string;
  onSelect: (item: any) => void;
}

const MedicationSearchResults: React.FC<MedicationSearchResultsProps> = ({
  query,
  loading,
  results,
  selectedKey,
  onSelect,
}) => (
  <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden min-h-[200px] sm:min-h-[280px] max-h-[40vh] sm:max-h-[320px] flex flex-col">
    {loading && results.length === 0 ? (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-100 animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-2 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    ) : query.length >= 2 ? (
      <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
        {results.length > 0 ? (
          results.map((res, i) => {
            const key = res.brandName || res.genericName;
            const isSelected = selectedKey === key;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(res)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-white border-emerald-200 shadow-sm ring-1 ring-emerald-100'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-slate-700 text-xs font-medium shrink-0">
                        {res.brandName || res.genericName}
                      </span>
                      {res.stock < 50 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium uppercase tracking-wider">
                          Low Stock
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 truncate">{res.genericName}</p>
                    <p className="text-[10px] font-medium text-emerald-600/80 mt-0.5">
                      Validity: {res.defaultValidityDays} days
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                      isSelected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching medications</p>
            </div>
          )
        )}
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Search size={24} className="text-slate-200 mb-2" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter drug name to search</p>
      </div>
    )}
  </div>
);

interface MedicationReviewPanelProps {
  selectedDrug: any;
  newMed: {
    dosage: string;
    frequency: string;
    route: string;
    validityDate: string;
    responsibleEmployee: string;
  };
  frequencies: string[];
  routes: string[];
  onMedChange: React.Dispatch<React.SetStateAction<MedicationReviewPanelProps['newMed']>>;
  onSave: () => void;
}

const medFieldClass =
  'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium text-slate-800 transition-all';

const MedicationReviewPanel: React.FC<MedicationReviewPanelProps> = ({
  selectedDrug,
  newMed,
  frequencies,
  routes,
  onMedChange,
  onSave,
}) => (
  <div className="space-y-4">
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
      <div className="text-slate-700 text-xs font-medium">{selectedDrug.brandName || selectedDrug.genericName}</div>
      <div className="text-slate-500 text-[10px] font-medium mt-0.5 truncate">{selectedDrug.genericName}</div>
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dosage</label>
      <input
        type="text"
        value={newMed.dosage}
        onChange={(e) => onMedChange({ ...newMed, dosage: e.target.value })}
        placeholder="e.g. 500mg"
        className={medFieldClass}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Route</label>
        <select
          value={newMed.route}
          onChange={(e) => onMedChange({ ...newMed, route: e.target.value })}
          className={medFieldClass}
        >
          {routes.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frequency</label>
        <select
          value={newMed.frequency}
          onChange={(e) => onMedChange({ ...newMed, frequency: e.target.value })}
          className={medFieldClass}
        >
          {frequencies.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End Date (Optional)</label>
      <input
        type="datetime-local"
        value={newMed.validityDate}
        onChange={(e) => onMedChange({ ...newMed, validityDate: e.target.value })}
        className={medFieldClass}
      />
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Responsible Employee</label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
        <input
          type="text"
          value={newMed.responsibleEmployee}
          onChange={(e) => onMedChange({ ...newMed, responsibleEmployee: e.target.value })}
          className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-800"
        />
      </div>
    </div>

    <button
      type="button"
      onClick={onSave}
      className="hidden md:flex w-full items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all"
    >
      <Check size={14} />
      Save & Sign Prescription
    </button>
  </div>
);

export default MedicationModule;


import React, { useState, useRef, useEffect } from 'react';
import { ViewType, Patient, PatientCaseSummary } from '../types';
import CaseHistorySelector from './CaseHistorySelector';
import { physicianProfileService, PhysicianProfileState } from '../services/physicianProfileService';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  UserCircle,
  Search,
  Bell,
  Menu,
  X,
  AlertTriangle,
  Info,
  LogOut,
  Phone,
  Mail,
  Award,
  ChevronRight,
  ChevronDown,
  Stethoscope,
  Plus,
  Check,
  ShieldCheck as ShieldIcon,
  Crown,
  ArrowLeft,
  Bed,
  Activity,
  MapPin,
  Clock,
  UserRound,
  Building2,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setView: (view: ViewType) => void;
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient) => void;
  patients: Patient[];
  onLogout: () => void;
  selectedCaseNumber?: string;
  onCaseChange?: (caseNumber: string) => void;
  patientCases?: PatientCaseSummary[];
  currentUser?: string | null;
}

const calculateAge = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const formatDisplayDate = (dateValue: string) => {
  if (!dateValue) return 'N/A';
  if (dateValue.includes('.')) return dateValue;
  const [year, month, day] = dateValue.split('-');
  if (!year || !month || !day) return dateValue;
  return `${day}.${month}.${year}`;
};

const calculateLengthOfStay = (admissionDate: string) => {
  if (!admissionDate) return 'N/A';
  const normalized = admissionDate.includes('.')
    ? admissionDate.split('.').reverse().join('-')
    : admissionDate;
  const admission = new Date(normalized);
  if (Number.isNaN(admission.getTime())) return 'N/A';
  const today = new Date();
  const start = new Date(admission.getFullYear(), admission.getMonth(), admission.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'Day 0';
  if (days === 1) return '1 day';
  return `${days} days`;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  setView,
  selectedPatient,
  setSelectedPatient,
  patients,
  onLogout,
  selectedCaseNumber = '',
  onCaseChange,
  patientCases = [],
  currentUser,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPhysicianInfo, setShowPhysicianInfo] = useState(false);
  const [clinicalAlertsExpanded, setClinicalAlertsExpanded] = useState(false);
  const [profile, setProfile] = useState<PhysicianProfileState>(() => physicianProfileService.getProfile());
  const searchRef = useRef<HTMLDivElement>(null);
  const physicianModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return physicianProfileService.subscribe(setProfile);
  }, []);

  const selectedCase =
    patientCases.find((c) => c.caseNumber === selectedCaseNumber) ||
    patientCases.find((c) => c.caseNumber === selectedPatient?.caseNumber) ||
    patientCases[0];
  const isInpatient = selectedCase?.caseType === 'Inpatient';
  const isOutpatient = selectedCase?.caseType === 'Outpatient';

  useEffect(() => {
    setClinicalAlertsExpanded(false);
  }, [selectedPatient?.id]);

  const handleBack = () => {
    setView(ViewType.DASHBOARD);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearchResults(false);
      if (physicianModalRef.current && !physicianModalRef.current.contains(event.target as Node)) setShowPhysicianInfo(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setView(ViewType.PATIENT_DATA);
    setSearchQuery('');
    setShowSearchResults(false);
    setMobileNavOpen(false);
  };

  const handleNavClick = (view: ViewType) => {
    setView(view);
    setMobileNavOpen(false);
  };

  const menuItems = [
    { id: ViewType.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewType.AGENDA, label: 'Agenda', icon: CalendarDays },
    { id: ViewType.MY_PATIENTS, label: 'Active patients', icon: Users },
  ];

  const filteredPatients = searchQuery.trim() === '' 
    ? [] 
    : patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const showPatientHeader = selectedPatient && (activeView === ViewType.PATIENT_DATA);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`bg-slate-900 text-slate-400 transition-all duration-300 flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'} overflow-y-auto hidden md:flex flex-col border-r border-slate-200`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Stethoscope size={20} />
             </div>
             <h1 className={`font-bold text-xl tracking-tight text-white ${!isSidebarOpen && 'hidden'}`}>Physician Portal</h1>
          </div>
        </div>
        
        <nav className="mt-4 px-3 space-y-1 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-blue-600 text-white shadow-md font-semibold' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} className={activeView === item.id ? 'text-white' : 'text-slate-500'} />
              {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto p-4 border-t border-slate-800">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200">
            <Menu size={18} />
            {isSidebarOpen && <span className="text-sm font-medium">Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 min-h-16 flex items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-2 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            {activeView !== ViewType.DASHBOARD && (
              <button 
                onClick={handleBack}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="relative min-w-0 flex-1 max-w-md" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Find a patient..." 
                className="w-full min-w-0 pl-10 pr-3 py-2 bg-slate-100/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all border border-transparent focus:bg-white focus:border-blue-100"
              />
              {showSearchResults && filteredPatients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 w-full min-w-[16rem] sm:min-w-[20rem] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-80 overflow-y-auto">
                    {filteredPatients.map(p => (
                      <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left p-3 hover:bg-blue-50 flex items-center gap-4 border-b border-slate-50 last:border-0 transition-colors">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{p.name}</div>
                          <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-widest mt-0.5">ID: {p.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 sm:pl-4 sm:border-l sm:border-slate-200 relative">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-semibold text-slate-800 leading-none">
                  {profile.physician?.fullName || currentUser || 'Dr. Sarah Connor'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1.5 truncate max-w-[180px]">
                  {profile.specialties[0]?.specialtyName || profile.physician?.title || 'Consultant Cardiologist'}
                </div>
              </div>
              <button onClick={() => setShowPhysicianInfo(!showPhysicianInfo)} className="focus:outline-none transition-transform active:scale-95 group">
                <img src="https://picsum.photos/seed/doc/100/100" className="w-9 h-9 rounded-xl border-2 border-white shadow-sm group-hover:border-blue-600 transition-all" alt="Doctor" />
              </button>
              {showPhysicianInfo && (
                <div ref={physicianModalRef} className="fixed sm:absolute top-16 sm:top-full right-4 sm:right-0 left-4 sm:left-auto sm:mt-3 w-auto sm:w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-slate-900 p-5 text-white">
                    <div className="flex items-center gap-3">
                       <img src="https://picsum.photos/seed/doc/100/100" className="w-12 h-12 rounded-lg border border-white/20 shadow-md" alt="Dr Profile" />
                        <div>
                          <h3 className="font-bold text-sm leading-tight">{profile.physician?.fullName || currentUser || 'Dr. Sarah Connor'}</h3>
                          <div className="text-blue-400 text-[8px] font-semibold uppercase tracking-widest mt-1 truncate max-w-[170px]">
                            {profile.specialties[0]?.specialtyName || profile.physician?.title || 'Chief of Cardiology'}
                          </div>
                        </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 bg-white">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-slate-600 group">
                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors"><Phone size={12} className="text-blue-600" /></div>
                        <div className="flex flex-col"><span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Ext</span><span className="text-[11px] font-medium text-slate-800">{profile.physician?.extension || profile.physician?.phone || '+1 (555) 902-3412'}</span></div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 group">
                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors"><Mail size={12} className="text-blue-600" /></div>
                        <div className="flex flex-col"><span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Email</span><span className="text-[11px] font-medium text-slate-800 truncate max-w-[170px]">{profile.physician?.email || 's.connor@physicianportal.md'}</span></div>
                      </div>
                    </div>
                    <div className="pt-2 space-y-2">
                      <button onClick={() => { setShowPhysicianInfo(false); setView(ViewType.PROFILE); }} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-[9px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                        Management Profile <ChevronRight size={10} />
                      </button>
                      <button onClick={onLogout} className="w-full bg-rose-50 text-rose-600 py-2.5 rounded-lg text-[9px] font-semibold uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-rose-100">
                        <LogOut size={12} /> Log Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {showPatientHeader && (
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-4 flex flex-col gap-3 animate-in slide-in-from-top duration-300 relative">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex items-center gap-4 flex-[2] min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight truncate">{selectedPatient.name}</h2>
                    {selectedCase && (
                      <span
                        className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                          isInpatient
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isInpatient ? <Bed size={10} /> : <Activity size={10} />}
                        {selectedCase.caseType}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-medium text-slate-400 mt-1.5 uppercase tracking-widest">
                    <span className="text-slate-600 font-bold">{selectedPatient.id}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    {onCaseChange ? (
                      <CaseHistorySelector
                        cases={patientCases}
                        selectedCaseNumber={selectedCaseNumber || selectedPatient.caseNumber || 'N/A'}
                        primaryCaseNumber={selectedPatient.caseNumber}
                        onCaseChange={onCaseChange}
                      />
                    ) : (
                      <span className="text-blue-600 font-bold">Case: {selectedPatient.caseNumber || 'N/A'}</span>
                    )}
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    <span>{selectedPatient.gender}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    <span>{calculateAge(selectedPatient.dob)}Y</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    <span>DOB: {selectedPatient.dob}</span>
                  </div>
                </div>
              </div>

              <div className="flex-[1] lg:pr-12">
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setClinicalAlertsExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                    aria-expanded={clinicalAlertsExpanded}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={14} className="text-red-500 shrink-0" />
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                        Allergies & Risk Factors
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedPatient.allergies.length > 0 ? (
                        <span className="text-[9px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          {selectedPatient.allergies.length} allergy{selectedPatient.allergies.length === 1 ? '' : 'ies'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">No allergies</span>
                      )}
                      {selectedPatient.riskFactors.length > 0 && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          {selectedPatient.riskFactors.length} risk{selectedPatient.riskFactors.length === 1 ? '' : 's'}
                        </span>
                      )}
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${clinicalAlertsExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {clinicalAlertsExpanded && (
                    <div className="flex flex-col gap-3 mt-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-3 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={14} className="text-red-500" />
                          <span className="text-[9px] font-bold text-red-800 uppercase tracking-widest">Allergies</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.map((a) => (
                            <span key={a} className="text-[10px] font-bold text-red-700 bg-white px-2.5 py-1 rounded-full border border-red-200 shadow-sm">{a}</span>
                          )) : (
                            <span className="text-[10px] text-red-400 italic font-medium">No Known Allergies</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <Info size={14} className="text-amber-500" />
                          <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Risk Factors</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPatient.riskFactors.length > 0 ? selectedPatient.riskFactors.map((r) => (
                            <span key={r} className="text-[10px] font-bold text-amber-700 bg-white px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">{r}</span>
                          )) : (
                            <span className="text-[10px] text-amber-400 italic font-medium">No Risk Factors</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden lg:flex flex-row gap-4">
                  <div className="flex-1 bg-red-50/50 border border-red-100 rounded-2xl p-3 flex flex-col min-w-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-[9px] font-bold text-red-800 uppercase tracking-widest">Allergies</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.map((a) => (
                        <span key={a} className="text-[10px] font-bold text-red-700 bg-white px-2.5 py-1 rounded-full border border-red-200 shadow-sm">{a}</span>
                      )) : (
                        <span className="text-[10px] text-red-400 italic font-medium">No Known Allergies</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 bg-amber-50/50 border border-amber-100 rounded-2xl p-3 flex flex-col min-w-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={14} className="text-amber-500" />
                      <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Risk Factors</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.riskFactors.length > 0 ? selectedPatient.riskFactors.map((r) => (
                        <span key={r} className="text-[10px] font-bold text-amber-700 bg-white px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">{r}</span>
                      )) : (
                        <span className="text-[10px] text-amber-400 italic font-medium">No Risk Factors</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedCase && (
              <div
                className={`rounded-xl border px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 ${
                  isInpatient
                    ? 'bg-orange-50/60 border-orange-100'
                    : 'bg-blue-50/60 border-blue-100'
                }`}
              >
                {isInpatient ? (
                  <>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={12} className="text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">Ward / Bed</p>
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{selectedCase.wardBed}</p>
                      </div>
                    </div>
                    <span className="hidden sm:block w-px h-6 bg-orange-200" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock size={12} className="text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">Admitted</p>
                        <p className="text-[11px] font-semibold text-slate-800">{formatDisplayDate(selectedCase.admissionDate)}</p>
                      </div>
                    </div>
                    <span className="hidden sm:block w-px h-6 bg-orange-200" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Bed size={12} className="text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">Length of Stay</p>
                        <p className="text-[11px] font-semibold text-slate-800">{calculateLengthOfStay(selectedCase.admissionDate)}</p>
                      </div>
                    </div>
                    <span className="hidden sm:block w-px h-6 bg-orange-200" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserRound size={12} className="text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">Attending</p>
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{selectedCase.physician}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock size={12} className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Visit Date</p>
                        <p className="text-[11px] font-semibold text-slate-800">{formatDisplayDate(selectedCase.admissionDate)}</p>
                      </div>
                    </div>
                    <span className="hidden sm:block w-px h-6 bg-blue-200" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 size={12} className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Department / Clinic</p>
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{selectedCase.department}</p>
                      </div>
                    </div>
                    {isOutpatient && selectedCase.wardBed && selectedCase.wardBed !== 'Outpatient' && (
                      <>
                        <span className="hidden sm:block w-px h-6 bg-blue-200" />
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin size={12} className="text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Location</p>
                            <p className="text-[11px] font-semibold text-slate-800 truncate">{selectedCase.wardBed}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 lg:p-10 pb-20 md:pb-10 bg-slate-50/30">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all ${
                  activeView === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <item.icon size={18} />
                <span className="text-[9px] font-semibold uppercase tracking-wider leading-none text-center">
                  {item.label === 'Active patients' ? 'Patients' : item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
            />
            <aside className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-slate-900 text-slate-300 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Stethoscope size={18} />
                  </div>
                  <h1 className="font-bold text-lg text-white truncate">Physician Portal</h1>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeView === item.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="p-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 bg-rose-500/10 text-rose-400 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;

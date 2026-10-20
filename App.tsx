
import React, { useState, useMemo, useEffect } from 'react';
import { ViewType, Patient, Doctor, Encounter, InpatientCase } from './types';
import { MOCK_PATIENTS, MOCK_DOCTORS, MOCK_INPATIENT_LIST, MOCK_ENCOUNTERS } from './constants';
import { getDefaultCaseNumber, getPatientCases } from './utils/patientCaseHistory';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DiagnosisView from './components/DiagnosisView';
import AgendaView from './components/AgendaView';
import Login from './components/Login';
import PatientData from './components/PatientData';
import ProfileView from './components/ProfileView';
import { sapAuthService } from './services/sapAuthService';
import { physicianProfileService } from './services/physicianProfileService';
import { Calendar, List, Info, ChevronRight, Activity, MapPin, Clock, Award, BookOpen, User, UserPlus, Search, Stethoscope, Mail, Phone, ExternalLink, HeartPulse, Settings, Bed, Filter, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const calculateAge = (dob: string) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sapAuthService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    const session = sapAuthService.getSession();
    // Use the raw SAP username (not displayName) so it matches what is stored in SAP.
    // displayName is for UI display only and may contain prefixes like "Dr.".
    return session ? session.username : null;
  });
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);
  const [previousView, setPreviousView] = useState<ViewType>(ViewType.DASHBOARD);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(MOCK_PATIENTS[0]);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState(() =>
    getDefaultCaseNumber(MOCK_PATIENTS[0]),
  );
  
  const [patientFilter, setPatientFilter] = useState<'All' | 'Inpatient' | 'Outpatient'>('All');

  useEffect(() => {
    if (selectedPatient) {
      setSelectedCaseNumber(getDefaultCaseNumber(selectedPatient));
    } else {
      setSelectedCaseNumber('');
    }
  }, [selectedPatient?.id]);

  const handleLogin = (user: string) => { 
    setCurrentUser(user); 
    setIsAuthenticated(true);
    // fetchProfile with no argument — it reads session.username internally,
    // which is the raw SAP user ID (e.g. "JOHN"), not the display name.
    physicianProfileService.fetchProfile();
  };
  const handleLogout = () => { 
    sapAuthService.logout();
    physicianProfileService.clearProfile();
    setIsAuthenticated(false); 
    setCurrentUser(null); 
    setActiveView(ViewType.DASHBOARD); 
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const handlePatientSelection = (patient: Patient) => { 
    setPreviousView(activeView);
    setSelectedPatient(patient); 
    setActiveView(ViewType.PATIENT_DATA); 
  };

  const renderContent = () => {
    switch (activeView) {
      case ViewType.DASHBOARD: return <Dashboard setView={setActiveView} onPatientSelect={handlePatientSelection} />;
      case ViewType.PATIENT_DATA: return selectedPatient ? (
        <PatientData
          patient={selectedPatient}
          selectedCaseNumber={selectedCaseNumber}
          onBack={() => setActiveView(previousView)}
        />
      ) : null;
      case ViewType.AGENDA: return <AgendaView onPatientSelect={handlePatientSelection} />;
      case ViewType.DOCTORS: return <DoctorsView doctors={MOCK_DOCTORS} />;
      case ViewType.PROFILE: return <ProfileView />;
      case ViewType.MY_PATIENTS: {
        const activePatients = MOCK_PATIENTS.map(p => {
            const inpatient = MOCK_INPATIENT_LIST.find(ip => ip.patientId === p.id);
            const patientEncounters = MOCK_ENCOUNTERS[p.id] || [];
            
            // Collect all unique diagnoses
            const allDiagnoses = new Set<string>();
            if (inpatient) allDiagnoses.add(inpatient.diagnosis);
            patientEncounters.forEach(e => allDiagnoses.add(e.diagnosis));
            
            const diagnosisStr = allDiagnoses.size > 0 
              ? Array.from(allDiagnoses).join(', ') 
              : 'Routine Checkup';

            return {
                ...p,
                caseNumber: inpatient ? inpatient.id : (patientEncounters[0]?.caseNumber || '2000000000'),
                caseType: inpatient ? 'Inpatient' : 'Outpatient',
                diagnosis: diagnosisStr,
                location: inpatient ? `Ward: ${inpatient.nursingUnit} (Room ${inpatient.room})` : 'Clinic Cardiology'
            };
        }).filter(p => patientFilter === 'All' || p.caseType === patientFilter);

        return (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 max-w-full">
            <div className="flex flex-col gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight">Active Patients</h2>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                <div className="flex items-center gap-2 px-2 sm:px-3 text-slate-400 shrink-0">
                  <Filter size={14} />
                  <span className="text-[9px] font-semibold uppercase tracking-widest">Filter</span>
                </div>
                {(['All', 'Inpatient', 'Outpatient'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPatientFilter(f)}
                    className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all ${patientFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:hidden bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {activePatients.length > 0 ? activePatients.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePatientSelection(p)}
                  className="w-full text-left p-4 hover:bg-blue-50/50 active:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${p.caseType === 'Inpatient' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                      {p.caseType === 'Inpatient' ? <Bed size={14} /> : <Activity size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-slate-800 text-sm truncate">{p.name}</div>
                        <ChevronRight size={16} className="text-slate-300 shrink-0 mt-0.5" />
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-1">
                        {p.id} • DOB {p.dob} • {calculateAge(p.dob)}Y
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold text-slate-700 font-mono">{p.caseNumber}</span>
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${p.caseType === 'Inpatient' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                          {p.caseType}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 mt-2 text-[10px] text-slate-600">
                        <MapPin size={12} className="text-slate-300 shrink-0 mt-0.5" />
                        <span className="font-medium uppercase tracking-wider">{p.location}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{p.diagnosis}</p>
                    </div>
                  </div>
                </button>
              )) : (
                <div className="py-16 px-4 text-center">
                  <Search size={40} className="mx-auto mb-3 text-slate-100" />
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">No patients found</p>
                </div>
              )}
            </div>

            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case Number</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location / Unit</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnosis</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activePatients.map(p => (
                      <tr key={p.id} onClick={() => handlePatientSelection(p)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${p.caseType === 'Inpatient' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                              {p.caseType === 'Inpatient' ? <Bed size={14} /> : <Activity size={14} />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</div>
                              <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                                ID: {p.id} • DOB: {p.dob} • {calculateAge(p.dob)}Y
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold text-slate-700 font-mono">{p.caseNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-slate-300" />
                            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{p.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${p.caseType === 'Inpatient' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                            {p.caseType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-medium text-slate-600 max-w-[300px]">
                            {p.diagnosis}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-300 group-hover:text-blue-600 transition-colors">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {activePatients.length === 0 && (
                <div className="py-20 text-center">
                  <Search size={48} className="mx-auto mb-4 text-slate-100" />
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">No patients found matching the filter</p>
                </div>
              )}
            </div>
          </div>
        );
      }
      default: return <Dashboard setView={setActiveView} onPatientSelect={handlePatientSelection} />;
    }
  };

  return (
    <Layout
      activeView={activeView}
      setView={setActiveView}
      selectedPatient={selectedPatient}
      setSelectedPatient={setSelectedPatient}
      patients={MOCK_PATIENTS}
      onLogout={handleLogout}
      selectedCaseNumber={selectedCaseNumber}
      onCaseChange={setSelectedCaseNumber}
      patientCases={selectedPatient ? getPatientCases(selectedPatient) : []}
      currentUser={currentUser}
    >
      {renderContent()}
    </Layout>
  );
};

/* --- DOCTORS VIEW --- */

const DoctorsView = ({ doctors }: { doctors: Doctor[] }) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [detailedDoctor, setDetailedDoctor] = useState<Doctor | null>(null);

  const departments = useMemo(() => {
    const depts = new Set(doctors.map(d => d.department));
    return ['All', ...Array.from(depts)];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                           doc.specialization.toLowerCase().includes(search.toLowerCase());
      const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [doctors, search, selectedDept]);

  if (detailedDoctor) {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <button 
                onClick={() => setDetailedDoctor(null)}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
                <ArrowLeft size={18} /> Back to Directory
            </button>
            
            <div className="bg-slate-900 p-16 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-12 border-b-8 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 opacity-5 scale-150">
                   <HeartPulse size={120} />
                </div>
                <img src={detailedDoctor.avatar} className="w-56 h-56 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative z-10" alt={detailedDoctor.name} />
                <div className="text-center md:text-left relative z-10">
                  <h2 className="text-5xl font-semibold tracking-tighter leading-none">{detailedDoctor.name}</h2>
                  <div className="text-orange-400 text-sm font-semibold uppercase tracking-[0.4em] mt-4">{detailedDoctor.specialization} & {detailedDoctor.department} Staff</div>
                  <div className="flex flex-wrap gap-5 mt-10 justify-center md:justify-start">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-[10px] font-semibold uppercase tracking-widest border border-white/10"><Phone size={16} className="text-blue-400" /> Active Registry</div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-[10px] font-semibold uppercase tracking-widest border border-white/10"><Award size={16} className="text-blue-400" /> {detailedDoctor.experience} Years Exp.</div>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/5">
                   <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3"><Award size={24} className="text-blue-600" /> Professional Credentials</h3>
                   <div className="space-y-6">
                      <div className="flex gap-5 border-l-4 border-blue-100 pl-6">
                         <div>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Medical Education</span>
                            <p className="text-base font-bold text-slate-700 leading-relaxed mt-1">{detailedDoctor.education}</p>
                         </div>
                      </div>
                      <div className="flex gap-5 border-l-4 border-blue-100 pl-6">
                         <div>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Board Registry</span>
                            <p className="text-base font-bold text-slate-700 leading-relaxed mt-1">Certified Consultant in {detailedDoctor.specialization}</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/5">
                   <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3"><Stethoscope size={24} className="text-blue-600" /> Clinical Practice Info</h3>
                   <div className="space-y-6">
                      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                         <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">Primary Focus</span>
                         <p className="text-sm font-bold text-slate-600 leading-relaxed">{detailedDoctor.clinicalPractice}</p>
                      </div>
                      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                         <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">Hospital Affiliation</span>
                         <p className="text-sm font-bold text-slate-900 italic">Physician Portal Medical Center - {detailedDoctor.department} Division</p>
                      </div>
                   </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight uppercase">Medical Staff</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">Institutional Consultant Directory</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-5 flex-1 max-w-4xl">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
             <input 
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search by name or specialization..."
               className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm shadow-sm"
             />
           </div>
           
           <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-white shadow-inner overflow-x-auto no-scrollbar">
             {departments.map(dept => (
               <button 
                key={dept} 
                onClick={() => setSelectedDept(dept)}
                className={`px-6 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all whitespace-nowrap ${selectedDept === dept ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-blue-500'}`}
               >
                 {dept}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredDoctors.length > 0 ? filteredDoctors.map(doc => (
          <div key={doc.id} className="p-6 rounded-3xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-sm hover:shadow-md group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-200">
              <HeartPulse size={80} />
            </div>
            
            <div className="flex flex-col items-center text-center mb-6 relative z-10">
              <img 
                src={doc.avatar} 
                className="w-20 h-20 rounded-2xl border-4 border-slate-50 shadow-md group-hover:scale-105 transition-transform mb-4" 
                alt={doc.name} 
              />
              <h4 className="font-semibold text-slate-800 text-lg tracking-tight leading-tight">{doc.name}</h4>
              <div className="text-blue-600 text-[9px] font-semibold uppercase tracking-widest mt-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{doc.specialization}</div>
              <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mt-2">{doc.department}</div>
            </div>
            
            <div className="flex-1 space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 relative z-10 mb-6">
              <div className="flex items-start gap-3 text-slate-600">
                <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0"><Activity size={14} className="text-blue-600" /></div>
                <div className="flex flex-col items-start">
                    <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Medical Practice</span>
                    <p className="text-[11px] font-medium text-slate-700 text-left line-clamp-3 leading-relaxed mt-1">
                        {doc.clinicalPractice}
                    </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-white rounded-xl shadow-sm"><BookOpen size={14} className="text-blue-600" /></div>
                <div className="flex flex-col items-start"><span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Experience</span><span className="text-[11px] font-medium text-slate-800">{doc.experience} Years Practice</span></div>
              </div>
            </div>
            
            <div className="mt-auto flex justify-center pt-2">
              <button 
                onClick={() => setDetailedDoctor(doc)}
                className="w-full bg-slate-800 text-white py-3 rounded-xl text-[9px] font-semibold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                View Full Profile <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center">
            <Search size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">No staff members match your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

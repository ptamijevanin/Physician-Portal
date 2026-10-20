import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Award, 
  Settings, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Code2,
  Stethoscope,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { physicianProfileService, PhysicianProfileState } from '../services/physicianProfileService';
import { sapAuthService } from '../services/sapAuthService';

const ProfileView: React.FC = () => {
  const [profileState, setProfileState] = useState<PhysicianProfileState>(() =>
    physicianProfileService.getProfile()
  );
  const [showRawInspector, setShowRawInspector] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = physicianProfileService.subscribe((state) => {
      setProfileState(state);
    });

    // If profile is empty or demo while user is authenticated, trigger fetch
    if (!profileState.physician && sapAuthService.isAuthenticated()) {
      physicianProfileService.fetchProfile();
    }

    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await physicianProfileService.fetchProfile();
    setIsRefreshing(false);
  };

  const { physician, specialties, isLoading, error, source, lastUpdated } = profileState;

  const session = sapAuthService.getSession();
  const sapClient = session?.sapClient || '110';
  const sapSystem = session?.sapSystem || 'LED';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* SAP OData Live Integration Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">SAP NetWeaver CDS Live Profile</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {sapSystem} / {sapClient}
              </span>
              {source === 'demo' && (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Demo Fallback
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Populated from entities <span className="font-mono text-blue-300">xSMYxPHYSICIAN_CDS</span> &amp; <span className="font-mono text-blue-300">xSMYxPhysSpecialty</span>
            </p>
            {/* Relational Lookup Pipeline */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[10px]">
              <span className="text-slate-400 font-medium">Pipeline:</span>
              <span className="bg-slate-800 text-blue-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                UserId: {physician?.userId || session?.username || 'N/A'}
              </span>
              <span className="text-slate-500 font-bold">&rarr;</span>
              <span className="bg-slate-800 text-emerald-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                Physician ID: {physician?.physicianId || 'N/A'}
              </span>
              <span className="text-slate-500 font-bold">&rarr;</span>
              <span className="bg-slate-800 text-orange-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                xSMYxPhysSpecialty: {specialties.length} Specialties
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 hidden lg:inline-block">
              Synced: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            <RefreshCw size={14} className={isRefreshing || isLoading ? 'animate-spin' : ''} />
            <span>{isRefreshing || isLoading ? 'Syncing...' : 'Sync from SAP'}</span>
          </button>
        </div>
      </div>

      {/* Error alert if fetch failed */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">
            <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-900 mb-0.5">SAP Profile Synchronization Notice</span>
            {error}
          </div>
        </div>
      )}

      {/* Main Physician Hero Card */}
      <div className="bg-slate-900 p-8 sm:p-12 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 md:gap-12 border-b-8 border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 opacity-5 scale-150 pointer-events-none">
          <HeartPulse size={140} />
        </div>

        {/* Avatar */}
        <div className="relative shrink-0">
          <img 
            src="https://picsum.photos/seed/doc/200/200" 
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl object-cover relative z-10" 
            alt={physician?.fullName || 'Physician'} 
          />
          <div className="absolute -bottom-2 -right-2 z-20 bg-blue-600 text-white p-2 rounded-2xl border-2 border-slate-900 shadow-lg" title="SAP Verified Physician">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Physician Info */}
        <div className="text-center md:text-left relative z-10 flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full uppercase tracking-widest">
              {physician?.department || 'Medical Staff'}
            </span>
            {physician?.physicianId && (
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                ID: {physician.physicianId}
              </span>
            )}
            {physician?.userId && (
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                User: {physician.userId}
              </span>
            )}
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
            {physician?.fullName || session?.displayName || 'Physician'}
          </h2>

          <div className="text-orange-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] mt-3">
            {specialties.length > 0 
              ? specialties.map(s => s.specialtyName).join(' & ') 
              : (physician?.title || 'Attending Physician')}
          </div>

          {/* Contact & Location Badges */}
          <div className="flex flex-wrap gap-3 mt-8 justify-center md:justify-start">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl text-[11px] font-semibold tracking-wider border border-white/10">
              <Phone size={14} className="text-blue-400 shrink-0" />
              <span>{physician?.extension || physician?.phone || 'Ext: 3400'}</span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl text-[11px] font-semibold tracking-wider border border-white/10">
              <Mail size={14} className="text-blue-400 shrink-0" />
              <span className="truncate max-w-[200px]">{physician?.email || 'physician@hospital.org'}</span>
            </div>

            {(physician?.building || physician?.room) && (
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl text-[11px] font-semibold tracking-wider border border-white/10">
                <MapPin size={14} className="text-blue-400 shrink-0" />
                <span>{[physician.building, physician.room].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specialties Section from xSMYxPhysSpecialty */}
      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                Clinical Specialties
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Source: xSMYxPhysSpecialty ({specialties.length} recorded)
              </p>
            </div>
          </div>
        </div>

        {specialties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {specialties.map((spec, idx) => (
              <div 
                key={spec.specialtyId || idx}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {spec.specialtyName}
                  </span>
                  {spec.isPrimary && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Primary
                    </span>
                  )}
                </div>
                {spec.description && (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {spec.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 border-t border-slate-100 font-mono">
                  <span>{spec.department || physician?.department || 'Clinical Care'}</span>
                  {spec.specialtyId && <span>Code: {spec.specialtyId}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
            No specialties currently returned from <span className="font-mono">xSMYxPhysSpecialty</span> for this user.
          </div>
        )}
      </div>

      {/* Two Column Grid: Credentials & Roles from xSMYxPHYSICIAN_CDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Professional Credentials Card */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                Professional Credentials
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Source: xSMYxPHYSICIAN_CDS
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(physician?.credentials && physician.credentials.length > 0) ? (
              physician.credentials.map((cred, i) => (
                <div key={i} className="flex gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {cred}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div className="text-xs font-semibold text-slate-700 leading-relaxed">
                  {physician?.academicTitle || 'MD'} - Certified Clinical Practitioner
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Administrative Roles Card */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                Administrative &amp; Hospital Role
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Source: xSMYxPHYSICIAN_CDS
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(physician?.administrativeRoles && physician.administrativeRoles.length > 0) ? (
              physician.administrativeRoles.map((role, i) => (
                <div key={i} className="flex gap-4 p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  <div className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {role}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-4 p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <div className="text-xs font-semibold text-slate-700 leading-relaxed">
                  {physician?.title || 'Attending Physician'} - {physician?.department || 'Medical Staff'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raw SAP OData Payload Inspector (Expandable) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowRawInspector(!showRawInspector)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Code2 size={18} className="text-slate-500" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Inspect Raw SAP CDS Entity Data
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                View properties returned by xSMYxPHYSICIAN_CDS and xSMYxPhysSpecialty
              </p>
            </div>
          </div>
          {showRawInspector ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {showRawInspector && (
          <div className="p-6 border-t border-slate-100 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-6">
            <div>
              <div className="text-blue-400 font-bold text-[11px] mb-2 uppercase tracking-wider">
                1. xSMYxPHYSICIAN_CDS Raw Record:
              </div>
              <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(physician?.raw || physician, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-blue-400 font-bold text-[11px] mb-2 uppercase tracking-wider">
                2. xSMYxPhysSpecialty Raw Records:
              </div>
              <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(specialties.map(s => s.raw || s), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;

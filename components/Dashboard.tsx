
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_INPATIENT_LIST, CALENDAR_DATA, MOCK_PATIENTS } from '../constants';
import { ViewType, Patient } from '../types';
import { SapInstitution, sapAuthService } from '../services/sapAuthService';
import { PhysicianProfileState, physicianProfileService } from '../services/physicianProfileService';
import { OutpatientVisit, outpatientVisitService } from '../services/outpatientVisitService';
import { InpatientVisit, inpatientVisitService } from '../services/inpatientVisitService';
import { AppTimeSlot, appTimeSlotService } from '../services/appTimeSlotService';
import { 
  ChevronRight, Calendar as CalendarIcon, Bed, ShieldCheck, 
  MapPin, CheckCircle2, AlertCircle, Clock, CalendarDays, 
  LayoutGrid, List, Info, TrendingUp 
} from 'lucide-react';

type DashboardTab = 'today' | 'outpatient' | 'noshow' | 'inpatient';
type DisplayMode = 'calendar' | 'list';

interface DashboardProps {
  setView: (view: ViewType) => void;
  onPatientSelect: (patient: Patient) => void;
  selectedInstitution: SapInstitution | null;
}

const calculateAge = (dob: string) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const formatAgeLabel = (age: string | number | undefined): string => {
  const value = String(age ?? '').trim();
  return value ? `${value} yrs` : '';
};

const getAppointmentTimestamp = (appointment: {
  date?: string;
  time?: string;
  dateTime?: string;
  admissionDate?: string;
  admissionTime?: string;
}): number => {
  const date = appointment.date || appointment.admissionDate || appointment.dateTime?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const time = appointment.time || appointment.admissionTime ||
    appointment.dateTime?.replace(/^\d{4}-\d{2}-\d{2}\s*/, '').replace('•', '').trim();
  if (!date || !time) return Number.NaN;

  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!dateMatch || !timeMatch) return Number.NaN;

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const period = timeMatch[3]?.toUpperCase();
  if (minute > 59 || (period && (hour < 1 || hour > 12)) || (!period && hour > 23)) return Number.NaN;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const [, year, month, day] = dateMatch;
  const timestamp = new Date(Number(year), Number(month) - 1, Number(day), hour, minute).getTime();
  const parsedDate = new Date(timestamp);
  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) return Number.NaN;

  return timestamp;
};

const sortAppointmentsByDateTime = <T extends {
  date?: string;
  time?: string;
  dateTime?: string;
  admissionDate?: string;
  admissionTime?: string;
}>(
  appointments: T[],
  ascending: boolean,
): T[] => [...appointments].sort((first, second) => {
  const firstTime = getAppointmentTimestamp(first);
  const secondTime = getAppointmentTimestamp(second);
  if (Number.isNaN(firstTime)) return Number.isNaN(secondTime) ? 0 : 1;
  if (Number.isNaN(secondTime)) return -1;
  return ascending ? firstTime - secondTime : secondTime - firstTime;
});

const getStatusClassName = (status: string): string => {
  const normalizedStatus = status.trim().toLowerCase();
  if (
    normalizedStatus.includes('cancel') ||
    normalizedStatus.includes('no show') ||
    normalizedStatus.includes('no-show') ||
    normalizedStatus.includes('noshow') ||
    normalizedStatus.includes('reject')
  ) {
    return 'bg-rose-50 text-rose-600 border-rose-100';
  }
  if (normalizedStatus.includes('completed') || normalizedStatus.includes('attended')) {
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  }
  if (
    normalizedStatus.includes('confirmed') ||
    normalizedStatus.includes('registered') ||
    normalizedStatus.includes('scheduled') ||
    normalizedStatus.includes('booked') ||
    normalizedStatus.includes('planned') ||
    normalizedStatus.includes('in queue')
  ) {
    return 'bg-blue-50 text-blue-600 border-blue-100';
  }
  if (normalizedStatus.includes('pending') || normalizedStatus.includes('waiting')) {
    return 'bg-amber-50 text-amber-600 border-amber-100';
  }
  return 'bg-slate-50 text-slate-400 border-slate-100';
};

const Dashboard: React.FC<DashboardProps> = ({ onPatientSelect, selectedInstitution }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [time, setTime] = useState(new Date());
  const [profileState, setProfileState] = useState<PhysicianProfileState>(() => physicianProfileService.getProfile());
  const [outpatientVisits, setOutpatientVisits] = useState<OutpatientVisit[]>([]);
  const [outpatientLoading, setOutpatientLoading] = useState(false);
  const [outpatientError, setOutpatientError] = useState<string | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppTimeSlot[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [inpatientVisits, setInpatientVisits] = useState<InpatientVisit[]>([]);
  const [inpatientLoading, setInpatientLoading] = useState(false);
  const [inpatientError, setInpatientError] = useState<string | null>(null);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => physicianProfileService.subscribe(setProfileState), []);

  useEffect(() => {
    const session = sapAuthService.getSession();
    if (!session || session.isDemo || profileState.physician || profileState.isLoading || profileState.error) return;
    void physicianProfileService.fetchProfile();
  }, [profileState.physician, profileState.isLoading, profileState.error]);

  useEffect(() => {
    const session = sapAuthService.getSession();
    if (!session || session.isDemo || !selectedInstitution || profileState.isLoading) return;
    if (!profileState.physician && !profileState.error) return;

    let active = true;
    setOutpatientLoading(true);
    setOutpatientError(null);
    const physicianId = profileState.physician?.physicianId || session.username;

    outpatientVisitService.fetchForPhysician(physicianId, selectedInstitution.id)
      .then((visits) => {
        if (active) setOutpatientVisits(visits);
      })
      .catch((error: unknown) => {
        if (active) {
          setOutpatientVisits([]);
          setOutpatientError(error instanceof Error ? error.message : 'Unable to load outpatient visits.');
        }
      })
      .finally(() => {
        if (active) setOutpatientLoading(false);
      });

    return () => { active = false; };
  }, [
    selectedInstitution?.id,
    profileState.physician?.physicianId,
    profileState.isLoading,
    profileState.error,
  ]);

  useEffect(() => {
    const session = sapAuthService.getSession();
    if (!session || session.isDemo || !selectedInstitution || profileState.isLoading) return;
    if (!profileState.physician && !profileState.error) return;

    let active = true;
    setUpcomingLoading(true);
    setUpcomingError(null);
    const physicianId = profileState.physician?.physicianId || session.username;

    appTimeSlotService.fetchForPhysician(physicianId, selectedInstitution.id)
      .then((appointments) => {
        if (active) setUpcomingAppointments(appointments);
      })
      .catch((error: unknown) => {
        if (active) {
          setUpcomingAppointments([]);
          setUpcomingError(error instanceof Error ? error.message : 'Unable to load upcoming appointments.');
        }
      })
      .finally(() => {
        if (active) setUpcomingLoading(false);
      });

    return () => { active = false; };
  }, [
    selectedInstitution?.id,
    profileState.physician?.physicianId,
    profileState.isLoading,
    profileState.error,
  ]);

  useEffect(() => {
    const session = sapAuthService.getSession();
    if (!session || session.isDemo || !selectedInstitution || profileState.isLoading) return;
    if (!profileState.physician && !profileState.error) return;

    let active = true;
    setInpatientLoading(true);
    setInpatientError(null);
    const physicianId = profileState.physician?.physicianId || session.username;

    inpatientVisitService.fetchForPhysician(physicianId, selectedInstitution.id)
      .then((visits) => {
        if (active) setInpatientVisits(visits);
      })
      .catch((error: unknown) => {
        if (active) {
          setInpatientVisits([]);
          setInpatientError(error instanceof Error ? error.message : 'Unable to load inpatient visits.');
        }
      })
      .finally(() => {
        if (active) setInpatientLoading(false);
      });

    return () => { active = false; };
  }, [
    selectedInstitution?.id,
    profileState.physician?.physicianId,
    profileState.isLoading,
    profileState.error,
  ]);

  const isPast = (timeStr: string) => {
    const [timeVal, period] = timeStr.split(' ');
    let [hour, min] = timeVal.split(':').map(Number);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    const now = new Date();
    if (hour < now.getHours()) return true;
    if (hour === now.getHours() && min < now.getMinutes()) return true;
    return false;
  };

  const isPlannedAppointmentOverdue = (dateTime: string, status: string): boolean => {
    if (status.trim().toLowerCase() !== 'planned') return false;

    const match = dateTime.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;

    const [, year, month, day, hourValue, minuteValue, period] = match;
    let hour = Number(hourValue);
    const minute = Number(minuteValue);
    if (hour < 1 || hour > 12 || minute > 59) return false;
    if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;

    const appointmentTime = new Date(Number(year), Number(month) - 1, Number(day), hour, minute);
    if (
      appointmentTime.getFullYear() !== Number(year) ||
      appointmentTime.getMonth() !== Number(month) - 1 ||
      appointmentTime.getDate() !== Number(day)
    ) return false;

    return time.getTime() - appointmentTime.getTime() >= 60 * 60 * 1000;
  };

  const getFilteredData = (tab: DashboardTab) => {
    switch(tab) {
      case 'today':
        return sapAuthService.getSession()?.isDemo
          ? sortAppointmentsByDateTime(
            CALENDAR_DATA.filter(apt => apt.date === todayStr && apt.status !== 'completed' && !isPast(apt.time)),
            true,
          )
          : sortAppointmentsByDateTime(upcomingAppointments
            .filter((appointment) => !isPlannedAppointmentOverdue(appointment.dateTime, appointment.status))
            .map((appointment) => ({ ...appointment, isSapVisit: true })), true);
      case 'outpatient':
        return sapAuthService.getSession()?.isDemo
          ? sortAppointmentsByDateTime(CALENDAR_DATA.filter(apt => apt.date === todayStr), false)
          : sortAppointmentsByDateTime(outpatientVisits.map((visit) => ({ ...visit, isSapVisit: true })), false);
      case 'noshow':
        return sapAuthService.getSession()?.isDemo
          ? sortAppointmentsByDateTime(
            CALENDAR_DATA.filter(apt => apt.date === todayStr && apt.status !== 'completed' && isPast(apt.time)),
            false,
          )
          : sortAppointmentsByDateTime(upcomingAppointments
            .filter((appointment) => isPlannedAppointmentOverdue(appointment.dateTime, appointment.status))
            .map((appointment) => ({ ...appointment, isSapVisit: true })), false);
      default:
        return [];
    }
  };

  const stats = useMemo(() => {
    const dayData = CALENDAR_DATA.filter(a => a.date === todayStr);
    const attended = dayData.filter(a => a.status === 'completed').length;
    const noshow = sapAuthService.getSession()?.isDemo
      ? dayData.filter(a => a.status !== 'completed' && isPast(a.time)).length
      : upcomingAppointments.filter((appointment) =>
        isPlannedAppointmentOverdue(appointment.dateTime, appointment.status),
      ).length;
    const upcoming = sapAuthService.getSession()?.isDemo
      ? dayData.filter(a => a.status !== 'completed' && !isPast(a.time)).length
      : upcomingAppointments.filter((appointment) =>
        !isPlannedAppointmentOverdue(appointment.dateTime, appointment.status),
      ).length;
    const total = dayData.length;
    
    return {
      upcoming,
      attended,
      noshow,
      total: sapAuthService.getSession()?.isDemo ? total : outpatientVisits.length,
      inpatient: sapAuthService.getSession()?.isDemo ? MOCK_INPATIENT_LIST.length : inpatientVisits.length,
    };
  }, [todayStr, time, outpatientVisits.length, inpatientVisits.length, upcomingAppointments.length]);

  const handlePatientClick = (patientId: string) => {
    // Disable navigation for No Show and Upcoming Appointments as requested
    if (activeTab === 'noshow' || activeTab === 'today') return;

    const patient = MOCK_PATIENTS.find(p => p.id === patientId);
    if (patient) {
        // Find if this patient has a booking today to get the case number
        const booking = CALENDAR_DATA.find(c => c.patientId === patientId && c.date === todayStr);
        onPatientSelect({
            ...patient,
            caseNumber: booking?.caseNumber || patient.caseNumber
        });
    } else {
        const calEntry = CALENDAR_DATA.find(c => c.patientId === patientId);
        if (calEntry) {
            onPatientSelect({
                id: calEntry.patientId,
                name: calEntry.patientName,
                dob: calEntry.patientDob,
                gender: (calEntry.patientGender as any) || 'Other',
                caseNumber: calEntry.caseNumber,
                bloodType: 'N/A',
                allergies: [],
                riskFactors: [],
                lastVisit: todayStr
            });
        }
    }
  };

  const ProgressChart = ({ attended, upcoming, noshow }: { attended: number, upcoming: number, noshow: number }) => {
    const total = attended + upcoming + noshow || 1;
    const size = 110;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const attendedPerc = (attended / total) * circumference;
    const upcomingPerc = (upcoming / total) * circumference;
    const noshowPerc = (noshow / total) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          <circle 
            cx={size/2} cy={size/2} r={radius} fill="none" stroke="#10b981" 
            strokeWidth={strokeWidth} strokeDasharray={`${attendedPerc} ${circumference}`} 
            className="transition-all duration-1000"
          />
          <circle 
            cx={size/2} cy={size/2} r={radius} fill="none" stroke="#2563eb" 
            strokeWidth={strokeWidth} strokeDasharray={`${upcomingPerc} ${circumference}`} 
            strokeDashoffset={-attendedPerc}
            className="transition-all duration-1000"
          />
          <circle 
            cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f43f5e" 
            strokeWidth={strokeWidth} strokeDasharray={`${noshowPerc} ${circumference}`} 
            strokeDashoffset={-(attendedPerc + upcomingPerc)}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-[10px] font-semibold text-slate-400 leading-none">DAY</span>
          <span className="text-xl font-semibold text-slate-800">{total}</span>
        </div>
      </div>
    );
  };

  const getAppointmentStatusLabel = (apt: { status: string; isSapVisit?: boolean }, tab: DashboardTab) => {
    if ((tab === 'today' && !apt.isSapVisit) || tab === 'noshow') return 'Planned';
    if (apt.isSapVisit) return apt.status;
    if (tab === 'outpatient') return apt.status === 'completed' ? 'Treatment Completed' : 'Registered';
    return apt.status;
  };

  const renderMobileAppointmentCards = (data: any[]) => {
    const isReadOnly = activeTab === 'noshow' || activeTab === 'today';

    if (data.length === 0) {
      return (
        <div className="md:hidden py-12 px-4 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-200">
            <CalendarIcon size={24} />
          </div>
          <div className="text-slate-400 font-semibold uppercase tracking-widest text-[10px]">No records found</div>
        </div>
      );
    }

    return (
      <div className="md:hidden divide-y divide-slate-100">
        {data.map((apt) => {
          const ageLabel = formatAgeLabel(apt.isSapVisit ? apt.age : calculateAge(apt.patientDob));
          return (
          <button
            key={apt.id}
            type="button"
            onClick={() => handlePatientClick(apt.patientId)}
            disabled={isReadOnly}
            className={`w-full text-left p-4 transition-colors ${
              isReadOnly ? 'cursor-default' : 'hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800 text-sm truncate">{apt.patientName}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} className="text-slate-300" />
                    {apt.isSapVisit ? apt.dateTime : `${apt.date} • ${apt.time}`}
                  </span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{apt.patientId}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-slate-500">
                  {ageLabel && <span>{ageLabel}</span>}
                  {ageLabel && <span>•</span>}
                  <span>{apt.patientGender}</span>
                  <span>•</span>
                  <span>{apt.patientDob}</span>
                  {activeTab === 'outpatient' && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{apt.caseNumber}</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 px-2.5 py-1 rounded-md text-[8px] font-medium uppercase tracking-wider border ${getStatusClassName(apt.status)}`}
              >
                {getAppointmentStatusLabel(apt, activeTab)}
              </span>
            </div>
          </button>
          );
        })}
      </div>
    );
  };

  const renderList = (data: any[]) => {
    if (activeTab === 'today' || activeTab === 'noshow' || activeTab === 'outpatient') {
      return (
        <>
        {renderMobileAppointmentCards(data)}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Date & Time</th>
                {activeTab !== 'today' && activeTab !== 'noshow' && (
                  <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Case Number</th>
                )}
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">MRN</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Full Name</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">DOB</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gender</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">Age</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.length > 0 ? (
                data.map((apt) => {
                  const ageLabel = formatAgeLabel(apt.isSapVisit ? apt.age : calculateAge(apt.patientDob));
                  return (
                  <tr 
                    key={apt.id} 
                    onClick={() => handlePatientClick(apt.patientId)} 
                    className={`transition-all group ${activeTab === 'noshow' || activeTab === 'today' ? 'cursor-default' : 'hover:bg-slate-50/50 cursor-pointer'}`}
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                        <Clock size={12} className="text-slate-300" />
                        <span>{apt.isSapVisit ? apt.dateTime : `${apt.date} • ${apt.time}`}</span>
                      </div>
                    </td>
                    {activeTab !== 'today' && activeTab !== 'noshow' && (
                      <td className="px-6 py-3">
                        <span className="text-[11px] font-bold text-slate-700 font-mono">{apt.caseNumber}</span>
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 text-[9px] font-medium">{apt.patientId}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-normal text-slate-800 text-sm whitespace-nowrap group-hover:text-blue-600 transition-colors">{apt.patientName}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] text-slate-500 font-medium">{apt.patientDob}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] text-blue-500/70 font-medium">{apt.patientGender}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {ageLabel && <span className="text-[10px] text-slate-600 font-medium">{ageLabel}</span>}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`px-3 py-0.5 rounded-md text-[8px] font-medium uppercase tracking-widest border ${getStatusClassName(apt.status)}`}>
                        {(activeTab === 'today' && !apt.isSapVisit) || activeTab === 'noshow' ? 'Planned' :
                         apt.isSapVisit ? apt.status :
                         activeTab === 'outpatient' ? (apt.status === 'completed' ? 'Treatment Completed' : 'Registered') :
                         apt.status}
                      </span>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-200">
                      <CalendarIcon size={24} />
                    </div>
                    <div className="text-slate-400 font-semibold uppercase tracking-widest text-[10px]">No records found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      );
    }

    return (
      <div className="divide-y divide-slate-50">
        {data.length > 0 ? (
          data.map((apt) => (
            <div key={apt.id} onClick={() => handlePatientClick(apt.patientId)} className={`px-6 py-2.5 flex items-center justify-between transition-all group ${activeTab === 'noshow' || activeTab === 'today' ? 'cursor-default' : 'hover:bg-slate-50/50 cursor-pointer'}`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 min-w-[80px]">
                  <Clock size={12} className="text-slate-300" />
                  <div className="text-[11px] font-medium text-slate-600">{apt.time}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-normal text-slate-800 text-sm group-hover:text-blue-600 transition-colors whitespace-nowrap">{apt.patientName}</div>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                     <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 text-[9px]">{apt.patientId}</span>
                     <span className="text-slate-600">{calculateAge(apt.patientDob)} yrs</span>
                     <span className="text-blue-500/70">{apt.patientGender}</span>
                     <span className="text-[9px] lowercase opacity-50">({apt.patientDob})</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-0.5 rounded-md text-[8px] font-medium uppercase tracking-widest border ${
                  apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  apt.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                  'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {apt.status === 'completed' ? 'Attended' : apt.status}
                </span>
                {activeTab !== 'noshow' && activeTab !== 'today' && <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" size={14} />}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-200">
               <CalendarIcon size={24} />
             </div>
             <div className="text-slate-400 font-semibold uppercase tracking-widest text-[10px]">No records found</div>
          </div>
        )}
      </div>
    );
  };

  const renderTimelineView = (data: any[]) => {
    // A simplified timeline view for "Calendar" mode in dashboard context
    const sorted = [...data].sort((a, b) => {
        const tA = isPast(a.time);
        const tB = isPast(b.time);
        return 0; // Already naturally sorted by generate function
    });

    return (
      <div className="p-4 sm:p-6 space-y-4">
        {sorted.map((apt, i) => (
          <div key={apt.id} onClick={() => handlePatientClick(apt.patientId)} className={`relative flex gap-3 sm:gap-6 group ${activeTab === 'today' || activeTab === 'noshow' ? 'cursor-default' : 'cursor-pointer'}`}>
             <div className="w-14 sm:w-20 text-right pt-1 shrink-0">
                <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">{apt.time}</span>
             </div>
             <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${apt.status === 'completed' ? 'bg-emerald-500' : isPast(apt.time) ? 'bg-rose-500' : 'bg-blue-600'}`}></div>
                {i !== sorted.length - 1 && <div className="w-px h-full bg-slate-100 -mt-1"></div>}
             </div>
             <div className="flex-1 pb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group-hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{apt.patientName}</h4>
                            <div className="flex items-center gap-3 text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                                <span>MRN: {apt.patientId}</span>
                                <span className="text-slate-600 font-bold">{calculateAge(apt.patientDob)} yrs</span>
                                <span className="text-blue-500">{apt.patientGender}</span>
                            </div>
                        </div>
                        <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-widest border ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isPast(apt.time) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {apt.status}
                        </span>
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailView = (data: any[]) => (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.length > 0 ? data.map(apt => (
        <div key={apt.id} onClick={() => handlePatientClick(apt.patientId)} className={`bg-white p-5 rounded-xl border transition-all group flex flex-col shadow-sm ${activeTab === 'today' || activeTab === 'noshow' ? 'cursor-default border-slate-200' : 'hover:border-blue-400 cursor-pointer border-slate-200'}`}>
           <div className="flex justify-between items-start mb-3">
              <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-widest border ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{apt.status}</span>
              <span className="text-[8px] font-semibold text-slate-300 uppercase tracking-widest">{apt.patientId}</span>
           </div>
           <h4 className="font-semibold text-slate-800 text-base tracking-tight mb-1.5 group-hover:text-blue-600 transition-colors">{apt.patientName}</h4>
           <div className="space-y-1 mb-4 text-[9px] font-medium uppercase tracking-widest text-slate-400">
             <div>DOB: <span className="text-slate-700">{apt.patientDob}</span></div>
             <div>Age: <span className="text-slate-500">{calculateAge(apt.patientDob)} yrs</span></div>
             <div>Gender: <span className="text-blue-500">{apt.patientGender || 'Male'}</span></div>
           </div>
           <div className="mt-auto pt-3 border-t border-slate-50">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                 <Clock size={12} className="text-blue-400" />
                 <span className="font-semibold uppercase tracking-widest text-[8px]">{apt.time} • TODAY</span>
              </div>
           </div>
        </div>
      )) : (
        <div className="col-span-full py-16 text-center text-slate-300 font-medium uppercase tracking-widest italic text-xs">No matching profiles found</div>
      )}
    </div>
  );

  const currentTabName = useMemo(() => {
    switch(activeTab) {
      case 'today': return 'Upcoming Appointments';
      case 'outpatient': return 'Outpatient List';
      case 'noshow': return 'No Shows Today';
      case 'inpatient': return 'Active Inpatients';
    }
  }, [activeTab]);

  const renderMobileInpatientCards = (visits: InpatientVisit[]) => (
    <div className="md:hidden divide-y divide-slate-100">
      {visits.length > 0 ? visits.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handlePatientClick(item.patientId)}
          className="w-full text-left p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="font-semibold text-slate-800 text-sm">{item.patientName}</div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            {item.patientId}
            {formatAgeLabel(item.age) && <> • Age: {formatAgeLabel(item.age)}</>}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-600">
            <MapPin size={13} className="text-blue-500 shrink-0" />
            <span>{[
              item.ward && `Ward: ${item.ward}`,
              item.room && `Room: ${item.room}`,
              item.bed && `Bed: ${item.bed}`,
            ].filter(Boolean).join(' • ')}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 line-clamp-2">{item.diagnosis}</div>
          <div className="mt-3">
            <span className="text-[9px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/50">
              Admitted {[item.admissionDate, item.admissionTime].filter(Boolean).join(' • ')}
            </span>
          </div>
        </button>
      )) : (
        <div className="py-12 px-4 text-center text-slate-400 text-sm">No inpatient visits found.</div>
      )}
    </div>
  );

  const isDemoSession = sapAuthService.getSession()?.isDemo === true;
  const displayedInpatientVisits: InpatientVisit[] = sortAppointmentsByDateTime(
    isDemoSession
      ? MOCK_INPATIENT_LIST.map((item) => ({
        id: item.id,
        patientId: item.patientId,
        patientName: item.patientName,
        age: String(calculateAge(MOCK_PATIENTS.find((patient) => patient.id === item.patientId)?.dob || '') || ''),
        ward: item.nursingUnit,
        room: item.room,
        bed: '',
        diagnosis: item.diagnosis,
        admissionDate: item.admissionDate,
        admissionTime: '',
      }))
      : inpatientVisits,
    false,
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 max-w-full">
      {/* SEAMLESS STATS SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <button 
          onClick={() => { setActiveTab('today'); setDisplayMode('list'); }} 
          className={`text-left p-4 sm:p-6 transition-all duration-200 flex items-center gap-3 sm:gap-4 ${
            activeTab === 'today' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${activeTab === 'today' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
            <CalendarDays size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className={`text-lg sm:text-xl font-semibold tracking-tight ${activeTab === 'today' ? 'text-white' : 'text-slate-800'}`}>{stats.upcoming}</div>
            <div className={`text-[8px] sm:text-[9px] font-medium uppercase tracking-widest mt-0.5 truncate ${activeTab === 'today' ? 'text-blue-100' : 'text-slate-400'}`}>Upcoming</div>
          </div>
        </button>
        
        <button 
          onClick={() => { setActiveTab('outpatient'); setDisplayMode('list'); }} 
          className={`text-left p-4 sm:p-6 transition-all duration-200 flex items-center gap-3 sm:gap-4 ${
            activeTab === 'outpatient' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${activeTab === 'outpatient' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
            <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className={`text-lg sm:text-xl font-semibold tracking-tight ${activeTab === 'outpatient' ? 'text-white' : 'text-slate-800'}`}>{stats.total}</div>
            <div className={`text-[8px] sm:text-[9px] font-medium uppercase tracking-widest mt-0.5 truncate ${activeTab === 'outpatient' ? 'text-emerald-100' : 'text-slate-400'}`}>Outpatient</div>
          </div>
        </button>
        
        <button 
          onClick={() => { setActiveTab('noshow'); setDisplayMode('list'); }} 
          className={`text-left p-4 sm:p-6 transition-all duration-200 flex items-center gap-3 sm:gap-4 ${
            activeTab === 'noshow' 
              ? 'bg-rose-600 text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${activeTab === 'noshow' ? 'bg-white/20' : 'bg-rose-50 text-rose-600'}`}>
            <AlertCircle size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className={`text-lg sm:text-xl font-semibold tracking-tight ${activeTab === 'noshow' ? 'text-white' : 'text-slate-800'}`}>{stats.noshow}</div>
            <div className={`text-[8px] sm:text-[9px] font-medium uppercase tracking-widest mt-0.5 truncate ${activeTab === 'noshow' ? 'text-rose-100' : 'text-slate-400'}`}>No Show</div>
          </div>
        </button>

        <button 
          onClick={() => { setActiveTab('inpatient'); setDisplayMode('list'); }} 
          className={`text-left p-4 sm:p-6 transition-all duration-200 flex items-center gap-3 sm:gap-4 ${
            activeTab === 'inpatient' 
              ? 'bg-slate-900 text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${activeTab === 'inpatient' ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
            <Bed size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className={`text-lg sm:text-xl font-semibold tracking-tight ${activeTab === 'inpatient' ? 'text-white' : 'text-slate-800'}`}>{stats.inpatient}</div>
            <div className={`text-[8px] sm:text-[9px] font-medium uppercase tracking-widest mt-0.5 truncate ${activeTab === 'inpatient' ? 'text-slate-400' : 'text-slate-400'}`}>Inpatients</div>
          </div>
        </button>
      </div>

      {/* CONTENT LIST SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-blue-600 border border-slate-100 shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest truncate">
                {currentTabName}
              </h3>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          {/* VIEW TOGGLE - Removed for Upcoming and No Show as requested */}
          {activeTab !== 'today' && activeTab !== 'noshow' && activeTab !== 'outpatient' && activeTab !== 'inpatient' && (
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
               <button 
                 onClick={() => setDisplayMode('calendar')} 
                 className={`p-1.5 rounded-md transition-all ${displayMode === 'calendar' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-blue-500'}`}
               >
                 <LayoutGrid size={14} />
               </button>
               <button 
                 onClick={() => setDisplayMode('list')} 
                 className={`p-1.5 rounded-md transition-all ${displayMode === 'list' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-blue-500'}`}
               >
                 <List size={14} />
               </button>
            </div>
          )}
        </div>
        <div className="min-h-[280px] sm:min-h-[400px]">
          {(activeTab === 'today' || activeTab === 'noshow') && !isDemoSession ? (
            upcomingLoading ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                Loading {activeTab === 'today' ? 'upcoming appointments' : 'no-show appointments'} from SAP...
              </div>
            ) : upcomingError ? (
              <div role="alert" className="m-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {upcomingError}
              </div>
            ) : renderList(getFilteredData(activeTab))
          ) : activeTab === 'outpatient' && !sapAuthService.getSession()?.isDemo ? (
            outpatientLoading ? (
              <div className="py-16 text-center text-slate-400 text-sm">Loading outpatient visits from SAP...</div>
            ) : outpatientError ? (
              <div role="alert" className="m-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {outpatientError}
              </div>
            ) : renderList(getFilteredData(activeTab))
          ) : activeTab === 'inpatient' ? (
            inpatientLoading && !isDemoSession ? (
              <div className="py-16 text-center text-slate-400 text-sm">Loading inpatient visits from SAP...</div>
            ) : inpatientError && !isDemoSession ? (
              <div role="alert" className="m-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {inpatientError}
              </div>
            ) : (
              <>
              {renderMobileInpatientCards(displayedInpatientVisits)}
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[720px]">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                          <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Patient Profile</th>
                          <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Location / Ward</th>
                          <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Clinical Diagnosis</th>
                          <th className="px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Admission</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                      {displayedInpatientVisits.length > 0 ? displayedInpatientVisits.map((item) => (
                          <tr key={item.id} onClick={() => handlePatientClick(item.patientId)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                          <td className="px-8 py-5">
                              <div>
                                <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{item.patientName}</div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <span className="text-slate-500 font-semibold">{item.patientId}</span>
                                    {formatAgeLabel(item.age) && <><span>•</span><span>Age: {formatAgeLabel(item.age)}</span></>}
                                </div>
                              </div>
                          </td>
                          <td className="px-8 py-5">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <MapPin size={14} className="text-blue-500" />
                                <span>{[
                                  item.ward && `Ward: ${item.ward}`,
                                  item.room && `Room: ${item.room}`,
                                  item.bed && `Bed: ${item.bed}`,
                                ].filter(Boolean).join(' • ')}</span>
                              </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs font-medium text-slate-500 truncate max-w-[200px] block">{item.diagnosis}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[9px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/50">
                              {[item.admissionDate, item.admissionTime].filter(Boolean).join(' • ')}
                            </span>
                          </td>
                          </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-16 text-center text-slate-400 text-sm">No inpatient visits found.</td>
                        </tr>
                      )}
                      </tbody>
                  </table>
              </div>
              </>
            )
          ) : 
           displayMode === 'list' ? renderList(getFilteredData(activeTab)) : 
           renderTimelineView(getFilteredData(activeTab))
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

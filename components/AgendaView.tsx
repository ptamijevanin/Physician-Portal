
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, List, LayoutGrid, Plus, X, Ban, Trash2 } from 'lucide-react';
import { CALENDAR_DATA, MOCK_PATIENTS } from '../constants';
import { AgendaTimeBlock, CalendarAppointment, Patient } from '../types';

const APPOINTMENT_TYPES = [
  'Cardiac Follow-up',
  'Echo Review',
  'ECG Analysis',
  'Hypertension Screen',
  'Post-Op Check',
  'New Consultation',
];

const BUSINESS_HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

const formatHourSlot = (hour: number) => {
  const timeStrPrefix = `${hour > 12 ? hour - 12 : hour}:00`;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${timeStrPrefix} ${period}`;
};

const TIME_SLOTS = BUSINESS_HOURS.map(formatHourSlot);

const parseTimeSlot = (slot: string) => {
  const match = slot.match(/^(\d+):00 (AM|PM)$/);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const period = match[2];
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour;
};

const isSlotInBlock = (date: string, time: string, block: AgendaTimeBlock) => {
  if (block.date !== date) return false;
  const slotHour = parseTimeSlot(time);
  const startHour = parseTimeSlot(block.startTime);
  const endHour = parseTimeSlot(block.endTime);
  return slotHour >= startHour && slotHour <= endHour;
};

const isTimeBlocked = (date: string, time: string, blocks: AgendaTimeBlock[]) =>
  blocks.some((block) => isSlotInBlock(date, time, block));

const getBlockForSlot = (date: string, time: string, blocks: AgendaTimeBlock[]) =>
  blocks.find((block) => isSlotInBlock(date, time, block));

const getFirstAvailableSlot = (date: string, blocks: AgendaTimeBlock[]) =>
  TIME_SLOTS.find((slot) => !isTimeBlocked(date, slot, blocks)) || TIME_SLOTS[0];

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

type ViewMode = 'day' | 'month';
type DisplayMode = 'calendar' | 'list';

interface AgendaViewProps {
  onPatientSelect: (patient: Patient) => void;
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

interface NewAppointmentForm {
  patientId: string;
  date: string;
  time: string;
  type: string;
}

const defaultAppointmentForm = (date: Date, blocks: AgendaTimeBlock[]): NewAppointmentForm => {
  const dateStr = toDateInputValue(date);
  return {
    patientId: '',
    date: dateStr,
    time: getFirstAvailableSlot(dateStr, blocks),
    type: APPOINTMENT_TYPES[0],
  };
};

interface NewBlockForm {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

const defaultBlockForm = (date: Date): NewBlockForm => ({
  date: toDateInputValue(date),
  startTime: '12:00 PM',
  endTime: '1:00 PM',
  reason: '',
});

const AgendaView: React.FC<AgendaViewProps> = ({ onPatientSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar');
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(() => [...CALENDAR_DATA]);
  const [blockedPeriods, setBlockedPeriods] = useState<AgendaTimeBlock[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState<NewAppointmentForm>(() => defaultAppointmentForm(new Date(), []));
  const [newBlock, setNewBlock] = useState<NewBlockForm>(() => defaultBlockForm(new Date()));
  const [blockFormError, setBlockFormError] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const ensureCalendarOnMobile = () => {
      if (media.matches) setDisplayMode('calendar');
    };
    ensureCalendarOnMobile();
    media.addEventListener('change', ensureCalendarOnMobile);
    return () => media.removeEventListener('change', ensureCalendarOnMobile);
  }, []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
    setViewMode('day');
  };

  const openCreateModal = () => {
    setNewAppointment(defaultAppointmentForm(currentDate, blockedPeriods));
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewAppointment(defaultAppointmentForm(currentDate, blockedPeriods));
  };

  const openBlockModal = () => {
    setNewBlock(defaultBlockForm(currentDate));
    setBlockFormError('');
    setShowBlockModal(true);
  };

  const closeBlockModal = () => {
    setShowBlockModal(false);
    setNewBlock(defaultBlockForm(currentDate));
    setBlockFormError('');
  };

  const handleCreateAppointment = () => {
    const patient = MOCK_PATIENTS.find((p) => p.id === newAppointment.patientId);
    if (!patient || !newAppointment.date || !newAppointment.time) return;
    if (isTimeBlocked(newAppointment.date, newAppointment.time, blockedPeriods)) return;

    const entry: CalendarAppointment = {
      id: `CB-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      patientDob: patient.dob,
      patientGender: patient.gender,
      caseNumber: patient.caseNumber || 'N/A',
      date: newAppointment.date,
      time: newAppointment.time,
      type: newAppointment.type,
      status: 'confirmed',
    };

    setAppointments((prev) => [...prev, entry]);
    setCurrentDate(new Date(`${newAppointment.date}T12:00:00`));
    setViewMode('day');
    closeCreateModal();
  };

  const handleCreateBlock = () => {
    if (!newBlock.reason.trim()) {
      setBlockFormError('Please enter a reason for this blocked period.');
      return;
    }
    if (parseTimeSlot(newBlock.endTime) < parseTimeSlot(newBlock.startTime)) {
      setBlockFormError('End time must be after start time.');
      return;
    }

    const entry: AgendaTimeBlock = {
      id: `BLK-${Date.now()}`,
      date: newBlock.date,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      reason: newBlock.reason.trim(),
    };

    setBlockedPeriods((prev) => [...prev, entry]);
    setCurrentDate(new Date(`${newBlock.date}T12:00:00`));
    setViewMode('day');
    closeBlockModal();
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlockedPeriods((prev) => prev.filter((block) => block.id !== blockId));
  };

  const handlePatientClick = (patientId: string, date: string) => {
    // Navigation disabled for all lists in AgendaView as requested
    return;
  };

  const filteredData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (viewMode === 'day') {
      return appointments.filter((apt) => apt.date === targetDateStr);
    }
    return appointments.filter((apt) => {
      const d = new Date(apt.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [viewMode, currentDate, appointments]);

  const filteredBlocks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (viewMode === 'day') {
      return blockedPeriods.filter((block) => block.date === targetDateStr);
    }
    return blockedPeriods.filter((block) => {
      const d = new Date(block.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [viewMode, currentDate, blockedPeriods]);

  const targetDateStr = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [currentDate]);

  const appointmentTimeBlocked =
    !!newAppointment.date &&
    !!newAppointment.time &&
    isTimeBlocked(newAppointment.date, newAppointment.time, blockedPeriods);

  const renderMobileMonthList = () => {
    const grouped = filteredData.reduce<Record<string, typeof filteredData>>((acc, apt) => {
      if (!acc[apt.date]) acc[apt.date] = [];
      acc[apt.date].push(apt);
      return acc;
    }, {});

    const dates = Array.from(
      new Set([...Object.keys(grouped), ...filteredBlocks.map((block) => block.date)]),
    ).sort();

    if (dates.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-300">
          <CalendarIcon size={40} className="mx-auto mb-3 text-slate-100" />
          <p className="font-semibold uppercase tracking-widest text-xs">No scheduled items this month</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {dates.map((date) => (
          <div key={date} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h4>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredBlocks
                .filter((block) => block.date === date)
                .map((block) => (
                  <div key={block.id} className="p-4 bg-rose-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-rose-800 text-sm flex items-center gap-1.5">
                        <Ban size={12} />
                        Blocked · {block.startTime} – {block.endTime}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(block.id)}
                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-md transition-colors shrink-0"
                        aria-label="Remove block"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-rose-700 mt-1.5 leading-relaxed">{block.reason}</p>
                  </div>
                ))}
              {grouped[date]?.map((apt) => (
                <div key={apt.id} className="p-4">
                  <div className="font-semibold text-slate-800 text-sm">{apt.patientName}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} className="text-slate-300" />
                      {apt.time}
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{apt.patientId}</span>
                    <span>{calculateAge(apt.patientDob)} yrs</span>
                    <span>{apt.patientGender || '—'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{apt.type}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-blue-50/20 border-b border-r border-blue-50"></div>);
    }

    const realTodayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppointments = appointments.filter((apt) => apt.date === dateStr);
      const dayBlocks = blockedPeriods.filter((block) => block.date === dateStr);

      days.push(
        <div key={day} className="h-24 sm:h-32 border-b border-r border-slate-100 p-1.5 sm:p-2 overflow-hidden bg-white hover:bg-slate-50 transition-colors">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-semibold ${dateStr === realTodayStr ? 'bg-slate-800 text-white w-6 h-6 rounded-lg flex items-center justify-center shadow-md' : 'text-slate-600'}`}>{day}</span>
            {dayBlocks.length > 0 && (
              <span className="text-[7px] font-bold text-rose-600 uppercase tracking-wider">{dayBlocks.length} blk</span>
            )}
          </div>
          <div className="space-y-1">
            {dayBlocks.slice(0, 1).map((block) => (
              <div key={block.id} className="text-[9px] leading-tight truncate bg-rose-50 text-rose-700 px-2 py-1 rounded-lg font-semibold border-l-2 border-rose-400 cursor-default">
                {block.startTime} blocked
              </div>
            ))}
            {dayAppointments.slice(0, dayBlocks.length > 0 ? 2 : 3).map((apt) => (
              <div key={apt.id} className="text-[9px] leading-tight truncate bg-slate-50 text-slate-600 px-2 py-1 rounded-lg font-semibold border-l-2 border-slate-300 cursor-default">
                {apt.time} • {apt.patientName}
              </div>
            ))}
            {dayAppointments.length + dayBlocks.length > 3 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentDate(new Date(dateStr));
                  setViewMode('day');
                }}
                className="text-[8px] text-slate-400 font-semibold px-1 hover:underline cursor-pointer block w-full text-left"
              >
                +{dayAppointments.length + dayBlocks.length - 3} more
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="hidden md:grid grid-cols-7 border-t border-l border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {daysOfWeek.map(d => (
          <div key={d} className="bg-slate-50 py-2.5 text-center text-[9px] font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-200">{d}</div>
        ))}
        {days}
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {BUSINESS_HOURS.map((hour) => {
            const fullTimeStr = formatHourSlot(hour);
            const appointmentsAtHour = filteredData.filter((apt) => apt.time === fullTimeStr);
            const block = getBlockForSlot(targetDateStr, fullTimeStr, blockedPeriods);
            
            return (
              <div key={hour} className="flex min-h-[72px] sm:min-h-[100px] group">
                <div className="w-14 sm:w-24 p-2 sm:p-5 border-r border-slate-100 text-right shrink-0">
                  <span className={`text-[8px] sm:text-[10px] font-semibold uppercase tracking-widest leading-tight ${block ? 'text-rose-400' : 'text-slate-300'}`}>
                    {fullTimeStr}
                  </span>
                </div>
                <div className={`flex-1 min-w-0 p-2 sm:p-3 transition-all space-y-2 ${block ? 'bg-rose-50/40' : 'bg-slate-50/30 group-hover:bg-slate-50/60'}`}>
                  {block && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 sm:p-4 shadow-sm border-l-4 border-l-rose-500">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-rose-800 text-sm flex items-center gap-1.5">
                            <Ban size={12} />
                            Blocked Period
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-medium text-rose-600 mt-1 uppercase tracking-wider">
                            {block.startTime} – {block.endTime}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(block.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-md transition-colors shrink-0"
                          aria-label="Remove block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-rose-700 mt-2 leading-relaxed">{block.reason}</p>
                    </div>
                  )}
                  {appointmentsAtHour.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm border-l-4 border-l-slate-300 cursor-default transition-all"
                    >
                      <div className="font-semibold text-slate-800 text-sm sm:text-base">{apt.patientName}</div>
                      <div className="text-[9px] sm:text-[10px] font-medium text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 uppercase tracking-wide">
                        <span className="bg-slate-50 text-slate-500 font-semibold px-2 py-0.5 rounded-md">
                          Age: {calculateAge(apt.patientDob)} yrs
                        </span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {apt.time}</span>
                        <span>{apt.type}</span>
                        <span className="text-slate-600 font-semibold tracking-widest">MRN: {apt.patientId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const listItems = [
      ...filteredData.map((apt) => ({ kind: 'appointment' as const, sortKey: `${apt.date} ${apt.time}`, apt })),
      ...filteredBlocks.map((block) => ({
        kind: 'block' as const,
        sortKey: `${block.date} ${block.startTime}`,
        block,
      })),
    ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
      {listItems.length > 0 ? listItems.map((item) =>
        item.kind === 'block' ? (
          <div key={item.block.id} className="p-4 sm:p-6 border-l-4 border-rose-400 bg-rose-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="text-center bg-rose-50 rounded-xl px-4 py-2 w-full sm:w-auto sm:min-w-[90px] border border-rose-200 shrink-0">
                <div className="text-sm font-semibold text-rose-800">{item.block.startTime}</div>
                <div className="text-[9px] text-rose-500 font-semibold uppercase tracking-tighter mt-0.5">{item.block.date}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-rose-800 text-base sm:text-lg flex items-center gap-2">
                  <Ban size={14} />
                  Blocked Period
                </div>
                <div className="text-[10px] text-rose-600 font-medium mt-1.5 leading-relaxed">{item.block.reason}</div>
                <div className="text-[10px] text-rose-500 font-medium uppercase tracking-widest mt-1">
                  {item.block.startTime} – {item.block.endTime}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBlock(item.block.id)}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors shrink-0 self-start sm:self-center"
                aria-label="Remove block"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
        <div key={item.apt.id} className="p-4 sm:p-6 cursor-default border-l-4 border-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
             <div className="text-center bg-slate-50 rounded-xl px-4 py-2 w-full sm:w-auto sm:min-w-[90px] border border-slate-200 shrink-0">
                <div className="text-sm font-semibold text-slate-800">{item.apt.time}</div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-tighter mt-0.5">{item.apt.date}</div>
             </div>
             <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800 text-base sm:text-lg truncate">{item.apt.patientName}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1.5 flex flex-wrap items-center gap-2">
                   <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] tracking-widest">MRN: {item.apt.patientId}</span>
                   <span className="text-slate-500 font-semibold">Age: {calculateAge(item.apt.patientDob)} yrs</span>
                   <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded uppercase">{item.apt.patientGender || 'Male'}</span>
                   <span className="text-slate-500 italic font-medium normal-case">"{item.apt.type}"</span>
                </div>
             </div>
          </div>
        </div>
        ),
      ) : (
        <div className="p-12 sm:p-24 text-center text-slate-300">
           <CalendarIcon size={48} className="mx-auto mb-4 text-slate-100" />
           <p className="font-semibold uppercase tracking-widest text-xs">No scheduled items</p>
        </div>
      )}
    </div>
    );
  };

  const renderDetailView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredData.map(apt => (
        <div key={apt.id} onClick={() => handlePatientClick(apt.patientId, apt.date)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer group flex flex-col">
           <div className="flex justify-between items-start mb-4">
              <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-widest border ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {apt.status === 'completed' ? 'Attended' : 'In Queue'}
              </span>
              <span className="text-[8px] font-semibold text-slate-300 uppercase tracking-widest">{apt.patientId}</span>
           </div>
           <h4 className="font-semibold text-slate-800 text-base tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{apt.patientName}</h4>
           <div className="text-[9px] text-orange-500 font-semibold uppercase mb-4 tracking-widest flex items-center gap-2">
             <span>Age: {calculateAge(apt.patientDob)} yrs</span>
             <span className="w-1 h-1 rounded-full bg-orange-200"></span>
             <span className="text-blue-500">{apt.patientGender || 'Male'}</span>
           </div>
           <div className="mt-auto space-y-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <Clock size={14} className="text-blue-600" />
                 <span className="font-semibold uppercase tracking-widest text-[8px] leading-none">{apt.time} • {apt.date}</span>
              </div>
           </div>
           <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
              <div className="text-[8px] font-semibold text-blue-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                 Access Clinical Data <ChevronRight size={12} />
              </div>
           </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-10 animate-in fade-in duration-500 max-w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight uppercase">Clinical Agenda</h2>
            <div className="inline-flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 mt-2">
              <Users size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">{filteredData.length} Bookings</span>
              {filteredBlocks.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <Ban size={12} className="text-rose-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-600">
                    {filteredBlocks.length} Blocked
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openBlockModal}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-[9px] font-semibold uppercase tracking-widest text-rose-700 transition-all hover:bg-rose-100 w-full sm:w-auto"
            >
              <Ban size={13} />
              Block Period
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900 w-full sm:w-auto"
            >
              <Plus size={13} />
              Create Appointment
            </button>

            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-white shadow-inner">
              {(['calendar', 'list'] as DisplayMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDisplayMode(mode)}
                  className={`p-2 rounded-lg transition-all ${
                    displayMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-blue-500'
                  }`}
                  aria-label={mode === 'calendar' ? 'Calendar view' : 'List view'}
                >
                  {mode === 'calendar' ? <LayoutGrid size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
              {(['day', 'month'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 sm:px-5 py-2 rounded-lg text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest transition-all ${
                    viewMode === mode ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 w-full sm:w-auto">
          <button type="button" onClick={handlePrev} className="p-2 sm:p-3 hover:bg-slate-50 rounded-full text-slate-900 transition-all active:scale-90 border border-slate-100 shrink-0">
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          <div className="flex flex-col items-center flex-1 sm:flex-none sm:min-w-[200px] px-2">
            <h3 className="text-sm sm:text-xl font-semibold text-slate-800 uppercase tracking-tight text-center">
              {viewMode === 'day'
                ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h3>
            {viewMode === 'day' && (
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                {currentDate.getFullYear()} Practice Year
              </span>
            )}
          </div>
          <button type="button" onClick={handleNext} className="p-2 sm:p-3 hover:bg-slate-50 rounded-full text-slate-900 transition-all active:scale-90 border border-slate-100 shrink-0">
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={openBlockModal}
            className="md:hidden w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 text-[10px] font-semibold uppercase tracking-widest text-rose-700 hover:bg-rose-100 transition-all"
          >
            <Ban size={14} />
            Block Period
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="md:hidden w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 text-[10px] font-semibold uppercase tracking-widest text-white hover:bg-slate-900 transition-all shadow-md active:scale-95"
          >
            <Plus size={14} />
            Create Appointment
          </button>
          <button
            type="button"
            onClick={handleJumpToToday}
            className="w-full sm:w-auto text-[10px] font-semibold text-white bg-slate-800 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-slate-900 transition-all uppercase tracking-widest shadow-md active:scale-95"
          >
            Jump to Today
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <CalendarIcon size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Create Appointment
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Schedule a new clinical visit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient</label>
                <select
                  value={newAppointment.patientId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
                  <option value="">Select patient...</option>
                  {MOCK_PATIENTS.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => {
                      const date = e.target.value;
                      setNewAppointment({
                        ...newAppointment,
                        date,
                        time: getFirstAvailableSlot(date, blockedPeriods),
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</label>
                  <select
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  >
                    {TIME_SLOTS.map((slot) => {
                      const blocked = isTimeBlocked(newAppointment.date, slot, blockedPeriods);
                      return (
                        <option key={slot} value={slot} disabled={blocked}>
                          {slot}{blocked ? ' (Blocked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {appointmentTimeBlocked && (
                    <p className="text-[10px] font-medium text-rose-600">
                      This time slot is blocked. Choose another time.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Appointment Type</label>
                <select
                  value={newAppointment.type}
                  onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {newAppointment.patientId && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Preview</div>
                  <div className="text-xs font-medium text-slate-700">
                    {MOCK_PATIENTS.find((p) => p.id === newAppointment.patientId)?.name}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                    {newAppointment.date} · {newAppointment.time} · {newAppointment.type}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateAppointment}
                  disabled={
                    !newAppointment.patientId ||
                    !newAppointment.date ||
                    !newAppointment.time ||
                    appointmentTimeBlocked
                  }
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                  <Ban size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Block Period
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Prevent scheduling during this time
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeBlockModal}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Time</label>
                  <select
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End Time</label>
                  <select
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
                <textarea
                  value={newBlock.reason}
                  onChange={(e) => {
                    setBlockFormError('');
                    setNewBlock({ ...newBlock, reason: e.target.value });
                  }}
                  placeholder="e.g. Department meeting, lunch break, procedure..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all resize-none leading-relaxed"
                />
              </div>

              {blockFormError && (
                <p className="text-[10px] font-medium text-rose-600">{blockFormError}</p>
              )}

              {newBlock.reason.trim() && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Preview</div>
                  <div className="text-xs font-medium text-rose-800">
                    {newBlock.date} · {newBlock.startTime} – {newBlock.endTime}
                  </div>
                  <div className="text-[10px] font-medium text-rose-600 mt-1 leading-relaxed">{newBlock.reason.trim()}</div>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={closeBlockModal}
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBlock}
                  disabled={!newBlock.reason.trim()}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Block Period
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-[320px] sm:min-h-[600px] animate-in slide-in-from-bottom-6 duration-700">
        {displayMode === 'calendar' ? (
          viewMode === 'month' ? (
            <>
              <div className="md:hidden">{renderMobileMonthList()}</div>
              {renderMonthView()}
            </>
          ) : (
            renderDayView()
          )
        ) : (
          renderListView()
        )}
      </div>
    </div>
  );
};

export default AgendaView;

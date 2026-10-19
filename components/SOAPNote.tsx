
import React, { useState } from 'react';
import { Save, X, FileText, ClipboardList, Activity, Stethoscope, CheckCircle2, Import, PlusCircle, BarChart2, Signature, ChevronRight } from 'lucide-react';

import { Diagnosis, Medication, Order, ClinicalOrder, Patient } from '../types';

interface SOAPNoteProps {
  onClose: () => void;
  onSave: (data: any) => void;
  patient: Patient;
  caseDetails: {
    caseNumber: string;
    admissionDate: string;
    deptOu: string;
    attendingPhysician: string;
    wardBed: string;
  };
  patientData: {
    diagnoses: Diagnosis[];
    medications: Medication[];
    orders: Order[];
    clinicalOrders: ClinicalOrder[];
    vitals: { description: string, value: string }[];
    labs: { description: string, value: string, range: string }[];
  };
}

type SOAPTab = 'Subjective' | 'Objective' | 'Assessment' | 'Plan';

const SOAPNote: React.FC<SOAPNoteProps> = ({ onClose, onSave, patient, caseDetails, patientData }) => {
  const [activeTab, setActiveTab] = useState<SOAPTab>('Subjective');
  const [soapData, setSoapData] = useState({
    chiefComplaint: '',
    reviewOfSystem: '',
    physicalExam: '',
    assessmentText: '',
    treatmentPlan: '',
    date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
    time: new Date().toLocaleTimeString('en-GB'),
    vitals: [] as { description: string, value: string }[],
    labs: [] as { description: string, value: string, range: string }[],
    services: [] as { description: string, date: string, time: string, responsible: string }[],
    diagnoses: [] as { description: string }[],
    orders: [] as { date: string, description: string }[],
    medications: [] as { description: string }[]
  });

  const handleSave = () => {
    onSave(soapData);
    onClose();
  };

  const handleImport = (type: 'vitals' | 'labs' | 'services' | 'diagnoses' | 'orders' | 'medications') => {
    switch (type) {
      case 'vitals':
        setSoapData(prev => ({
          ...prev,
          vitals: [
            ...prev.vitals,
            ...(patientData.vitals || [])
          ]
        }));
        break;
      case 'labs':
        setSoapData(prev => ({
          ...prev,
          labs: [
            ...prev.labs,
            ...(patientData.labs || [])
          ]
        }));
        break;
      case 'diagnoses':
        setSoapData(prev => ({
          ...prev,
          diagnoses: [
            ...prev.diagnoses,
            ...patientData.diagnoses.map(d => ({ description: `${d.code} - ${d.description}` }))
          ]
        }));
        break;
      case 'medications':
        setSoapData(prev => ({
          ...prev,
          medications: [
            ...prev.medications,
            ...patientData.medications.map(m => ({ description: `${m.name} ${m.dosage} ${m.frequency}` }))
          ]
        }));
        break;
      case 'orders':
        setSoapData(prev => ({
          ...prev,
          orders: [
            ...prev.orders,
            ...patientData.clinicalOrders.map(o => ({ date: o.timestamp.split(' ')[0], description: `${o.type}: ${o.items.map(i => i.description).join(', ')}` }))
          ]
        }));
        break;
      case 'services':
        setSoapData(prev => ({
          ...prev,
          services: [
            ...prev.services,
            ...patientData.clinicalOrders.filter(o => o.status === 'Executed').map(o => ({
              description: o.items.map(i => i.description).join(', '),
              date: o.timestamp.split(' ')[0],
              time: o.timestamp.split(' ')[1] || '00:00:00',
              responsible: 'Dr. Sarah Connor'
            }))
          ]
        }));
        break;
    }
  };

  const handleCreate = (type: 'vitals' | 'labs' | 'diagnoses') => {
    if (type === 'vitals') {
      const countStr = prompt('How many vital entries would you like to add?', '1');
      const count = parseInt(countStr || '0');
      if (isNaN(count) || count <= 0) return;

      const newVitals = [];
      for (let i = 0; i < count; i++) {
        const description = prompt(`Entry ${i + 1}: Enter vital description (e.g. BP, HR):`);
        if (!description) break;
        const value = prompt(`Entry ${i + 1}: Enter value:`);
        newVitals.push({ description, value: value || '' });
      }
      setSoapData(prev => ({ ...prev, vitals: [...prev.vitals, ...newVitals] }));
      return;
    }

    const description = prompt(`Enter ${type} description:`);
    if (!description) return;

    switch (type) {
      case 'labs':
        const lValue = prompt('Enter value:');
        const lRange = prompt('Enter range:');
        setSoapData(prev => ({ ...prev, labs: [...prev.labs, { description, value: lValue || '', range: lRange || '' }] }));
        break;
      case 'diagnoses':
        setSoapData(prev => ({ ...prev, diagnoses: [...prev.diagnoses, { description }] }));
        break;
    }
  };

  const TableHeader = ({ title, actions }: { title: string, actions?: React.ReactNode }) => (
    <div className="flex justify-between items-center mb-2 px-1">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
      <div className="flex gap-2">{actions}</div>
    </div>
  );

  const ActionButton = ({ icon: Icon, label, onClick, color = 'text-blue-600' }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-[8px] font-bold uppercase tracking-tight hover:bg-slate-50 transition-all ${color}`}
    >
      <Icon size={10} /> {label}
    </button>
  );

  const renderSubjective = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason for Visit</h4>
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-2">
            <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Date</label>
            <input type="text" value={soapData.date} readOnly className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600" />
          </div>
          <div className="col-span-2">
            <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Time</label>
            <input type="text" value={soapData.time} readOnly className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600" />
          </div>
          <div className="col-span-8">
            <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Chief complaint</label>
            <input 
              type="text" 
              value={soapData.chiefComplaint}
              onChange={(e) => setSoapData({...soapData, chiefComplaint: e.target.value})}
              placeholder="Primary reason for visit..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <TableHeader title="Review of System" />
        <textarea 
          value={soapData.reviewOfSystem}
          onChange={(e) => setSoapData({...soapData, reviewOfSystem: e.target.value})}
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          placeholder="Detailed review of systems findings..."
        />
      </div>
    </div>
  );

  const renderObjective = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-4">
        <div>
          <TableHeader title="Vital Signs" actions={
            <>
              <ActionButton icon={Import} label="Import" onClick={() => handleImport('vitals')} />
              <ActionButton icon={PlusCircle} label="Create" onClick={() => handleCreate('vitals')} />
            </>
          } />
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase"><th className="p-3 text-left">Description</th><th className="p-3 text-left">Value</th><th className="p-3 w-10"></th></tr>
              </thead>
              <tbody>
                {soapData.vitals.map((v, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3 font-bold text-slate-700">{v.description}</td>
                    <td className="p-3">{v.value}</td>
                    <td className="p-3"></td>
                  </tr>
                ))}
                {soapData.vitals.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">No vital signs recorded. Click Import or Create.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <TableHeader title="Laboratory Tests" actions={
            <>
              <ActionButton icon={Import} label="Import" onClick={() => handleImport('labs')} />
            </>
          } />
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase"><th className="p-3 text-left">Description</th><th className="p-3 text-left">Value</th><th className="p-3 text-left">Range</th><th className="p-3 w-10"></th></tr>
              </thead>
              <tbody>
                {soapData.labs.map((l, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3 font-bold text-slate-700">{l.description}</td>
                    <td className="p-3">{l.value}</td>
                    <td className="p-3 text-slate-500">{l.range}</td>
                    <td className="p-3"></td>
                  </tr>
                ))}
                {soapData.labs.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No lab tests recorded. Click Import.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <TableHeader title="Performed Services" actions={<ActionButton icon={Import} label="Import" onClick={() => handleImport('services')} />} />
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase"><th className="p-3 text-left">Description</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Time</th><th className="p-3 text-left">Responsible</th></tr>
              </thead>
              <tbody>
                {soapData.services.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3 font-bold text-slate-700">{s.description}</td>
                    <td className="p-3">{s.date}</td>
                    <td className="p-3">{s.time}</td>
                    <td className="p-3">{s.responsible}</td>
                  </tr>
                ))}
                {soapData.services.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No services recorded. Click Import.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <TableHeader title="Physical Examination" />
          <textarea 
            value={soapData.physicalExam}
            onChange={(e) => setSoapData({...soapData, physicalExam: e.target.value})}
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder="Physical assessment findings..."
          />
        </div>
      </div>
    </div>
  );

  const renderAssessment = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <TableHeader title="Diagnoses" actions={
          <>
            <ActionButton icon={Import} label="Import" onClick={() => handleImport('diagnoses')} />
            <ActionButton icon={PlusCircle} label="Create" onClick={() => handleCreate('diagnoses')} />
          </>
        } />
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase"><th className="p-3 text-left">Description</th><th className="p-3 w-10"></th></tr>
            </thead>
            <tbody>
              {soapData.diagnoses.map((d, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-3 font-bold text-slate-700">{d.description}</td>
                  <td className="p-3"></td>
                </tr>
              ))}
              {soapData.diagnoses.length === 0 && (
                <tr><td colSpan={2} className="p-8 text-center text-slate-400 italic">No diagnoses recorded. Click Import or Create.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <TableHeader title="Assessment" />
        <textarea 
          value={soapData.assessmentText}
          onChange={(e) => setSoapData({...soapData, assessmentText: e.target.value})}
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          placeholder="Clinical assessment and reasoning..."
        />
      </div>
    </div>
  );

  const renderPlan = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <TableHeader title="Orders" actions={<ActionButton icon={Import} label="Import" onClick={() => handleImport('orders')} />} />
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase"><th className="p-3 text-left">View</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Description</th></tr>
            </thead>
            <tbody>
              {soapData.orders.map((o, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-3"><FileText size={12} className="text-slate-400" /></td>
                  <td className="p-3 tabular-nums">{o.date}</td>
                  <td className="p-3 font-bold text-slate-700">{o.description}</td>
                </tr>
              ))}
              {soapData.orders.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">No orders recorded. Click Import.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <TableHeader title="Medication" actions={<ActionButton icon={Import} label="Import" onClick={() => handleImport('medications')} />} />
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 font-bold uppercase"><th className="p-3 text-left">Description</th><th className="p-3 w-10"></th></tr>
            </thead>
            <tbody>
              {soapData.medications.map((m, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-3 font-bold text-slate-700">{m.description}</td>
                  <td className="p-3"></td>
                </tr>
              ))}
              {soapData.medications.length === 0 && (
                <tr><td colSpan={2} className="p-8 text-center text-slate-400 italic">No medication recorded. Click Import.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <TableHeader title="Management and Treatment Plan" />
        <textarea 
          value={soapData.treatmentPlan}
          onChange={(e) => setSoapData({...soapData, treatmentPlan: e.target.value})}
          className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          placeholder="Management strategy and follow-up plan..."
        />
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
            <Signature size={20} />
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Responsible Physician</p>
            <p className="text-sm font-bold">Dr. Sarah Connor (DOC-01)</p>
          </div>
        </div>
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2">
          <Save size={16} /> Reviewed
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Patient Context Header */}
        <div className="bg-slate-900 px-8 py-4 text-white flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-600 rounded-lg"><ClipboardList size={20} /></div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {patient.name} ({patient.gender === 'Male' ? 'M' : 'F'}, {patient.age || 'N/A'}) • {patient.dob.split('-').reverse().join('.')}
                </h3>
                <div className="flex gap-4 mt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Case: {caseDetails.caseNumber}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Admission: {caseDetails.admissionDate.split('-').reverse().join('.')}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Dept. OU: {caseDetails.deptOu}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-3 gap-8 pt-3 border-t border-white/10">
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Att. Phy.</p>
              <p className="text-[10px] font-bold">{caseDetails.attendingPhysician}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ward / Bed</p>
              <p className="text-[10px] font-bold">{caseDetails.wardBed}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Risk Factors</p>
              <p className="text-[10px] font-bold text-emerald-400">
                {patient.riskFactors.length > 0 ? patient.riskFactors.join(', ') : 'No risk factors found'}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Allergies</p>
              <p className="text-[10px] font-bold text-amber-400">
                {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Allergy documentation missing'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50/50 px-8 py-3 flex items-center gap-2 border-b border-slate-200 shrink-0">
          {(['Subjective', 'Objective', 'Assessment', 'Plan'] as SOAPTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'Subjective' && <FileText size={14} />}
              {tab === 'Objective' && <Activity size={14} />}
              {tab === 'Assessment' && <Stethoscope size={14} />}
              {tab === 'Plan' && <CheckCircle2 size={14} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          {activeTab === 'Subjective' && renderSubjective()}
          {activeTab === 'Objective' && renderObjective()}
          {activeTab === 'Assessment' && renderAssessment()}
          {activeTab === 'Plan' && renderPlan()}
        </div>
      </div>
    </div>
  );
};

export default SOAPNote;

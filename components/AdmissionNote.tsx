
import React, { useState } from 'react';
// Added missing 'Users' icon to the import list
import { Save, X, History, ClipboardList, CheckCircle2, ChevronRight, Plus, Trash2, ShieldCheck, Stethoscope, Import, PlusCircle, AlertCircle, Pill, Activity, FileText, Users } from 'lucide-react';

interface AdmissionNoteProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const SectionList = ({ title, data, emptyLabel, status, icon: Icon, color }: any) => (
  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
    <div className="px-4 py-2.5 bg-white/50 border-b border-slate-200 flex justify-between items-center">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} className={color} />}
        <h4 className="text-[8px] font-semibold text-slate-900 uppercase tracking-widest">{title}</h4>
      </div>
      <div className="flex items-center gap-1">
        <button className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-semibold text-blue-600 uppercase hover:bg-slate-50 transition-all">
          <Import size={8} /> Import
        </button>
        <button className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 rounded text-[7px] font-semibold text-white uppercase hover:bg-blue-700 transition-all">
          <Plus size={8} /> Create
        </button>
      </div>
    </div>
    
    <div className="p-3 flex-1">
      {status && (
        <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 rounded-md">
           <span className="text-[7px] font-semibold text-blue-400 uppercase tracking-tighter">Status:</span>
           <span className="text-[8px] font-bold text-blue-700">{status}</span>
        </div>
      )}
      
      {emptyLabel && (
        <label className="mb-2 flex items-center gap-2 px-2 py-1 bg-slate-100/50 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" className="rounded border-slate-300 text-blue-600 w-3 h-3" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">{emptyLabel}</span>
        </label>
      )}

      <div className="space-y-1">
        {data && data.length > 0 ? (
          data.map((item: string, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-md shadow-sm group">
              <span className="text-[8px] font-bold text-slate-700">{item}</span>
              <button className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={10}/></button>
            </div>
          ))
        ) : (
          <div className="py-4 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-[7px] font-semibold text-slate-300 uppercase tracking-widest">No entries recorded</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const AdmissionNote: React.FC<AdmissionNoteProps> = ({ onClose, onSave }) => {
  const [activeSubTab, setActiveSubTab] = useState<'History' | 'Physical' | 'Plan'>('History');

  const renderHistory = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Reason for Admission */}
      <div className="bg-slate-900 p-5 rounded-xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-5 opacity-5 text-white">
           <FileText size={80} />
        </div>
        <h4 className="text-[8px] font-semibold text-blue-400 uppercase tracking-[0.3em] mb-3 relative z-10">Reason for Admission</h4>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
          <div className="lg:col-span-4">
            <label className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Chief Complaint</label>
            <input 
              placeholder="Primary symptom or reason..."
              className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold focus:bg-white focus:text-slate-900 transition-all outline-none" 
            />
          </div>
          <div className="lg:col-span-8">
            <label className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Anamnesis</label>
            <textarea 
              placeholder="Clinical history related to current admission..."
              className="w-full h-16 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold focus:bg-white focus:text-slate-900 transition-all outline-none resize-none" 
            />
          </div>
        </div>
      </div>

      {/* Tri-Column Section: Risk, Allergy, Health Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionList 
          title="Risk Factors" 
          data={['Fall Risk Assessment']} 
          icon={AlertCircle} 
          color="text-orange-500" 
        />
        <SectionList 
          title="Allergies" 
          data={['Egg (Mild Rash)']} 
          status="Allergies Exist" 
          icon={Stethoscope} 
          color="text-rose-500" 
        />
        <SectionList 
          title="Active Health Problems" 
          data={['Malignant essential hypertension', 'Recurrent urinary tract infection']} 
          emptyLabel="No health problems known" 
          icon={Activity} 
          color="text-blue-500" 
        />
      </div>

      {/* Dual Column Section: Medication and Prev Illness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionList 
          title="Home Medication" 
          data={[
            'ELIQUIS 2.5MG TAB, ORAL, 1 TAB, BID-AC', 
            'PLAVix 75 mg TAB, ORAL, 75 MG (CLOPIDOGREL), BID', 
            'AMLOCARD 5MG TAB, ORAL, 1 TAB, BID-AC'
          ]} 
          emptyLabel="No medication applicable" 
          icon={Pill} 
          color="text-emerald-500" 
        />
        <SectionList 
          title="Previous Illnesses" 
          data={['Hyperparathyroidism (2019)']} 
          emptyLabel="No previous illnesses known" 
          icon={History} 
          color="text-indigo-500" 
        />
      </div>

      {/* Family History Table Style */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users size={10} className="text-blue-500" /> Family History
          </h4>
          <button className="text-[8px] font-semibold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-all">+ Add History Entry</button>
        </div>
        <div className="overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-[8px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="p-2 border-r border-slate-200">Description</th>
                <th className="p-2 text-center border-r border-slate-200">Mother</th>
                <th className="p-2 text-center border-r border-slate-200">Father</th>
                <th className="p-2 text-center border-r border-slate-200">Mat. Grandmother</th>
                <th className="p-2 text-center">Mat. Grandfather</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2 font-bold border-r border-slate-200">Hyperlipidemia (cholesterol, triglycerides...)</td>
                <td className="p-2 text-center border-r border-slate-200"><input type="checkbox" className="rounded w-3 h-3" defaultChecked /></td>
                <td className="p-2 text-center border-r border-slate-200"><input type="checkbox" className="rounded w-3 h-3" defaultChecked /></td>
                <td className="p-2 text-center border-r border-slate-200"><input type="checkbox" className="rounded w-3 h-3" /></td>
                <td className="p-2 text-center"><input type="checkbox" className="rounded w-3 h-3" /></td>
              </tr>
              <tr>
                <td className="p-2 font-bold border-r border-slate-200 text-slate-300 italic">No family history known</td>
                <td className="p-2 text-center border-r border-slate-200"><input type="checkbox" className="rounded w-3 h-3" /></td>
                <td className="p-2 text-center border-r border-slate-200"><input type="checkbox" className="rounded w-3 h-3" /></td>
                <td className="p-2 text-center border-r border-slate-200"><input type="checkbox" className="rounded w-3 h-3" /></td>
                <td className="p-2 text-center"><input type="checkbox" className="rounded w-3 h-3" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPhysical = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Vital Signs</h4>
            <div className="flex gap-1">
              <button className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-semibold text-blue-600 uppercase"><Import size={8} className="inline mr-1"/> Import</button>
              <button className="px-2 py-0.5 bg-blue-600 rounded text-[7px] font-semibold text-white uppercase"><Plus size={8} className="inline mr-1"/> Create</button>
            </div>
          </div>
          <table className="w-full text-[8px]">
            <thead className="border-b border-slate-200"><tr className="text-slate-500 font-semibold uppercase text-left"><th className="pb-2">Description</th><th className="pb-2">Measured Value</th><th className="pb-2">Normal Range</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="py-2 font-bold">Systolic Arterial Pressure</td><td className="py-2"><input className="w-14 p-1 bg-white rounded border border-slate-200 font-semibold text-blue-600" defaultValue="130" /> mmHg</td><td className="py-2 text-slate-400 font-bold">90 mmHg</td></tr>
              <tr><td className="py-2 font-bold">Diastolic Arterial Pressure</td><td className="py-2"><input className="w-14 p-1 bg-white rounded border border-slate-200 font-semibold text-blue-600" defaultValue="90" /> mmHg</td><td className="py-2 text-slate-400 font-bold">70 mmHg</td></tr>
              <tr><td className="py-2 font-bold">Weight</td><td className="py-2"><input className="w-14 p-1 bg-white rounded border border-slate-200 font-semibold text-blue-600" defaultValue="65" /> kg</td><td className="py-2 text-slate-400 font-bold">0 kg - ...</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Laboratory Tests</h4>
            <button className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-semibold text-blue-600 uppercase"><Import size={8} className="inline mr-1"/> Import</button>
          </div>
          <div className="flex-1 bg-white border border-slate-100 rounded-lg flex items-center justify-center">
            <p className="text-[8px] text-slate-300 font-semibold uppercase tracking-widest">None Imported</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Pre-admission and Admission Tests</h4>
            <button className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-semibold text-blue-600 uppercase"><Import size={8} className="inline mr-1"/> Import</button>
          </div>
          <div className="flex-1 min-h-[120px] bg-white border border-slate-100 rounded-lg p-3 text-center text-slate-300 flex flex-col justify-center">
            <p className="text-[7px] font-semibold uppercase mb-1">Document Viewer</p>
            <p className="text-[9px] font-bold italic">Select an entry from the table to view</p>
          </div>
        </div>
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
          <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Summary of Physical Examination</h4>
          <textarea className="w-full flex-1 min-h-[120px] p-3 bg-white border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-inner" placeholder="Complete physical assessment summary..."></textarea>
        </div>
      </div>
    </div>
  );

  const renderPlan = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center mb-3">
             <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Diagnoses</h4>
             <div className="flex gap-1">
                <button className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-semibold text-blue-600 uppercase">Import</button>
                <button className="px-2 py-0.5 bg-blue-600 rounded text-[7px] font-semibold text-white uppercase">Create</button>
             </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" className="rounded w-3 h-3" />
              <span className="text-[8px] font-bold text-slate-400 uppercase">Pending Investigations</span>
            </label>
            <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-[8px] font-bold text-slate-700">I10 - Essential (primary) hypertension</div>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
          <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Treatment & Recommendations</h4>
          <div className="bg-white p-3 rounded-lg border border-slate-100 flex-1 flex flex-col">
            <label className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Care Plan</label>
            <textarea className="w-full flex-1 p-2 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-medium" placeholder="Outlined management strategy..."></textarea>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
           <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Medication</h4>
           <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" className="rounded w-3 h-3" />
              <span className="text-[8px] font-bold text-slate-400 uppercase">No medication order applicable</span>
            </label>
           <div className="h-16 bg-white border border-slate-100 rounded-lg flex items-center justify-center">
              <p className="text-[8px] text-slate-300 font-semibold uppercase">No active records</p>
           </div>
        </div>
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
           <h4 className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Signatures & Documents</h4>
           <div className="space-y-2">
              <div className="bg-white border border-slate-100 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[7px] font-semibold text-slate-400 uppercase">Audit Trail</span>
                   <span className="text-[7px] font-semibold text-blue-600 uppercase">Active</span>
                </div>
                <table className="w-full text-[8px]">
                   <thead className="border-b border-slate-100 text-slate-500 font-semibold uppercase"><tr><th className="pb-1 text-left">Ver</th><th className="pb-1 text-left">Date/Time</th><th className="pb-1 text-right">Physician</th></tr></thead>
                   <tbody>
                      <tr><td className="py-1">1.0</td><td className="py-1">{new Date().toLocaleDateString()} 12:00:00</td><td className="py-1 text-right font-bold text-blue-600">S. CONNOR</td></tr>
                   </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
      
      <div className="bg-slate-900 text-white p-5 rounded-xl flex justify-between items-center shadow-lg border-b-2 border-slate-800">
         <div className="flex gap-6">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-blue-400"><Stethoscope size={18} /></div>
               <div><span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest block">Responsible Physician</span><span className="text-[11px] font-bold">Dr. Sarah Connor (DOC-01)</span></div>
            </div>
         </div>
         <button onClick={() => onSave({})} className="bg-blue-600 px-6 py-3 rounded-lg font-semibold text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md active:scale-95 border-b-2 border-blue-800">
            <Save size={14} /> Finalize & Digitally Sign Note
         </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[95vw] h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg border-b-2 border-blue-800"><Stethoscope size={24} /></div>
            <div>
              <div className="flex items-center gap-2">
                 <h2 className="text-xl font-semibold tracking-tight uppercase leading-none">Admission Note</h2>
                 <span className="bg-blue-500/20 text-blue-400 text-[7px] font-semibold px-2 py-0.5 rounded-full border border-blue-400/20 uppercase tracking-widest">Clinical Ver 3.1</span>
              </div>
              <p className="text-slate-400 text-[7px] font-semibold uppercase tracking-[0.3em] mt-1.5">Institutional Documentation Protocol • Physician Portal Medical Center</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-full text-slate-400 transition-all active:scale-90 border border-white/10 shadow-md"><X size={20} /></button>
        </div>

        <div className="bg-slate-50/50 px-5 py-3 flex items-center gap-2 border-b border-slate-200 shrink-0">
          {[
            { id: 'History', label: 'Patient History', icon: History },
            { id: 'Physical', label: 'Physical Examination', icon: ClipboardList },
            { id: 'Plan', label: 'Findings and Care Plan', icon: CheckCircle2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-blue-50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          {activeSubTab === 'History' && renderHistory()}
          {activeSubTab === 'Physical' && renderPhysical()}
          {activeSubTab === 'Plan' && renderPlan()}
        </div>
      </div>
    </div>
  );
};

export default AdmissionNote;

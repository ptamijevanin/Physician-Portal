
import React, { useState, useRef } from 'react';
import { Plus, Save, Trash2, Activity, MapPin, Search, ChevronRight, CheckCircle2, AlertCircle, CheckCircle, User, X } from 'lucide-react';

import { Point } from '../types';
import { useConfirmDelete } from '../hooks/useConfirmDelete';

interface PhysicalExamProps {
  points: Point[];
  onUpdate: (points: Point[]) => void;
  readOnly?: boolean;
}

const PhysicalExam: React.FC<PhysicalExamProps> = ({ points, onUpdate, readOnly }) => {
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdding || draggingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint: Point = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      label: label || 'New Finding',
      notes: '',
      view: activeView,
    };
    
    onUpdate([...points, newPoint]);
    setIsAdding(false);
    setLabel('');
    setValidationError(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    onUpdate(points.map(p => p.id === draggingId ? { ...p, x, y } : p));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const updatePoint = (id: string, updates: Partial<Point>) => {
    onUpdate(points.map(p => p.id === id ? { ...p, ...updates } : p));
    setValidationError(null);
  };

  const handleSave = () => {
    if (points.length === 0) {
      setValidationError("Please add at least one mark to the body before saving.");
      return;
    }
    
    const incompletePoints = points.filter(p => !p.notes?.trim());
    if (incompletePoints.length > 0) {
      setValidationError(`Please enter findings for all marks (${incompletePoints.length} pending)`);
      return;
    }
    
    setValidationError(null);
    setShowSavedModal(true);
    setTimeout(() => setShowSavedModal(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 uppercase tracking-tight">Physical Examination</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Mark findings on anatomical model and add comments</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-xl p-1 border border-white shadow-inner">
            <button 
              onClick={() => setActiveView('front')} 
              className={`px-5 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all ${activeView === 'front' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Front View
            </button>
            <button 
              onClick={() => setActiveView('back')} 
              className={`px-5 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all ${activeView === 'back' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Back View
            </button>
          </div>
          {!readOnly && (
            <button 
              onClick={handleSave}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest hover:bg-slate-800 flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Save size={16} />
              Save Findings
            </button>
          )}
        </div>
      </div>

      {validationError && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="text-rose-500" size={18} />
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{validationError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Anatomical Model */}
        <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center min-h-[750px] relative overflow-hidden">
          <div className="mb-8 w-full flex justify-center z-10">
            {!readOnly && (
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className={`px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 border-b-4 ${isAdding ? 'bg-rose-500 text-white border-rose-700 scale-95' : 'bg-blue-600 text-white border-blue-800 hover:bg-blue-700 hover:-translate-y-0.5'}`}
                >
                  {isAdding ? <X size={16} /> : <Plus size={16} />}
                  {isAdding ? 'Cancel Adding' : 'Add New Finding'}
                </button>
                {isAdding && (
                  <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest animate-pulse">
                    Click on the body to mark a finding
                  </p>
                )}
              </div>
            )}
          </div>

          <div 
            ref={containerRef}
            className={`relative w-full max-w-[450px] aspect-[1/2.1] rounded-2xl bg-slate-50/50 border border-slate-100 shadow-inner flex items-center justify-center transition-all ${isAdding ? 'cursor-crosshair ring-4 ring-blue-50 bg-blue-50/20' : draggingId ? 'cursor-grabbing' : 'cursor-default'}`}
            onClick={handleContainerClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Enhanced Anatomical SVG */}
            <div className={`relative h-[98%] w-full flex items-center justify-center transition-all duration-700 ${isAdding ? 'opacity-60' : 'opacity-100'}`}>
              <svg className="h-full w-auto object-contain drop-shadow-2xl" viewBox="0 0 200 500">
                <defs>
                  <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fdf2f2" />
                    <stop offset="50%" stopColor="#fee2e2" />
                    <stop offset="100%" stopColor="#fdf2f2" />
                  </linearGradient>
                  <filter id="bodyShadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.1" />
                  </filter>
                </defs>
                {activeView === 'front' ? (
                  <g filter="url(#bodyShadow)">
                    {/* Detailed Front Body */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M100,15 C82,15 72,25 72,48 C72,72 82,88 100,88 C118,88 128,72 128,48 C128,25 118,15 100,15" /> {/* Head */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M88,88 L112,88 L110,105 L90,105 Z" /> {/* Neck */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M90,105 C65,110 45,125 40,155 C35,185 25,230 40,245 C50,255 65,250 70,240 C75,230 82,160 82,160 L82,310 C82,310 85,330 100,330 C115,330 118,310 118,310 L118,160 C118,160 125,230 130,240 C135,250 150,255 160,245 C175,230 165,185 160,155 C155,125 135,110 110,105" /> {/* Torso & Arms */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M82,310 L68,485 L98,485 L100,330 L102,485 L132,485 L118,310" /> {/* Legs */}
                    {/* Muscle/Bone Definitions */}
                    <path d="M85,115 Q100,125 115,115" fill="none" stroke="#fecaca" strokeWidth="1" /> {/* Clavicle */}
                    <path d="M80,170 Q100,185 120,170" fill="none" stroke="#fecaca" strokeWidth="1" /> {/* Pectorals */}
                    <path d="M95,240 Q100,245 105,240" fill="none" stroke="#fecaca" strokeWidth="1" /> {/* Navel */}
                    <path d="M85,320 Q100,335 115,320" fill="none" stroke="#fecaca" strokeWidth="1" /> {/* Pelvis */}
                  </g>
                ) : (
                  <g filter="url(#bodyShadow)">
                    {/* Detailed Back Body */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M100,15 C82,15 72,25 72,48 C72,72 82,88 100,88 C118,88 128,72 128,48 C128,25 118,15 100,15" /> {/* Head */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M88,88 L112,88 L110,105 L90,105 Z" /> {/* Neck */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M90,105 C65,110 45,125 40,155 C35,185 25,230 40,245 C50,255 65,250 70,240 C75,230 82,160 82,160 L82,310 C82,310 85,330 100,330 C115,330 118,310 118,310 L118,160 C118,160 125,230 130,240 C135,250 150,255 160,245 C175,230 165,185 160,155 C155,125 135,110 110,105" /> {/* Torso & Arms */}
                    <path fill="url(#skinGradient)" stroke="#fca5a5" strokeWidth="1.5" d="M82,310 L68,485 L98,485 L100,330 L102,485 L132,485 L118,310" /> {/* Legs */}
                    {/* Spine & Back Details */}
                    <path d="M100,105 L100,330" fill="none" stroke="#fecaca" strokeWidth="1.5" strokeDasharray="6,6" /> {/* Spine */}
                    <path d="M85,140 Q100,150 115,140" fill="none" stroke="#fecaca" strokeWidth="1" /> {/* Shoulder Blades */}
                    <path d="M85,300 Q100,315 115,300" fill="none" stroke="#fecaca" strokeWidth="1" /> {/* Lower Back */}
                  </g>
                )}
              </svg>
            </div>

            {points.filter(p => p.view === activeView).map(point => (
              <div 
                key={point.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 ${draggingId === point.id ? 'scale-150 z-50' : ''}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onMouseDown={(e) => {
                  if (readOnly) return;
                  e.stopPropagation();
                  setDraggingId(point.id);
                }}
              >
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40 scale-150"></div>
                   <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg group-hover:scale-125 transition-transform flex items-center justify-center">
                      <MapPin size={10} className="text-white" />
                   </div>
                </div>
                
                {point.notes && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl z-50 border border-slate-700 uppercase tracking-widest translate-y-2 group-hover:translate-y-0">
                    {point.notes.length > 30 ? point.notes.substring(0, 30) + '...' : point.notes}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="lg:col-span-5 flex flex-col h-full space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Findings: {activeView === 'front' ? 'Front' : 'Back'} View</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {points.filter(p => p.view === activeView).length} Marks in this view
                </p>
              </div>
              <Activity size={18} className="text-blue-600" />
            </div>
            
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[700px] custom-scrollbar px-6">
              {points.filter(p => p.view === activeView).length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <MapPin size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">No markings in {activeView} view</p>
                </div>
              ) : (
                points.filter(p => p.view === activeView).map((point) => (
                  <div key={point.id} className="py-4 flex items-center gap-4 group animate-in slide-in-from-right-2 duration-300">
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <input 
                      type="text"
                      readOnly={readOnly}
                      value={point.notes || ''}
                      onChange={(e) => updatePoint(point.id, { notes: e.target.value })}
                      placeholder={readOnly ? "No findings recorded" : "Enter clinical finding here..."}
                      className={`flex-1 text-[13px] text-slate-700 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-200 font-medium ${readOnly ? 'cursor-default' : ''}`}
                    />
                    {!readOnly && (
                      <button 
                        type="button"
                        onClick={() =>
                          requestDelete(
                            () => onUpdate(points.filter((p) => p.id !== point.id)),
                            { itemLabel: point.label || 'Physical exam finding' },
                          )
                        }
                        className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showSavedModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-slate-900 text-white px-10 py-5 rounded-3xl shadow-2xl flex items-center gap-5 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-base font-bold uppercase tracking-tight">Examination Saved</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">All findings and markings recorded</p>
            </div>
          </div>
        </div>
      )}
      {ConfirmDeleteDialog}
    </div>
  );
};

export default PhysicalExam;

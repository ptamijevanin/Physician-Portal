
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Star, Trash2, Clock, Building2, 
  Beaker, Layers, ChevronRight, CheckCircle2, 
  X, Filter, Zap, Info, Loader2
} from 'lucide-react';
import { ClinicalOrder } from '../types';
import ModulePageHeader from './ModulePageHeader';
import { useConfirmDelete } from '../hooks/useConfirmDelete';

interface ClinicalOrdersProps {
  orders: ClinicalOrder[];
  onUpdate: (orders: ClinicalOrder[]) => void;
  readOnly?: boolean;
}

const MOCK_CPT_CODES = [
  // Laboratory
  { code: '80048', description: 'Basic Metabolic Panel (ICD-10: R53.1)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  { code: '85025', description: 'CBC with differential (ICD-10: D64.9)', type: 'Laboratory', category: 'Hematology', ou: 'Main Lab' },
  { code: '81001', description: 'Urinalysis with microscopy (ICD-10: N39.0)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  { code: '82310', description: 'Calcium; total (ICD-10: E83.51)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  { code: '80053', description: 'Comprehensive Metabolic Panel (ICD-10: Z00.00)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  { code: '84443', description: 'TSH (ICD-10: E03.9)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  { code: '85027', description: 'CBC without differential (ICD-10: D64.9)', type: 'Laboratory', category: 'Hematology', ou: 'Main Lab' },
  { code: '80061', description: 'Lipid Panel (ICD-10: E78.5)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  { code: '83036', description: 'Hemoglobin A1c (ICD-10: E11.9)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  { code: '82565', description: 'Creatinine; blood (ICD-10: N18.9)', type: 'Laboratory', category: 'Biology', ou: 'Main Lab' },
  // Radiology
  { code: '70551', description: 'MRI Brain without contrast (ICD-10: G44.1)', type: 'Radiology', category: 'MRI', ou: 'Radiology Dept A' },
  { code: '71250', description: 'CT Chest without contrast (ICD-10: R05.9)', type: 'Radiology', category: 'CT', ou: 'Radiology Dept B' },
  { code: '74150', description: 'CT Abdomen without contrast (ICD-10: R10.9)', type: 'Radiology', category: 'CT', ou: 'Radiology Dept B' },
  { code: '70450', description: 'CT Head without contrast (ICD-10: S06.9X0A)', type: 'Radiology', category: 'CT', ou: 'Radiology Dept A' },
  { code: '71045', description: 'X-Ray Chest 1 View (ICD-10: J18.9)', type: 'Radiology', category: 'X-Ray', ou: 'Radiology Dept A' },
  { code: '72141', description: 'MRI Spine Cervical without contrast (ICD-10: M54.2)', type: 'Radiology', category: 'MRI', ou: 'Radiology Dept A' },
  { code: '70553', description: 'MRI Brain with and without contrast (ICD-10: C71.9)', type: 'Radiology', category: 'MRI', ou: 'Radiology Dept A' },
  { code: '71046', description: 'X-Ray Chest 2 Views (ICD-10: J18.9)', type: 'Radiology', category: 'X-Ray', ou: 'Radiology Dept A' },
];

const MOCK_ADMISSION_TEMPLATES = [
  { id: 'T1', name: 'General Medicine Admission', unit: 'General Medicine', reason: 'Acute Medical Condition' },
  { id: 'T2', name: 'Cardiology Admission', unit: 'Cardiology Unit', reason: 'Cardiac Evaluation' },
  { id: 'T3', name: 'ICU Admission', unit: 'ICU', reason: 'Critical Care Monitoring' },
  { id: 'T4', name: 'Surgical Admission', unit: 'Surgical Ward', reason: 'Post-Operative Care' },
  { id: 'T5', name: 'Pediatric Admission', unit: 'Pediatrics', reason: 'Pediatric Care' },
];

const ClinicalOrders: React.FC<ClinicalOrdersProps> = ({ orders, onUpdate, readOnly }) => {
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const [activeTab, setActiveTab] = useState<'Laboratory' | 'Radiology'>('Laboratory');
  const [historyTab, setHistoryTab] = useState<'All' | 'Laboratory' | 'Radiology' | 'Admission'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionStep, setAdmissionStep] = useState<'template' | 'details'>('template');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('clinical_order_favorites');
      if (stored) return JSON.parse(stored) as string[];
    } catch { /* ignore */ }
    return ['80048', '85025', '70551'];
  });
  const [priority, setPriority] = useState<ClinicalOrder['priority']>('Routine');
  const [selectedItems, setSelectedItems] = useState<(typeof MOCK_CPT_CODES[0] & { type: 'Laboratory' | 'Radiology' })[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<typeof MOCK_CPT_CODES[0][]>([]);
  
  const [admissionData, setAdmissionData] = useState({
    reason: '',
    ward: 'General Medicine',
    notes: '',
    priority: 'Normal' as ClinicalOrder['priority'],
    templateId: ''
  });
  
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  
  const toggleOrderExpand = (id: string) => {
    setExpandedOrders(prev => prev.includes(id) ? prev.filter(oId => oId !== id) : [...prev, id]);
  };

  const searchCache = useRef<Record<string, typeof MOCK_CPT_CODES[0][]>>({});
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const favoriteCodes = useMemo(() => {
    return MOCK_CPT_CODES.filter(item => item.type === activeTab && favorites.includes(item.code));
  }, [favorites, activeTab]);

  const filteredOrders = useMemo(() => {
    if (historyTab === 'All') return orders;
    return orders.filter(o => o.type === historyTab);
  }, [orders, historyTab]);

  // Faster search with debouncing and cache
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase().trim();
      
      if (searchCache.current[q + activeTab]) {
        setResults(searchCache.current[q + activeTab]);
        return;
      }

      setLoading(true);
      debounceTimer.current = setTimeout(() => {
        const matches = MOCK_CPT_CODES.filter(item => 
          item.type === activeTab && 
          (item.code.includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
        );
        searchCache.current[q + activeTab] = matches;
        setResults(matches);
        setLoading(false);
      }, 300);
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, activeTab]);

  const handleToggleItem = (item: typeof MOCK_CPT_CODES[0]) => {
    const isSelected = selectedItems.find(i => i.code === item.code);
    if (!isSelected) {
      setSearchQuery('');
    }
    setSelectedItems(prev => 
      isSelected
        ? prev.filter(i => i.code !== item.code) 
        : [...prev, item as any]
    );
  };

  const handleCreateOrder = (status: ClinicalOrder['status']) => {
    if (selectedItems.length === 0) return;
    
    // Group items by type to create separate orders if needed, or one mixed order if type allowed
    // Since type is restricted to 'Laboratory' | 'Radiology', we create separate orders
    const labItems = selectedItems.filter(i => i.type === 'Laboratory');
    const radItems = selectedItems.filter(i => i.type === 'Radiology');
    
    const newOrders: ClinicalOrder[] = [];
    
    if (labItems.length > 0) {
      newOrders.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'Laboratory',
        items: labItems.map(i => ({
          code: i.code,
          description: i.description,
          category: i.category,
          performingOu: i.ou
        })),
        priority,
        status,
        timestamp: new Date().toLocaleString()
      });
    }
    
    if (radItems.length > 0) {
      newOrders.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'Radiology',
        items: radItems.map(i => ({
          code: i.code,
          description: i.description,
          category: i.category,
          performingOu: i.ou
        })),
        priority,
        status,
        timestamp: new Date().toLocaleString()
      });
    }
    
    onUpdate([...newOrders, ...orders]);
    setShowAddModal(false);
    setSearchQuery('');
    setSelectedItems([]);
  };

  const handleCreateAdmissionOrder = () => {
    if (!admissionData.reason) return;

    const newOrder: ClinicalOrder = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Admission',
      items: [],
      priority: admissionData.priority,
      status: 'Requested',
      timestamp: new Date().toLocaleString(),
      admissionDetails: {
        reason: admissionData.reason,
        ward: admissionData.ward,
        notes: admissionData.notes,
        templateId: admissionData.templateId
      }
    };

    onUpdate([newOrder, ...orders]);
    setShowAdmissionModal(false);
    setAdmissionStep('template');
    setAdmissionData({ reason: '', ward: 'General Medicine', notes: '', priority: 'Normal', templateId: '' });
  };

  const handleSelectTemplate = (template: typeof MOCK_ADMISSION_TEMPLATES[0]) => {
    setAdmissionData({
      ...admissionData,
      reason: template.reason,
      ward: template.unit,
      templateId: template.id
    });
    setAdmissionStep('details');
  };

  const toggleFavorite = (code: string) => {
    setFavorites(prev => {
      const next = prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code];
      try { localStorage.setItem('clinical_order_favorites', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const getPriorityColor = (p: ClinicalOrder['priority']) => {
    switch (p) {
      case 'Critical/Saving': return 'bg-rose-600 text-white border-rose-700 shadow-rose-500/20';
      case 'Urgent': return 'bg-orange-500 text-white border-orange-600 shadow-orange-500/20';
      case 'Late Elective': return 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20';
      default: return 'bg-slate-900 text-white border-slate-900 shadow-slate-500/20';
    }
  };

  const getPriorityBadge = (p: ClinicalOrder['priority']) => {
    switch (p) {
      case 'Critical/Saving': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Urgent': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Late Elective': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ModulePageHeader
        title="Clinical Orders"
        subtitle="Laboratory, radiology and admission requests"
        actions={
          !readOnly ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900"
              >
                <Plus size={13} />
                New Lab / Rad Order
              </button>
              <button
                type="button"
                onClick={() => setShowAdmissionModal(true)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-emerald-800"
              >
                <Building2 size={13} />
                Admission Request
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Main List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
            {(['All', 'Laboratory', 'Radiology', 'Admission'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setHistoryTab(tab)}
                className={`text-[10px] font-medium uppercase tracking-wider pb-1 border-b-2 transition-all whitespace-nowrap shrink-0 ${historyTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-2.5 py-1 bg-white rounded-md border border-slate-100 shadow-sm self-start sm:self-auto shrink-0">{filteredOrders.length} Requests</span>
        </div>
        <div className="divide-y divide-slate-50 min-h-[400px]">
          {filteredOrders.length > 0 ? filteredOrders.map((order) => {
            const isExpanded = expandedOrders.includes(order.id);
            return (
            <div key={order.id} className="flex flex-col border-b border-slate-50 last:border-0">
              <div 
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 group transition-colors cursor-pointer"
                onClick={() => toggleOrderExpand(order.id)}
              >
                <div className="flex gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                    order.type === 'Laboratory' ? 'bg-blue-50 text-blue-600' : 
                    order.type === 'Radiology' ? 'bg-purple-50 text-purple-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {order.type === 'Laboratory' ? <Beaker size={20} /> : 
                     order.type === 'Radiology' ? <Layers size={20} /> :
                     <Building2 size={20} />}
                  </div>
                  <div>
                    <div className="flex flex-col gap-1">
                      {order.type === 'Admission' ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800">Admission Request: {order.admissionDetails?.reason}</span>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ward: {order.admissionDetails?.ward}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{order.type} Order</span>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">({order.items.length} items)</span>
                        </div>
                      )}
                      <span className={`w-fit text-[10px] font-medium px-2 py-1 rounded-md border uppercase tracking-wider ${getPriorityBadge(order.priority)}`}>
                        {order.priority}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <Building2 size={12} className="text-indigo-500 shrink-0" /> {order.type === 'Admission' ? order.admissionDetails?.ward : order.items[0]?.performingOu}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <Clock size={12} className="text-indigo-500 shrink-0" /> {order.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                    order.status === 'Executed' ? 'bg-emerald-500 text-white' : 
                    order.status === 'Signed' ? 'bg-blue-500 text-white' : 
                    order.status === 'Requested' ? 'bg-amber-500 text-white' :
                    'bg-indigo-500 text-white'
                  }`}>
                    {order.status}
                  </span>
                  {!readOnly && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const label =
                          order.type === 'Admission'
                            ? `Admission: ${order.admissionDetails?.reason}`
                            : `${order.type} order (${order.items.length} items)`;
                        requestDelete(
                          () => onUpdate(orders.filter((o) => o.id !== order.id)),
                          { itemLabel: label },
                        );
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <ChevronRight size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>
              
              {isExpanded && order.type !== 'Admission' && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 sm:pl-[76px] animate-in slide-in-from-top-2 duration-200">
                  <div className="md:hidden space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-1">
                        <div className="text-xs font-medium text-slate-500">{item.code}</div>
                        <div className="text-sm font-medium text-slate-800">{item.description}</div>
                        <div className="text-xs font-medium text-slate-500">{item.category}</div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-100/50">
                          <th className="px-4 py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Code</th>
                          <th className="px-4 py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{item.code}</td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-800">{item.description}</td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-500">{item.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            );
          }) : (
            <div className="py-24 text-center">
              <CheckCircle2 size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">No {historyTab.toLowerCase()} orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 uppercase tracking-tight">Create Clinical Order</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Laboratory and Radiology Requests</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Tabs */}
              <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
                <button 
                  onClick={() => setActiveTab('Laboratory')} 
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'Laboratory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Beaker size={16} /> Laboratory
                </button>
                <button 
                  onClick={() => setActiveTab('Radiology')} 
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'Radiology' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Layers size={16} /> Radiology
                </button>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {(['Routine', 'Urgent', 'Late Elective', 'Critical/Saving'] as const).map(p => (
                    <button 
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${
                        priority === p ? `${getPriorityColor(p)} shadow-md` : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Items (Cart) */}
              {selectedItems.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Selected Items ({selectedItems.length})</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    {selectedItems.map(item => (
                      <div key={item.code} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm animate-in zoom-in-95">
                        <span className="text-[10px] font-bold text-slate-800">{item.description}</span>
                        <button onClick={() => handleToggleItem(item)} className="text-slate-400 hover:text-rose-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Search */}
              <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab} CPT Codes or Descriptions...`} 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 font-bold text-sm transition-all"
                  />
                  {loading ? <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={18} /> : <Zap className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />}
                </div>

                {/* Search Results or Favorites */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {searchQuery ? 'Search Results' : 'Favorites'}
                    </span>
                    <Info size={12} className="text-slate-300" />
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                    {(searchQuery ? results : favoriteCodes).length > 0 ? (
                      (searchQuery ? results : favoriteCodes).map((item) => {
                        const isSelected = selectedItems.find(i => i.code === item.code);
                        return (
                          <div key={item.code} className={`p-4 flex items-center justify-between transition-colors group ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-white'}`}>
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => toggleFavorite(item.code)}
                                className={`p-1.5 rounded-lg transition-all ${favorites.includes(item.code) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                              >
                                <Star size={16} fill={favorites.includes(item.code) ? 'currentColor' : 'none'} />
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-800">{item.description}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">({item.code})</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">{item.category}</span>
                                  <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Building2 size={8} /> {item.ou}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleToggleItem(item)}
                              className={`px-4 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center">
                        <Search size={32} className="mx-auto text-slate-100 mb-2" />
                        <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest">
                          {searchQuery ? 'No matching codes found' : 'No favorites added yet'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-6 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleCreateOrder('Confirmed')}
                disabled={selectedItems.length === 0}
                className="bg-indigo-600 text-white px-12 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admission Modal */}
      {showAdmissionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 uppercase tracking-tight">
                  {admissionStep === 'template' ? 'Select Admission Template' : 'Admission Order Details'}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Institutional Admission Request SJ</p>
              </div>
              <button 
                onClick={() => {
                  setShowAdmissionModal(false);
                  setAdmissionStep('template');
                }} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {admissionStep === 'template' ? (
                <div className="grid grid-cols-1 gap-3">
                  {MOCK_ADMISSION_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:border-indigo-500 hover:shadow-md transition-all group"
                    >
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{template.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unit: {template.unit}</div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Admission Reason</label>
                    <input 
                      type="text"
                      value={admissionData.reason}
                      onChange={(e) => setAdmissionData({...admissionData, reason: e.target.value})}
                      placeholder="e.g., Acute Respiratory Distress"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Target Ward / Unit</label>
                      <select 
                        value={admissionData.ward}
                        onChange={(e) => setAdmissionData({...admissionData, ward: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm transition-all"
                      >
                        <option>General Medicine</option>
                        <option>Cardiology Unit</option>
                        <option>ICU</option>
                        <option>Surgical Ward</option>
                        <option>Pediatrics</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                      <div className="flex gap-2">
                        {(['Normal', 'Urgent', 'Critical/Saving'] as const).map(p => (
                          <button 
                            key={p}
                            onClick={() => setAdmissionData({...admissionData, priority: p})}
                            className={`flex-1 px-3 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all border ${
                              admissionData.priority === p ? `${getPriorityColor(p)} shadow-md` : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Clinical Notes</label>
                    <textarea 
                      value={admissionData.notes}
                      onChange={(e) => setAdmissionData({...admissionData, notes: e.target.value})}
                      placeholder="Additional instructions for the admitting team..."
                      className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm transition-all resize-none"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              {admissionStep === 'details' && (
                <button 
                  onClick={() => setAdmissionStep('template')}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-6 py-2"
                >
                  Back to Templates
                </button>
              )}
              <button 
                onClick={() => {
                  setShowAdmissionModal(false);
                  setAdmissionStep('template');
                }}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-6 py-2"
              >
                Cancel
              </button>
              {admissionStep === 'details' && (
                <button 
                  onClick={handleCreateAdmissionOrder}
                  disabled={!admissionData.reason}
                  className="bg-emerald-600 text-white px-12 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
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

export default ClinicalOrders;


import React, { useState } from 'react';
import { Plus, ClipboardList, User, Clock, Trash2, X } from 'lucide-react';

import { Order } from '../types';
import ModulePageHeader from './ModulePageHeader';
import { useConfirmDelete } from '../hooks/useConfirmDelete';

interface PhysicianOrdersProps {
  orders: Order[];
  onUpdate: (orders: Order[]) => void;
  readOnly?: boolean;
}

const PhysicianOrders: React.FC<PhysicianOrdersProps> = ({ orders, onUpdate, readOnly }) => {
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const [showAddModal, setShowAddModal] = useState(false);
  const defaultNewOrder = () => ({
    type: 'Nursing' as const,
    description: '',
    assignedTo: 'Nurse',
  });
  const [newOrder, setNewOrder] = useState(defaultNewOrder);

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewOrder(defaultNewOrder());
  };

  const openAddModal = () => {
    setNewOrder(defaultNewOrder());
    setShowAddModal(true);
  };

  const handleAddOrder = (status: Order['status']) => {
    if (!newOrder.description.trim()) return;

    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      ...newOrder,
      description: newOrder.description.trim(),
      status,
      timestamp: new Date().toLocaleString(),
    };

    onUpdate([order, ...orders]);
    closeAddModal();
  };

  const roles = ['Nurse', 'Physiotherapist', 'Occupational Therapist', 'Respiratory Therapist', 'Dietician', 'Social Worker'];

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'Executed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Signed':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Saved':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleStatusChange = (id: string, nextStatus: Order['status']) => {
    onUpdate(orders.map(o => o.id === id ? { ...o, status: nextStatus } : o));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <ModulePageHeader
        title="Physician Orders"
        subtitle="Nursing and therapy directives for clinical staff"
        actions={
          !readOnly ? (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900 w-full sm:w-auto"
            >
              <Plus size={13} />
              New Order
            </button>
          ) : undefined
        }
      />

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <ClipboardList size={18} />
            </div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Orders</h4>
          </div>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100">
            {orders.length} Directives
          </span>
        </div>

        <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
          {orders.length > 0 ? orders.map((order) => (
            <div
              key={order.id}
              className="group text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                  <span className="text-slate-700 truncate">{order.description}</span>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      requestDelete(
                        () => onUpdate(orders.filter((o) => o.id !== order.id)),
                        { itemLabel: order.description },
                      )
                    }
                    disabled={order.status === 'Signed' || order.status === 'Executed'}
                    className={`p-1 rounded-md transition-colors shrink-0 ${
                      order.status === 'Signed' || order.status === 'Executed'
                        ? 'text-slate-200 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    aria-label={`Remove ${order.description}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User size={10} />
                  {order.assignedTo}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={10} />
                  {order.timestamp}
                </span>
                {order.status === 'Saved' && !readOnly && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(order.id, 'Signed')}
                    className="px-2 py-0.5 rounded-md border border-blue-200 bg-blue-50 text-[10px] font-medium uppercase tracking-wider text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Sign
                  </button>
                )}
              </div>
            </div>
          )) : (
            <p className="text-xs font-medium text-slate-400 italic">No active orders</p>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                  <ClipboardList size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Create Physician Order
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Specify directives for clinical staff
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
              <PhysicianOrderForm newOrder={newOrder} roles={roles} onChange={setNewOrder} />
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors sm:order-1"
                >
                  Cancel
                </button>
                <div className="flex flex-col sm:flex-row gap-2 sm:order-2">
                  <button
                    type="button"
                    onClick={() => handleAddOrder('Saved')}
                    disabled={!newOrder.description.trim()}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-[10px] font-semibold uppercase tracking-widest text-orange-700 hover:bg-orange-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save as Saved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddOrder('Signed')}
                    disabled={!newOrder.description.trim()}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save as Signed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {ConfirmDeleteDialog}
    </div>
  );
};

const orderFieldClass =
  'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-medium text-slate-800 transition-all resize-none';

interface PhysicianOrderFormProps {
  newOrder: {
    type: 'Nursing';
    description: string;
    assignedTo: string;
  };
  roles: string[];
  onChange: React.Dispatch<React.SetStateAction<PhysicianOrderFormProps['newOrder']>>;
}

const PhysicianOrderForm: React.FC<PhysicianOrderFormProps> = ({ newOrder, roles, onChange }) => (
  <div className="space-y-5">
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Role</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange({ ...newOrder, assignedTo: role })}
            className={`px-2.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all border ${
              newOrder.assignedTo === role
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Description</label>
      <textarea
        value={newOrder.description}
        onChange={(e) => onChange({ ...newOrder, description: e.target.value })}
        placeholder="Enter detailed directives here..."
        rows={5}
        className={orderFieldClass}
      />
    </div>

    {newOrder.description.trim() && (
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Preview</div>
        <div className="text-xs font-medium text-slate-700">{newOrder.description.trim()}</div>
        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
          <User size={10} />
          {newOrder.assignedTo}
        </div>
      </div>
    )}

  </div>
);

export default PhysicianOrders;

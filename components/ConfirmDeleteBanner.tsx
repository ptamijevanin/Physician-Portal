import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDeleteBannerProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteBanner: React.FC<ConfirmDeleteBannerProps> = ({
  isOpen,
  title = 'Confirm Delete',
  message = 'This action cannot be undone.',
  itemLabel,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-message"
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-rose-100 bg-rose-50/80 flex items-start gap-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 id="confirm-delete-title" className="text-xs font-semibold text-rose-800 uppercase tracking-widest">
              {title}
            </h4>
            <p id="confirm-delete-message" className="text-[10px] font-medium text-rose-700/90 mt-1 leading-relaxed">
              {itemLabel ? (
                <>
                  Are you sure you want to delete <span className="font-semibold">{itemLabel}</span>? {message}
                </>
              ) : (
                message
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-400 transition-colors shrink-0"
            aria-label="Cancel delete"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteBanner;

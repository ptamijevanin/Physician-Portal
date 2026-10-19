import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, ClipboardList } from 'lucide-react';
import { useConfirmDelete } from '../hooks/useConfirmDelete';

export interface PatientInstructionsBlock {
  id: string;
  title: string;
  content: string;
}

export interface PatientInstructionsData {
  blocks: PatientInstructionsBlock[];
}

interface PatientInstructionsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PatientInstructionsData) => void;
  initialData?: PatientInstructionsData | null;
  formMode?: 'create' | 'edit' | 'newVersion';
  versionNumber?: number;
}

const fieldClassName =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none';

const labelClassName = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest';

const createBlock = (index: number): PatientInstructionsBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  title: `Section ${index}`,
  content: '',
});

const PatientInstructionsForm: React.FC<PatientInstructionsFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  formMode = 'create',
  versionNumber,
}) => {
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const [blocks, setBlocks] = useState<PatientInstructionsBlock[]>([createBlock(1)]);
  const [error, setError] = useState('');

  const formSubtitle =
    formMode === 'newVersion'
      ? `New Version (v${versionNumber ?? 2})`
      : formMode === 'edit'
        ? `Edit Patient Instructions${versionNumber ? ` · v${versionNumber}` : ''}`
        : 'Create Patient Instructions';

  useEffect(() => {
    if (!isOpen) return;

    if (initialData?.blocks.length) {
      setBlocks(initialData.blocks.map((block) => ({ ...block })));
      setError('');
      return;
    }

    setBlocks([createBlock(1)]);
    setError('');
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const resetForm = () => {
    setBlocks([createBlock(1)]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addBlock = () => {
    setBlocks((prev) => [...prev, createBlock(prev.length + 1)]);
  };

  const updateBlock = (id: string, field: 'title' | 'content', value: string) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, [field]: value } : block)));
    setError('');
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => (prev.length === 1 ? prev : prev.filter((block) => block.id !== id)));
  };

  const handleSave = () => {
    const normalized = blocks
      .map((block) => ({
        ...block,
        title: block.title.trim(),
        content: block.content.trim(),
      }))
      .filter((block) => block.title || block.content);

    if (normalized.length === 0) {
      setError('Please add at least one instruction block with content.');
      return;
    }

    onSave({ blocks: normalized });
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-lg">
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Patient Instructions</h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                {formSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Add free-text instruction blocks for the patient. Each block can have a title and body text.
              </p>
              <button
                type="button"
                onClick={addBlock}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors shrink-0"
              >
                <Plus size={14} />
                Add Block
              </button>
            </div>

            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className={labelClassName} htmlFor={`block-title-${block.id}`}>
                      Block {index + 1} Title
                    </label>
                    {blocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          requestDelete(
                            () => removeBlock(block.id),
                            {
                              itemLabel: block.title.trim() || `Block ${index + 1}`,
                              message: 'It will be removed from this document.',
                            },
                          )
                        }
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        aria-label="Remove block"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    id={`block-title-${block.id}`}
                    type="text"
                    value={block.title}
                    onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                    placeholder={`Section ${index + 1} title`}
                    className={`${fieldClassName} py-2.5 resize-none`}
                  />
                  <div className="space-y-2">
                    <label className={labelClassName} htmlFor={`block-content-${block.id}`}>
                      Instructions
                    </label>
                    <textarea
                      id={`block-content-${block.id}`}
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                      rows={5}
                      placeholder="Enter patient instructions for this section..."
                      className={fieldClassName}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {ConfirmDeleteDialog}
    </div>
  );
};

export default PatientInstructionsForm;

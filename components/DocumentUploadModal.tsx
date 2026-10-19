import React, { useEffect, useMemo, useState } from 'react';
import { X, Upload, FileText, Calendar, Clock, Building2 } from 'lucide-react';

export interface DocumentUploadData {
  file: File;
  date: string;
  time: string;
  description: string;
  department: string;
}

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: DocumentUploadData) => void;
  departments: string[];
  defaultDepartment: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toTimeInputValue = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  departments,
  defaultDepartment,
}) => {
  const now = new Date();
  const [date, setDate] = useState(toDateInputValue(now));
  const [time, setTime] = useState(toTimeInputValue(now));
  const [department, setDepartment] = useState(defaultDepartment);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const departmentOptions = useMemo(() => {
    const options = new Set(departments);
    if (defaultDepartment && defaultDepartment !== 'N/A') {
      options.add(defaultDepartment);
    }
    return Array.from(options).sort();
  }, [departments, defaultDepartment]);

  useEffect(() => {
    if (!isOpen) return;
    const current = new Date();
    setDate(toDateInputValue(current));
    setTime(toTimeInputValue(current));
    setDepartment(
      defaultDepartment && defaultDepartment !== 'N/A' && departmentOptions.includes(defaultDepartment)
        ? defaultDepartment
        : departmentOptions[0] ?? '',
    );
    setDescription('');
    setFile(null);
    setError('');
  }, [isOpen, defaultDepartment, departmentOptions]);

  if (!isOpen) return null;

  const resetForm = () => {
    const current = new Date();
    setDate(toDateInputValue(current));
    setTime(toTimeInputValue(current));
    setDepartment(
      defaultDepartment && defaultDepartment !== 'N/A' && departmentOptions.includes(defaultDepartment)
        ? defaultDepartment
        : departmentOptions[0] ?? '',
    );
    setDescription('');
    setFile(null);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a document description.');
      return;
    }
    if (!department) {
      setError('Please select a department.');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }

    onUpload({ file, date, time, description: description.trim(), department });
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Upload size={18} />
            </div>
            <h3 className="text-base font-bold uppercase tracking-tight">Upload Attachment</h3>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Calendar size={12} />
                Document Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Clock size={12} />
                Document Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Building2 size={12} />
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
              required
            >
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Document Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Discharge summary, Lab report..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              PDF File
            </label>
            <label className="flex flex-col items-center justify-center gap-3 w-full px-4 py-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer">
              <FileText size={28} className="text-indigo-500" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {file ? file.name : 'Click to select a PDF file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF only</p>
              </div>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError('');
                }}
              />
            </label>
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md"
            >
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;

import React, { useEffect, useMemo, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { Patient } from '../types';
import { CaseDetails } from '../utils/pdfDocumentLayout';
import {
  generateLabRadReportPdfBlob,
  getLabRadReportPdfFilename,
  LabRadReport,
} from '../utils/generateLabRadReportPdf';

interface LabRadReportPDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  report: LabRadReport | null;
  patient: Patient;
  caseDetails: CaseDetails;
}

const LabRadReportPDFViewer: React.FC<LabRadReportPDFViewerProps> = ({
  isOpen,
  onClose,
  report,
  patient,
  caseDetails,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const pdfFilename = useMemo(
    () => (report ? getLabRadReportPdfFilename(report, patient.id) : 'report.pdf'),
    [report, patient.id],
  );

  useEffect(() => {
    if (!isOpen || !report) {
      setPdfUrl(null);
      return;
    }

    setIsGenerating(true);
    const blob = generateLabRadReportPdfBlob(report, patient, caseDetails);
    const file = new File([blob], pdfFilename, { type: 'application/pdf' });
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setIsGenerating(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isOpen, report, patient, caseDetails, pdfFilename]);

  if (!isOpen || !report) return null;

  const iconClass =
    report.type === 'Laboratory' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-full max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${iconClass}`}>
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest truncate">
                {report.service}
              </h3>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5 truncate">
                {pdfFilename} • {report.date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 bg-slate-100 min-h-0">
          {isGenerating || !pdfUrl ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
              <p className="text-xs font-semibold uppercase tracking-widest">Loading document PDF...</p>
            </div>
          ) : (
            <iframe
              title={report.service}
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LabRadReportPDFViewer;

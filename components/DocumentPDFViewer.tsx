import React, { useEffect, useMemo, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { ClinicalDocument, Patient } from '../types';
import { CaseDetails } from '../utils/pdfDocumentLayout';
import {
  generateClinicalDocumentPdfBlob,
  getClinicalDocumentPdfFilename,
} from '../utils/generateClinicalDocumentPdf';

interface DocumentPDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: ClinicalDocument | null;
  patient: Patient;
  caseDetails: CaseDetails;
}

const DocumentPDFViewer: React.FC<DocumentPDFViewerProps> = ({
  isOpen,
  onClose,
  document,
  patient,
  caseDetails,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const pdfFilename = useMemo(
    () => (document ? getClinicalDocumentPdfFilename(document, patient.id) : 'document.pdf'),
    [document, patient.id],
  );

  useEffect(() => {
    if (!isOpen || !document) {
      setPdfUrl(null);
      return;
    }

    if (document.pdfUrl) {
      setPdfUrl(document.pdfUrl);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    const blob = generateClinicalDocumentPdfBlob(document, patient, caseDetails);
    const file = new File([blob], pdfFilename, { type: 'application/pdf' });
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setIsGenerating(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isOpen, document, patient, caseDetails, pdfFilename]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-full max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest truncate">
                {document.description}
              </h3>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5 truncate">
                {pdfFilename} • {document.date} {document.time}
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
              title={document.description}
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPDFViewer;

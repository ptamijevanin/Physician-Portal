import React, { useEffect, useMemo, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { Medication, Patient } from '../types';
import { generatePrescriptionPdfBlob, getPrescriptionPdfFilename } from '../utils/generatePrescriptionPdf';
import { preloadArabicFont } from '../utils/pdfArabicFont';

interface CaseDetails {
  caseNumber: string;
  admissionDate: string;
  deptOu: string;
  attendingPhysician: string;
  wardBed: string;
}

interface MedicationPrescriptionPDFProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  caseDetails: CaseDetails;
  medications: Medication[];
}

const MedicationPrescriptionPDF: React.FC<MedicationPrescriptionPDFProps> = ({
  isOpen,
  onClose,
  patient,
  caseDetails,
  medications,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const pdfFilename = useMemo(() => getPrescriptionPdfFilename(patient.id), [patient.id]);

  useEffect(() => {
    preloadArabicFont();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPdfUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const generatePdf = async () => {
      setIsGenerating(true);
      try {
        const blob = await generatePrescriptionPdfBlob(patient, caseDetails, medications);
        if (cancelled) return;
        const file = new File([blob], pdfFilename, { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
      } catch (error) {
        console.error('Failed to generate prescription PDF', error);
        if (!cancelled) setPdfUrl(null);
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };

    void generatePdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, patient, caseDetails, medications, pdfFilename]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-full max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest truncate">
                Ordonnance Médicale Unifiée
              </h3>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5 truncate">
                {pdfFilename} • {medications.length} médicament{medications.length === 1 ? '' : 's'}
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
              <Loader2 size={28} className="animate-spin text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-widest">Generating ordonnance PDF...</p>
            </div>
          ) : (
            <iframe
              title={`Prescription for ${patient.name}`}
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationPrescriptionPDF;

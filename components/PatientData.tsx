
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, FileText, Pill, Stethoscope, ClipboardList, History, 
  Scissors, ShieldCheck, Plus, Save, StickyNote, Search, X, Lock,
  Microscope, FileSearch, Trash2, Layers, Loader2, UserCircle, Zap, AlertCircle, Upload, FilePlus, Pencil, Eye, GitBranch, ChevronDown, ChevronRight, Bed, Activity, Sparkles
} from 'lucide-react';
import ModulePageHeader from './ModulePageHeader';
import DiagnosisView from './DiagnosisView';
import ProgressNotes from './ProgressNotes';
import PhysicalExam from './PhysicalExam';
import AdmissionNote from './AdmissionNote';
import MedicationModule from './MedicationModule';
import PhysicianOrders from './PhysicianOrders';
import ClinicalOrders from './ClinicalOrders';
import LabRadReportsModule from './LabRadReportsModule';
import DocumentPDFViewer from './DocumentPDFViewer';
import DocumentUploadModal, { DocumentUploadData } from './DocumentUploadModal';
import SOAPDocumentForm, { SOAPDocumentData } from './SOAPDocumentForm';
import SOAPDocumentView from './SOAPDocumentView';
import PatientInstructionsForm, { PatientInstructionsData } from './PatientInstructionsForm';
import PatientInstructionsView from './PatientInstructionsView';
import {
  buildSoapDocumentXml,
  formatSoapDocumentDescription,
  getSoapDocumentVersion,
  isSoapDocument,
  isSoapXmlContent,
  parseSoapDocumentXml,
  SOAP_DOCUMENT_DESCRIPTION,
} from '../utils/soapDocumentXml';
import {
  buildPatientInstructionsXml,
  formatPatientInstructionsDescription,
  isPatientInstructionsDocument,
  isPatientInstructionsXmlContent,
  parsePatientInstructionsXml,
  PATIENT_INSTRUCTIONS_DESCRIPTION,
} from '../utils/patientInstructionsXml';
import {
  getDocumentVersion,
  getNextDocumentVersion,
  isLatestVersionedDocument,
  organizeDocumentsForDisplay,
  resolveDocumentGroupId,
} from '../utils/versionedClinicalDocuments';
import PrivateNote from './PrivateNote';
import { Patient, Encounter, Diagnosis, Medication, Order, Point, ClinicalOrder, ClinicalDocument } from '../types';
import { CLINICAL_DEPARTMENTS } from '../constants';
import { getSmartDiagnosis, getSmartMedication, generatePatientHistorySummary } from '../services/geminiService';
import { applyCaseSnapshot, getCaseSnapshot, getDefaultCaseNumber, getPatientCases } from '../utils/patientCaseHistory';

interface PatientDataProps {
  patient: Patient;
  selectedCaseNumber: string;
  onBack: () => void;
}

type PatientModule = 'summary' | 'diagnosis' | 'pe' | 'documents' | 'medication' | 'clinical_orders' | 'orders' | 'lab_rad' | 'progress_notes' | 'private_note';

const PatientData: React.FC<PatientDataProps> = ({ patient, selectedCaseNumber, onBack }) => {
  const [activeTab, setActiveTab] = useState<PatientModule>('summary');
  const [showAdmissionNote, setShowAdmissionNote] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingPDFDoc, setViewingPDFDoc] = useState<ClinicalDocument | null>(null);
  const [showSOAPNote, setShowSOAPNote] = useState(false);
  const [editingSoapDoc, setEditingSoapDoc] = useState<ClinicalDocument | null>(null);
  const [newVersionSourceDoc, setNewVersionSourceDoc] = useState<ClinicalDocument | null>(null);
  const [showPatientInstructions, setShowPatientInstructions] = useState(false);
  const [editingPatientInstructionsDoc, setEditingPatientInstructionsDoc] = useState<ClinicalDocument | null>(null);
  const [newVersionSourcePatientInstructionsDoc, setNewVersionSourcePatientInstructionsDoc] =
    useState<ClinicalDocument | null>(null);
  const [showXMLView, setShowXMLView] = useState(false);
  const [selectedXML, setSelectedXML] = useState<{ title: string, content: string } | null>(null);

  const resolvedCaseNumber = selectedCaseNumber || getDefaultCaseNumber(patient);
  const caseSnapshot = useMemo(
    () => getCaseSnapshot(patient, resolvedCaseNumber),
    [patient, resolvedCaseNumber],
  );
  const hasActiveCase = caseSnapshot.isActive;
  const caseDetails = caseSnapshot.caseDetails;
  const selectedCaseSummary = useMemo(() => {
    const cases = getPatientCases(patient);
    return cases.find((c) => c.caseNumber === resolvedCaseNumber) || cases[0];
  }, [patient, resolvedCaseNumber]);
  const caseType = selectedCaseSummary?.caseType || 'Outpatient';
  const isInpatientCase = caseType === 'Inpatient';

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(() => caseSnapshot.diagnoses);
  const [medications, setMedications] = useState<Medication[]>(() => caseSnapshot.medications);
  const [orders, setOrders] = useState<Order[]>(() => caseSnapshot.orders);
  const [clinicalOrders, setClinicalOrders] = useState<ClinicalOrder[]>(() => caseSnapshot.clinicalOrders);
  const [points, setPoints] = useState<Point[]>(() => caseSnapshot.points);
  const [documents, setDocuments] = useState<ClinicalDocument[]>(() => caseSnapshot.documents);

  useEffect(() => {
    const snapshot = getCaseSnapshot(patient, resolvedCaseNumber);
    applyCaseSnapshot(snapshot, {
      setDiagnoses,
      setMedications,
      setOrders,
      setClinicalOrders,
      setPoints,
      setDocuments,
    });
    setViewingPDFDoc(null);
    setShowSOAPNote(false);
    setEditingSoapDoc(null);
    setNewVersionSourceDoc(null);
    setShowPatientInstructions(false);
    setEditingPatientInstructionsDoc(null);
    setNewVersionSourcePatientInstructionsDoc(null);
    setShowXMLView(false);
    setSelectedXML(null);
    setActiveTab('summary');
  }, [patient.id, resolvedCaseNumber]);

  const [vitals, setVitals] = useState([
    { description: 'Systolic Arterial Pressure', value: '120 mmHg' },
    { description: 'Diastolic Arterial Pressure', value: '80 mmHg' },
    { description: 'Heart Rate', value: '72 bpm' },
    { description: 'Temperature', value: '36.6 °C' },
    { description: 'Oxygen Saturation', value: '98%' }
  ]);

  const [labs, setLabs] = useState([
    { description: 'Hemoglobin', value: '14.2 g/dL', range: '13.5 - 17.5' },
    { description: 'WBC Count', value: '7.5 x10^3/uL', range: '4.5 - 11.0' },
    { description: 'Platelets', value: '250 x10^3/uL', range: '150 - 450' },
    { description: 'Sodium', value: '140 mEq/L', range: '135 - 145' },
    { description: 'Potassium', value: '4.2 mEq/L', range: '3.5 - 5.1' }
  ]);

  const formatDisplayDate = (dateValue: string) => {
    const [year, month, day] = dateValue.split('-');
    return `${day}.${month}.${year}`;
  };

  const formatDisplayTime = (timeValue: string) => timeValue.slice(0, 5);

  const handleViewXML = (doc: ClinicalDocument) => {
    setSelectedXML({ title: doc.description, content: doc.xmlContent });
    setShowXMLView(true);
  };

  const handleViewPDF = (doc: ClinicalDocument) => {
    setViewingPDFDoc(doc);
  };

  const handleCreateSOAP = () => {
    setEditingSoapDoc(null);
    setNewVersionSourceDoc(null);
    setShowSOAPNote(true);
  };

  const handleEditSOAP = (doc: ClinicalDocument) => {
    setNewVersionSourceDoc(null);
    setEditingSoapDoc(doc);
    setShowSOAPNote(true);
  };

  const handleNewSOAPVersion = (doc: ClinicalDocument) => {
    if (!isLatestVersionedDocument(doc, documents)) return;
    setEditingSoapDoc(null);
    setNewVersionSourceDoc(doc);
    setShowSOAPNote(true);
  };

  const handleCreatePatientInstructions = () => {
    setEditingPatientInstructionsDoc(null);
    setNewVersionSourcePatientInstructionsDoc(null);
    setShowPatientInstructions(true);
  };

  const handleEditPatientInstructions = (doc: ClinicalDocument) => {
    setNewVersionSourcePatientInstructionsDoc(null);
    setEditingPatientInstructionsDoc(doc);
    setShowPatientInstructions(true);
  };

  const handleNewPatientInstructionsVersion = (doc: ClinicalDocument) => {
    if (!isLatestVersionedDocument(doc, documents)) return;
    setEditingPatientInstructionsDoc(null);
    setNewVersionSourcePatientInstructionsDoc(doc);
    setShowPatientInstructions(true);
  };

  const handleSavePatientInstructions = (data: PatientInstructionsData) => {
    const xmlContent = buildPatientInstructionsXml(data);

    if (editingPatientInstructionsDoc) {
      const version = getDocumentVersion(editingPatientInstructionsDoc);
      const updatedDoc: ClinicalDocument = {
        ...editingPatientInstructionsDoc,
        description: formatPatientInstructionsDescription(version),
        xmlContent,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === editingPatientInstructionsDoc.id ? updatedDoc : doc)),
      );
      setEditingPatientInstructionsDoc(null);
      setShowPatientInstructions(false);
      setViewingPDFDoc(updatedDoc);
      return;
    }

    if (newVersionSourcePatientInstructionsDoc) {
      const groupId = resolveDocumentGroupId(newVersionSourcePatientInstructionsDoc);
      const nextVersion = getNextDocumentVersion(documents, newVersionSourcePatientInstructionsDoc);
      const newDoc: ClinicalDocument = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        department: caseDetails.deptOu,
        status: 'Reviewed',
        description: formatPatientInstructionsDescription(nextVersion),
        responsible: newVersionSourcePatientInstructionsDoc.responsible,
        hasPDF: true,
        xmlContent,
        version: nextVersion,
        documentGroupId: groupId,
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setNewVersionSourcePatientInstructionsDoc(null);
      setShowPatientInstructions(false);
      setViewingPDFDoc(newDoc);
      return;
    }

    const groupId = Math.random().toString(36).substr(2, 9);
    const newDoc: ClinicalDocument = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      department: caseDetails.deptOu,
      status: 'Reviewed',
      description: formatPatientInstructionsDescription(1),
      responsible: 'Dr. Sarah Connor',
      hasPDF: true,
      xmlContent,
      version: 1,
      documentGroupId: groupId,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setShowPatientInstructions(false);
    setViewingPDFDoc(newDoc);
  };

  const handleSaveSOAP = (data: SOAPDocumentData) => {
    const xmlContent = buildSoapDocumentXml(data);

    const syncSoapDiagnosesToChart = () => {
      const today = new Date().toISOString().split('T')[0];
      setDiagnoses((prev) => {
        const existingCodes = new Set(prev.map((d) => d.code.toLowerCase()));
        const toAdd = data.icdDiagnoses
          .filter((item) => item.code && !existingCodes.has(item.code.toLowerCase()))
          .map((item) => ({
            id: Math.random().toString(36).substr(2, 9),
            code: item.code,
            description: item.description,
            date: today,
            status: 'Active',
            type: 'Admitting' as const,
            markers: [] as Diagnosis['markers'],
          }));

        if (toAdd.length === 0) return prev;
        return [...toAdd, ...prev];
      });
    };

    if (editingSoapDoc) {
      const version = getSoapDocumentVersion(editingSoapDoc);
      const updatedDoc: ClinicalDocument = {
        ...editingSoapDoc,
        description: formatSoapDocumentDescription(version),
        xmlContent,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };
      setDocuments((prev) => prev.map((doc) => (doc.id === editingSoapDoc.id ? updatedDoc : doc)));
      syncSoapDiagnosesToChart();
      setEditingSoapDoc(null);
      setShowSOAPNote(false);
      setViewingPDFDoc(updatedDoc);
      return;
    }

    if (newVersionSourceDoc) {
      const groupId = resolveDocumentGroupId(newVersionSourceDoc);
      const nextVersion = getNextDocumentVersion(documents, newVersionSourceDoc);
      const newDoc: ClinicalDocument = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        department: caseDetails.deptOu,
        status: 'Reviewed',
        description: formatSoapDocumentDescription(nextVersion),
        responsible: newVersionSourceDoc.responsible,
        hasPDF: true,
        xmlContent,
        version: nextVersion,
        documentGroupId: groupId,
        soapDocumentGroupId: groupId,
      };
      setDocuments((prev) => [newDoc, ...prev]);
      syncSoapDiagnosesToChart();
      setNewVersionSourceDoc(null);
      setShowSOAPNote(false);
      setViewingPDFDoc(newDoc);
      return;
    }

    const groupId = Math.random().toString(36).substr(2, 9);
    const newDoc: ClinicalDocument = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      department: caseDetails.deptOu,
      status: 'Reviewed',
      description: formatSoapDocumentDescription(1),
      responsible: 'Dr. Sarah Connor',
      hasPDF: true,
      xmlContent,
      version: 1,
      documentGroupId: groupId,
      soapDocumentGroupId: groupId,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    syncSoapDiagnosesToChart();
    setShowSOAPNote(false);
    setViewingPDFDoc(newDoc);
  };

  const handleSignDocument = (doc: ClinicalDocument) => {
    setDocuments((prev) =>
      prev.map((item) => (item.id === doc.id ? { ...item, status: 'Signed' as const } : item)),
    );
  };

  const handleUploadDocument = (data: DocumentUploadData) => {
    const pdfUrl = URL.createObjectURL(data.file);
    setDocuments((prev) => [{
      id: Math.random().toString(36).substr(2, 9),
      date: formatDisplayDate(data.date),
      time: formatDisplayTime(data.time),
      department: data.department,
      status: 'Signed',
      description: data.description,
      responsible: 'Dr. Sarah Connor',
      hasPDF: true,
      xmlContent: '',
      pdfUrl,
      fileName: data.file.name,
      isUploaded: true,
    }, ...prev]);
  };

  const handleEditVersionedDocument = (doc: ClinicalDocument) => {
    if (isSoapDocument(doc)) handleEditSOAP(doc);
    else if (isPatientInstructionsDocument(doc)) handleEditPatientInstructions(doc);
  };

  const handleNewVersionedDocument = (doc: ClinicalDocument) => {
    if (isSoapDocument(doc)) handleNewSOAPVersion(doc);
    else if (isPatientInstructionsDocument(doc)) handleNewPatientInstructionsVersion(doc);
  };

  const renderModule = () => {
    switch (activeTab) {
      case 'summary': return (
        <SummaryView 
          patient={patient} 
          diagnoses={diagnoses}
          medications={medications}
          orders={orders}
          caseType={caseType}
        />
      );
      case 'diagnosis': return <DiagnosisView diagnoses={diagnoses} onUpdate={setDiagnoses} readOnly={!hasActiveCase} />;
      case 'pe': return <PhysicalExam points={points} onUpdate={setPoints} readOnly={!hasActiveCase} />;
      case 'documents': return (
        <DocumentsModule 
          documents={documents}
          onViewPDF={handleViewPDF}
          onViewXML={handleViewXML}
          onUpload={() => setShowUploadModal(true)}
          onCreateSOAP={handleCreateSOAP}
          onCreatePatientInstructions={handleCreatePatientInstructions}
          onEditDocument={handleEditVersionedDocument}
          onNewDocumentVersion={handleNewVersionedDocument}
          onSignDocument={handleSignDocument}
          readOnly={!hasActiveCase}
          caseType={caseType}
        />
      );
      case 'medication': return (
        <MedicationModule
          medications={medications}
          onUpdate={setMedications}
          patient={patient}
          caseDetails={caseDetails}
          readOnly={!hasActiveCase}
        />
      );
      case 'clinical_orders': return <ClinicalOrders orders={clinicalOrders} onUpdate={setClinicalOrders} readOnly={!hasActiveCase} />;
      case 'orders': return <PhysicianOrders orders={orders} onUpdate={setOrders} readOnly={!hasActiveCase} />;
      case 'lab_rad': return <LabRadReportsModule patient={patient} caseDetails={caseDetails} />;
      case 'progress_notes': return <ProgressNotes patientId={patient.id} readOnly={!hasActiveCase} />;
      case 'private_note': return <PrivateNote patientId={patient.id} />;
      default: return <SummaryView patient={patient} diagnoses={diagnoses} medications={medications} orders={orders} caseType={caseType} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-8 relative">
      {!hasActiveCase && (
        <div className="bg-amber-50 border border-amber-200 p-3 sm:p-4 rounded-xl flex items-start sm:items-center gap-3 sm:gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 uppercase tracking-widest">
              {caseSnapshot.isActive === false && resolvedCaseNumber
                ? `Historical Case ${resolvedCaseNumber}`
                : 'Read-Only Mode: No Active Case'}
            </h4>
            <p className="text-xs text-amber-700 font-medium mt-0.5">
              {caseSnapshot.isActive === false && resolvedCaseNumber
                ? 'You are viewing a closed case. Data entry is disabled. Select an active case from the header to make changes.'
                : 'This patient does not have an active clinical case linked. Data entry is disabled until a case is opened.'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div
          className={`bg-white p-1 rounded-xl border shadow-sm flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-1 ${
            isInpatientCase ? 'border-orange-200' : 'border-blue-200'
          }`}
        >
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-lg shrink-0 mr-0.5 ${
              isInpatientCase ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
            }`}
            title={isInpatientCase ? 'Inpatient workflow' : 'Outpatient workflow'}
          >
            {isInpatientCase ? <Bed size={13} /> : <Activity size={13} />}
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {isInpatientCase ? 'IP' : 'OP'}
            </span>
          </div>
          {(isInpatientCase
            ? [
                { id: 'summary', label: 'Summary', shortLabel: 'Summary', icon: History },
                { id: 'diagnosis', label: 'Diagnoses', shortLabel: 'Dx', icon: Stethoscope },
                { id: 'progress_notes', label: 'Progress Notes', shortLabel: 'Notes', icon: StickyNote },
                { id: 'orders', label: 'Physician Orders', shortLabel: 'Orders', icon: ClipboardList },
                { id: 'clinical_orders', label: 'Clinical Orders', shortLabel: 'Clin.', icon: Zap },
                { id: 'medication', label: 'Medication', shortLabel: 'Meds', icon: Pill },
                { id: 'lab_rad', label: 'Lab/Rad Reports', shortLabel: 'Lab/Rad', icon: Layers },
                { id: 'documents', label: 'Documents', shortLabel: 'Docs', icon: FileText },
                { id: 'private_note', label: 'Private Note', shortLabel: 'Private', icon: Lock },
              ]
            : [
                { id: 'summary', label: 'Summary', shortLabel: 'Summary', icon: History },
                { id: 'diagnosis', label: 'Diagnoses', shortLabel: 'Dx', icon: Stethoscope },
                { id: 'documents', label: 'Documents', shortLabel: 'Docs', icon: FileText },
                { id: 'medication', label: 'Medication', shortLabel: 'Meds', icon: Pill },
                { id: 'clinical_orders', label: 'Clinical Orders', shortLabel: 'Clin.', icon: Zap },
                { id: 'lab_rad', label: 'Lab/Rad Reports', shortLabel: 'Lab/Rad', icon: Layers },
                { id: 'progress_notes', label: 'Progress Notes', shortLabel: 'Notes', icon: StickyNote },
                { id: 'orders', label: 'Physician Orders', shortLabel: 'Orders', icon: ClipboardList },
                { id: 'private_note', label: 'Private Note', shortLabel: 'Private', icon: Lock },
              ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as PatientModule)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === item.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={14} className="shrink-0" />
              <span className="uppercase tracking-wider sm:hidden">{item.shortLabel}</span>
              <span className="uppercase tracking-wider hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[320px] sm:min-h-[600px]">{renderModule()}</div>
      </div>

      {showAdmissionNote && (
        <AdmissionNote 
          onClose={() => setShowAdmissionNote(false)} 
          onSave={() => setShowAdmissionNote(false)} 
        />
      )}

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadDocument}
        departments={CLINICAL_DEPARTMENTS}
        defaultDepartment={caseDetails.deptOu}
      />

      <DocumentPDFViewer
        isOpen={!!viewingPDFDoc}
        onClose={() => setViewingPDFDoc(null)}
        document={viewingPDFDoc}
        patient={patient}
        caseDetails={caseDetails}
      />
      
      {showXMLView && selectedXML && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-4 sm:px-8 py-3 sm:py-4 text-white flex justify-between items-center gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-2 bg-indigo-600 rounded-lg shrink-0"><FileSearch size={18} /></div>
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight truncate">Document View: {selectedXML.title}</h3>
              </div>
              <button onClick={() => setShowXMLView(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors shrink-0"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 sm:p-8 md:p-12 bg-white">
              {isSoapXmlContent(selectedXML.content) ||
              selectedXML.title === SOAP_DOCUMENT_DESCRIPTION ||
              selectedXML.title.startsWith('SOAP Note') ? (
                <SOAPDocumentView content={selectedXML.content} />
              ) : isPatientInstructionsXmlContent(selectedXML.content) ||
                selectedXML.title === PATIENT_INSTRUCTIONS_DESCRIPTION ||
                selectedXML.title.startsWith('Patient Instructions') ? (
                <PatientInstructionsView content={selectedXML.content} />
              ) : selectedXML.title === 'GCS Scale' ? (
                <div className="max-w-3xl mx-auto space-y-10 text-slate-800">
                  <div>
                    <h2 className="text-2xl font-bold text-sky-700 mb-8">Glasgow Scale:</h2>
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-sky-700 border-b border-slate-100 pb-2">Scale information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-base">
                        <div className="font-bold">Scale Name</div>
                        <div className="text-sky-600">Glasgow Coma Scale</div>
                        <div className="font-bold">Date</div>
                        <div className="text-sky-600">07.11.2025</div>
                        <div className="font-bold">Time Creation</div>
                        <div className="text-sky-600">08:15:50</div>
                        <div className="font-bold">Realized by</div>
                        <div className="text-sky-600">20000389</div>
                        <div className="font-bold">Realized by (name)</div>
                        <div className="text-sky-600">Doctor91, Doctor</div>
                      </div>
                    </div>

                    <div className="space-y-6 mt-10">
                      <h3 className="text-lg font-bold text-sky-700 border-b border-slate-100 pb-2">Glasgow Coma Scale</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-base">
                        <div className="font-bold">Eye Opening Response (E)</div>
                        <div className="text-sky-600">Spontaneous</div>
                        <div className="font-bold">Verbal Response (V)</div>
                        <div className="text-sky-600">Confused</div>
                        <div className="font-bold">Motor Response (M)</div>
                        <div className="text-sky-600">Follow commands</div>
                      </div>
                    </div>

                    <div className="space-y-6 mt-10">
                      <h3 className="text-lg font-bold text-sky-700 border-b border-slate-100 pb-2">Scale Result</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-base">
                        <div className="font-bold">Total Score</div>
                        <div className="text-sky-600 font-bold">14</div>
                        <div className="font-bold">Total Score Description</div>
                        <div className="text-sky-600">Minor head injury E:4/M:6/V:4</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <pre className="text-sm font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedXML.content}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Electronic Health Record • Clinical Document Architecture</p>
              <button 
                onClick={() => setShowXMLView(false)}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      <SOAPDocumentForm
        isOpen={showSOAPNote}
        onClose={() => {
          setEditingSoapDoc(null);
          setNewVersionSourceDoc(null);
          setShowSOAPNote(false);
        }}
        diagnoses={diagnoses}
        initialData={
          editingSoapDoc || newVersionSourceDoc
            ? parseSoapDocumentXml((editingSoapDoc || newVersionSourceDoc)!.xmlContent)
            : null
        }
        formMode={newVersionSourceDoc ? 'newVersion' : editingSoapDoc ? 'edit' : 'create'}
        versionNumber={
          newVersionSourceDoc
            ? getNextDocumentVersion(documents, newVersionSourceDoc)
            : editingSoapDoc
              ? getSoapDocumentVersion(editingSoapDoc)
              : 1
        }
        onSave={handleSaveSOAP}
      />

      <PatientInstructionsForm
        isOpen={showPatientInstructions}
        onClose={() => {
          setEditingPatientInstructionsDoc(null);
          setNewVersionSourcePatientInstructionsDoc(null);
          setShowPatientInstructions(false);
        }}
        initialData={
          editingPatientInstructionsDoc || newVersionSourcePatientInstructionsDoc
            ? parsePatientInstructionsXml(
                (editingPatientInstructionsDoc || newVersionSourcePatientInstructionsDoc)!.xmlContent,
              )
            : null
        }
        formMode={
          newVersionSourcePatientInstructionsDoc
            ? 'newVersion'
            : editingPatientInstructionsDoc
              ? 'edit'
              : 'create'
        }
        versionNumber={
          newVersionSourcePatientInstructionsDoc
            ? getNextDocumentVersion(documents, newVersionSourcePatientInstructionsDoc)
            : editingPatientInstructionsDoc
              ? getDocumentVersion(editingPatientInstructionsDoc)
              : 1
        }
        onSave={handleSavePatientInstructions}
      />
    </div>
  );
};

/* --- SUMMARY VIEW --- */

interface SummaryViewProps {
  patient: Patient;
  diagnoses: Diagnosis[];
  medications: Medication[];
  orders: Order[];
  caseType?: 'Inpatient' | 'Outpatient';
}

const SUMMARY_PREVIEW_COUNT = 3;

const SummaryView: React.FC<SummaryViewProps> = ({
  patient,
  diagnoses,
  medications,
  orders,
  caseType = 'Outpatient',
}) => {
  const [expanded, setExpanded] = useState({
    diagnoses: false,
    medications: false,
    orders: false,
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyText, setHistoryText] = useState('');

  const toggleExpanded = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const moreToggleClass =
    'w-full text-xs font-medium uppercase tracking-wider text-center mt-2 py-1.5 rounded-lg border border-transparent hover:bg-slate-50 transition-colors';

  const isInpatient = caseType === 'Inpatient';

  const handleGeneratePatientHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryText('');
    try {
      const cases = getPatientCases(patient);
      const episodes = cases.map((caseSummary) => {
        const snapshot = getCaseSnapshot(patient, caseSummary.caseNumber);
        return {
          caseNumber: caseSummary.caseNumber,
          caseType: caseSummary.caseType,
          department: caseSummary.department,
          admissionDate: caseSummary.admissionDate,
          status: caseSummary.status,
          diagnosis: caseSummary.diagnosis,
          physician: caseSummary.physician,
          wardBed: caseSummary.wardBed,
          diagnoses: snapshot.diagnoses.map((d) => ({
            code: d.code,
            description: d.description,
            status: d.status,
          })),
          medications: snapshot.medications.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            status: m.status,
          })),
          documents: snapshot.documents.map((d) => ({
            description: d.description,
            status: d.status,
            date: d.date,
          })),
        };
      });
      const narrative = await generatePatientHistorySummary(patient.name, episodes);
      setHistoryText(narrative);
    } catch {
      setHistoryText('Unable to generate patient history summary. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <ModulePageHeader
        title="Summary"
        subtitle={
          isInpatient
            ? 'Inpatient clinical overview — ward status, orders, and active therapy'
            : 'Outpatient visit overview — diagnoses, meds, and visit plan'
        }
        actions={
          <button
            type="button"
            onClick={handleGeneratePatientHistory}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-[9px] font-semibold uppercase tracking-widest text-indigo-700 transition-all hover:bg-indigo-100"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Patient History</span>
            <span className="sm:hidden">History</span>
          </button>
        }
      />

      {historyOpen && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-3 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                <History size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-widest">AI Patient History</h4>
                <p className="text-[10px] text-slate-500 font-medium">Synthesized from prior and current case episodes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors shrink-0"
              aria-label="Close history"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            {historyLoading ? (
              <div className="flex items-center gap-3 text-slate-500 py-8 justify-center">
                <Loader2 size={20} className="animate-spin text-indigo-600" />
                <span className="text-xs font-semibold uppercase tracking-widest">Reading case episodes...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  AI draft for physician review — verify against the full chart before clinical decisions.
                </p>
                <pre className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {historyText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Diagnoses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Stethoscope size={18} /></div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Diagnoses</h4>
          </div>
          <div className="space-y-2">
            {diagnoses.length > 0 ? (expanded.diagnoses ? diagnoses : diagnoses.slice(0, SUMMARY_PREVIEW_COUNT)).map((d) => (
              <div key={d.id} className="flex items-center justify-between text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-700">{d.code}</span>
                <span className="text-slate-600 truncate ml-2 flex-1">{d.description}</span>
              </div>
            )) : <p className="text-xs font-medium text-slate-400 italic">No active diagnoses</p>}
            {diagnoses.length > SUMMARY_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => toggleExpanded('diagnoses')}
                className={`${moreToggleClass} text-blue-600`}
              >
                {expanded.diagnoses ? 'Show less' : `+${diagnoses.length - SUMMARY_PREVIEW_COUNT} More`}
              </button>
            )}
          </div>
        </div>

        {/* Active Medications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Pill size={18} /></div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Medications</h4>
          </div>
          <div className="space-y-2">
            {medications.length > 0 ? (expanded.medications ? medications : medications.slice(0, SUMMARY_PREVIEW_COUNT)).map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-700">{m.name}</span>
                <span className="text-slate-600 sm:ml-2">{m.dosage} - {m.frequency}</span>
              </div>
            )) : <p className="text-xs font-medium text-slate-400 italic">No active medications</p>}
            {medications.length > SUMMARY_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => toggleExpanded('medications')}
                className={`${moreToggleClass} text-emerald-600`}
              >
                {expanded.medications ? 'Show less' : `+${medications.length - SUMMARY_PREVIEW_COUNT} More`}
              </button>
            )}
          </div>
        </div>

        {/* Physician Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ClipboardList size={18} /></div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Physician Orders</h4>
          </div>
          <div className="space-y-2">
            {orders.length > 0 ? (expanded.orders ? orders : orders.slice(0, SUMMARY_PREVIEW_COUNT)).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-700 truncate flex-1">{o.description}</span>
                <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider ${
                  o.status === 'Executed' ? 'bg-emerald-500 text-white' : 
                  o.status === 'Signed' ? 'bg-blue-500 text-white' : 
                  'bg-orange-500 text-white'
                }`}>{o.status}</span>
              </div>
            )) : <p className="text-xs font-medium text-slate-400 italic">No pending orders</p>}
            {orders.length > SUMMARY_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => toggleExpanded('orders')}
                className={`${moreToggleClass} text-orange-600`}
              >
                {expanded.orders ? 'Show less' : `+${orders.length - SUMMARY_PREVIEW_COUNT} More`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


/* --- DOCUMENTS MODULE --- */

type DocumentActionVariant = 'neutral' | 'primary' | 'warning' | 'success';

const documentActionClass: Record<DocumentActionVariant, string> = {
  neutral:
    'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800',
  primary:
    'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-500 hover:text-white',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white',
};

const DocumentActionButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  variant: DocumentActionVariant;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}> = ({ label, icon, variant, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-8 min-w-[88px] items-center justify-center gap-1.5 rounded-lg border px-3 text-[9px] font-semibold uppercase tracking-widest transition-all ${documentActionClass[variant]}`}
  >
    {icon}
    {label}
  </button>
);

const renderDocumentActions = (
  doc: ClinicalDocument,
  allDocuments: ClinicalDocument[],
  readOnly: boolean | undefined,
  onEditDocument: (doc: ClinicalDocument) => void,
  onNewDocumentVersion: (doc: ClinicalDocument) => void,
  onSignDocument: (doc: ClinicalDocument) => void,
  onViewPDF: (doc: ClinicalDocument) => void,
  onViewXML: (doc: ClinicalDocument) => void,
) => {
  const isStructured = isSoapDocument(doc) || isPatientInstructionsDocument(doc);
  const canEdit = isStructured && doc.status !== 'Signed' && !readOnly;
  const canCreateNewVersion =
    isStructured &&
    doc.status === 'Signed' &&
    !readOnly &&
    isLatestVersionedDocument(doc, allDocuments);
  const canSign = isStructured && doc.status === 'Reviewed' && !readOnly;
  const opensPdf = doc.hasPDF || isStructured;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {canEdit && (
        <DocumentActionButton
          label="Edit"
          icon={<Pencil size={12} />}
          variant="warning"
          onClick={(e) => {
            e.stopPropagation();
            onEditDocument(doc);
          }}
        />
      )}
      {canCreateNewVersion && (
        <DocumentActionButton
          label="New Version"
          icon={<GitBranch size={12} />}
          variant="warning"
          onClick={(e) => {
            e.stopPropagation();
            onNewDocumentVersion(doc);
          }}
        />
      )}
      {canSign && (
        <DocumentActionButton
          label="Sign"
          icon={<ShieldCheck size={12} />}
          variant="success"
          onClick={(e) => {
            e.stopPropagation();
            onSignDocument(doc);
          }}
        />
      )}
      <DocumentActionButton
        label={opensPdf ? 'View PDF' : 'XML View'}
        icon={<Eye size={12} />}
        variant="primary"
        onClick={(e) => {
          e.stopPropagation();
          if (opensPdf) onViewPDF(doc);
          else onViewXML(doc);
        }}
      />
    </div>
  );
};

const DocumentStatusBadge: React.FC<{ status: ClinicalDocument['status'] }> = ({ status }) => (
  <span
    className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
      status === 'Signed'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : status === 'Reviewed'
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
    }`}
  >
    {status}
  </span>
);

const DocumentsModule = ({
  documents,
  onViewPDF,
  onViewXML,
  onUpload,
  onCreateSOAP,
  onCreatePatientInstructions,
  onEditDocument,
  onNewDocumentVersion,
  onSignDocument,
  readOnly,
  caseType = 'Outpatient',
}: {
  documents: ClinicalDocument[];
  onViewPDF: (doc: ClinicalDocument) => void;
  onViewXML: (doc: ClinicalDocument) => void;
  onUpload: () => void;
  onCreateSOAP: () => void;
  onCreatePatientInstructions: () => void;
  onEditDocument: (doc: ClinicalDocument) => void;
  onNewDocumentVersion: (doc: ClinicalDocument) => void;
  onSignDocument: (doc: ClinicalDocument) => void;
  readOnly?: boolean;
  caseType?: 'Inpatient' | 'Outpatient';
}) => {
  const isInpatientCase = caseType === 'Inpatient';
  const [expandedVersionedGroups, setExpandedVersionedGroups] = useState<Set<string>>(new Set());
  const displayItems = useMemo(() => organizeDocumentsForDisplay(documents), [documents]);

  const versionedGroupKey = (kind: string, groupId: string) => `${kind}::${groupId}`;

  const toggleVersionedGroup = (kind: string, groupId: string) => {
    const key = versionedGroupKey(kind, groupId);
    setExpandedVersionedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderVersionHistoryToggle = (kind: string, groupId: string, count: number) => {
    if (count === 0) return null;
    const key = versionedGroupKey(kind, groupId);
    const expanded = expandedVersionedGroups.has(key);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleVersionedGroup(kind, groupId);
        }}
        className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors mt-2"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {expanded
          ? 'Hide previous versions'
          : `Show ${count} previous version${count === 1 ? '' : 's'}`}
      </button>
    );
  };

  const documentOpensPdf = (doc: ClinicalDocument) =>
    doc.hasPDF || isSoapDocument(doc) || isPatientInstructionsDocument(doc);

  const renderMobileDoc = (doc: ClinicalDocument, isHistorical = false) => {
    const opensPdf = documentOpensPdf(doc);
    return (
      <div
        key={doc.id}
        className={`p-4 space-y-3 cursor-pointer active:bg-slate-50 ${isHistorical ? 'bg-slate-50/80 border-l-2 border-slate-200 ml-3' : ''}`}
        onClick={() => (opensPdf ? onViewPDF(doc) : onViewXML(doc))}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className={`text-sm font-semibold tracking-tight ${isHistorical ? 'text-slate-600' : 'text-slate-800'}`}>
                {doc.description}
              </div>
              {isHistorical && (
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  v{getDocumentVersion(doc)}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              <span>{doc.date} · {doc.time}</span>
              <span>{doc.department}</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-500">{doc.responsible}</div>
          </div>
          <DocumentStatusBadge status={doc.status} />
        </div>
        {renderDocumentActions(doc, documents, readOnly, onEditDocument, onNewDocumentVersion, onSignDocument, onViewPDF, onViewXML)}
      </div>
    );
  };

  const renderDesktopRow = (doc: ClinicalDocument, isHistorical = false) => {
    const opensPdf = documentOpensPdf(doc);
    return (
      <tr
        key={doc.id}
        className={`group cursor-pointer transition-colors hover:bg-slate-50/80 ${isHistorical ? 'bg-slate-50/60' : ''}`}
        onClick={() => (opensPdf ? onViewPDF(doc) : onViewXML(doc))}
      >
        <td className={`px-5 py-3.5 text-[11px] font-medium tabular-nums ${isHistorical ? 'text-slate-500 pl-8' : 'text-slate-600'}`}>
          {doc.date}
        </td>
        <td className={`px-5 py-3.5 text-[11px] font-medium tabular-nums ${isHistorical ? 'text-slate-500' : 'text-slate-600'}`}>
          {doc.time}
        </td>
        <td className={`px-5 py-3.5 text-[11px] font-medium ${isHistorical ? 'text-slate-500' : 'text-slate-700'}`}>
          {doc.department}
        </td>
        <td className="px-5 py-3.5">
          <DocumentStatusBadge status={doc.status} />
        </td>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className={`text-sm font-semibold tracking-tight ${isHistorical ? 'text-slate-600' : 'text-slate-800'}`}>
              {doc.description}
            </div>
            {isHistorical && (
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                v{getDocumentVersion(doc)}
              </span>
            )}
          </div>
        </td>
        <td className={`px-5 py-3.5 text-[11px] font-medium ${isHistorical ? 'text-slate-500' : 'text-slate-600'}`}>
          {doc.responsible}
        </td>
        <td className="px-5 py-3.5">
          <div className="flex items-center justify-end gap-1.5">
            {renderDocumentActions(doc, documents, readOnly, onEditDocument, onNewDocumentVersion, onSignDocument, onViewPDF, onViewXML)}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
    <ModulePageHeader
      title="Clinical Documents"
      subtitle={
        isInpatientCase
          ? 'Admission, progress, and discharge documentation'
          : 'Visit notes, SOAP documents, and patient instructions'
      }
        actions={
          !readOnly ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {isInpatientCase ? (
                <>
                  <button
                    type="button"
                    onClick={onCreateSOAP}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-slate-900"
                  >
                    <FilePlus size={13} />
                    <span className="hidden sm:inline">Create SOAP Document</span>
                    <span className="sm:hidden">SOAP Doc</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCreatePatientInstructions}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 text-[9px] font-semibold uppercase tracking-widest text-teal-700 transition-all hover:bg-teal-100"
                  >
                    <ClipboardList size={13} />
                    <span className="hidden sm:inline">Patient Instructions</span>
                    <span className="sm:hidden">Instructions</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onCreatePatientInstructions}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-[9px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-teal-700"
                  >
                    <ClipboardList size={13} />
                    <span className="hidden sm:inline">Patient Instructions</span>
                    <span className="sm:hidden">Instructions</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCreateSOAP}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-semibold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50"
                  >
                    <FilePlus size={13} />
                    <span className="hidden sm:inline">Create SOAP Document</span>
                    <span className="sm:hidden">SOAP Doc</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onUpload}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-semibold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50"
              >
                <Upload size={13} />
                Upload
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="md:hidden divide-y divide-slate-100">
          {displayItems.map((item) => {
            if (item.type === 'document') {
              return renderMobileDoc(item.doc);
            }

            const groupKey = versionedGroupKey(item.kind, item.groupId);
            const expanded = expandedVersionedGroups.has(groupKey);
            return (
              <div key={groupKey}>
                <div className="divide-y divide-slate-100">
                  {renderMobileDoc(item.latest)}
                  <div className="px-4 pb-3">
                    {renderVersionHistoryToggle(item.kind, item.groupId, item.previousVersions.length)}
                  </div>
                  {expanded && item.previousVersions.map((doc) => renderMobileDoc(doc, true))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsible</th>
                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayItems.map((item) => {
                if (item.type === 'document') {
                  return renderDesktopRow(item.doc);
                }

                const groupKey = versionedGroupKey(item.kind, item.groupId);
                const expanded = expandedVersionedGroups.has(groupKey);
                return (
                  <React.Fragment key={groupKey}>
                    {renderDesktopRow(item.latest)}
                    <tr className="bg-white">
                      <td colSpan={7} className="px-5 py-2 border-b border-slate-100">
                        {renderVersionHistoryToggle(item.kind, item.groupId, item.previousVersions.length)}
                      </td>
                    </tr>
                    {expanded && item.previousVersions.map((doc) => renderDesktopRow(doc, true))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientData;

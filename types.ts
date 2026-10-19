
export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  allergies: string[];
  riskFactors: string[];
  lastVisit: string;
  caseNumber?: string;
  age?: number;
  insurance?: string;
  patientClass?: string;
  lifestyleHabits?: {
    smoking: string;
    alcohol: string;
    exercise: string;
    diet: string;
  };
  vaccinations?: {
    name: string;
    date: string;
    status: string;
  }[];
  obgynHistory?: {
    gravida: string;
    para: string;
    lastMenstrualPeriod: string;
  };
}

export interface Surgery {
  id: string;
  patientId: string;
  patientName: string;
  procedure: string;
  date: string;
  time: string;
  surgeon: string;
  room: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  education: string;
  experience: number;
  clinicalPractice: string;
  avatar: string;
}

export interface Encounter {
  caseNumber: string;
  caseType: 'Inpatient' | 'Outpatient';
  department: string;
  date: string;
  reason: string;
  physician: string;
  diagnosis: string;
  medications: string[];
  labOrders: string[];
  vitals: {
    bp: string;
    hr: string;
    temp: string;
  };
  documents: string[];
}

export interface InpatientCase {
  id: string;
  patientId: string;
  patientName: string;
  room: string;
  nursingUnit: string;
  department: string;
  diagnosis: string;
  admissionDate: string;
}

export interface Diagnosis {
  id: string;
  code: string;
  description: string;
  date: string;
  status: string;
  type?: 'Admitting' | 'Discharge' | 'Pre-Operative' | 'Post-Operative';
  markers?: ('Confirmed' | 'Chronic' | 'Secondary')[];
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  validityDate?: string;
  responsibleEmployee?: string;
  status: 'Active' | 'Discontinued' | 'Completed' | 'Signed';
}

export type OccupationalGroupCode = 'DOCT' | 'NURS' | 'OTHE' | 'PHYS' | 'PHAR' | 'TRIA' | 'TECH' | 'THER' | 'ITST' | 'DIET' | 'PSYC' | 'SPTH' | 'RTTH' | 'SOWR';

export interface ClinicalDocument {
  id: string;
  date: string;
  time: string;
  department: string;
  status: 'Signed' | 'Reviewed' | 'Draft' | 'Pending';
  description: string;
  responsible: string;
  hasPDF: boolean;
  xmlContent: string;
  pdfUrl?: string;
  fileName?: string;
  isUploaded?: boolean;
  version?: number;
  documentGroupId?: string;
  soapDocumentGroupId?: string;
}

export interface ProgressNoteEntry {
  id: string;
  text: string;
  timestamp: string;
  user: string;
  groupCode: OccupationalGroupCode;
  groupLabel: string;
  ou: string;
}

export interface Order {
  id: string;
  type: string;
  description: string;
  assignedTo: string;
  status: 'Saved' | 'Signed' | 'Executed' | 'Cancelled';
  timestamp: string;
}

export interface Point {
  x: number;
  y: number;
  label: string;
  notes?: string;
  view: 'front' | 'back';
  id: string;
  status?: 'Normal' | 'Abnormal';
}

export interface ClinicalOrderItem {
  code: string;
  description: string;
  category: string;
  performingOu: string;
}

export interface ClinicalOrder {
  id: string;
  type: 'Laboratory' | 'Radiology' | 'Admission';
  items: ClinicalOrderItem[];
  priority: 'Routine' | 'Urgent' | 'Late Elective' | 'Critical/Saving' | 'Normal';
  status: 'Confirmed' | 'Saved' | 'Signed' | 'Executed' | 'Cancelled' | 'Requested';
  timestamp: string;
  admissionDetails?: {
    reason: string;
    ward: string;
    notes: string;
    templateId?: string;
  };
}

export interface CalendarAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  caseNumber: string;
  time: string;
  date: string;
  type: string;
  status: string;
}

export interface AgendaTimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface PatientCaseDetails {
  caseNumber: string;
  admissionDate: string;
  deptOu: string;
  attendingPhysician: string;
  wardBed: string;
}

export interface PatientCaseSummary {
  caseNumber: string;
  caseType: 'Inpatient' | 'Outpatient';
  department: string;
  admissionDate: string;
  status: 'Active' | 'Closed';
  diagnosis: string;
  physician: string;
  wardBed: string;
}

export interface CaseClinicalSnapshot {
  isActive: boolean;
  caseDetails: PatientCaseDetails;
  diagnoses: Diagnosis[];
  medications: Medication[];
  orders: Order[];
  clinicalOrders: ClinicalOrder[];
  points: Point[];
  documents: ClinicalDocument[];
}

export enum ViewType {
  DASHBOARD = 'dashboard',
  AGENDA = 'agenda',
  MY_PATIENTS = 'my_patients',
  DOCTORS = 'doctors',
  PROFILE = 'profile',
  PATIENT_DATA = 'patient_data'
}

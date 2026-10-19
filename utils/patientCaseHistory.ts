import { MOCK_ENCOUNTERS, MOCK_INPATIENT_LIST } from '../constants';
import { PATIENT_CASE_SNAPSHOTS } from '../constants/patientCaseSnapshots';
import {
  CaseClinicalSnapshot,
  ClinicalDocument,
  ClinicalOrder,
  Diagnosis,
  Medication,
  Order,
  Patient,
  PatientCaseSummary,
  Point,
} from '../types';

const snapshotKey = (patientId: string, caseNumber: string) => `${patientId}__${caseNumber}`;

const buildSummaryFromInpatient = (inpatient: (typeof MOCK_INPATIENT_LIST)[number]): PatientCaseSummary => ({
  caseNumber: inpatient.id,
  caseType: 'Inpatient',
  department: inpatient.department,
  admissionDate: inpatient.admissionDate,
  status: 'Closed',
  diagnosis: inpatient.diagnosis,
  physician: 'Dr. Sarah Connor',
  wardBed: `${inpatient.nursingUnit} / ${inpatient.room}`,
});

const buildSummaryFromEncounter = (encounter: (typeof MOCK_ENCOUNTERS)[string][number]): PatientCaseSummary => ({
  caseNumber: encounter.caseNumber,
  caseType: encounter.caseType,
  department: encounter.department,
  admissionDate: encounter.date,
  status: 'Closed',
  diagnosis: encounter.diagnosis,
  physician: encounter.physician,
  wardBed: encounter.caseType === 'Inpatient' ? 'Historical Ward' : 'Outpatient Clinic',
});

const buildSyntheticHistoricalCase = (patient: Patient): PatientCaseSummary => {
  const activeNum = parseInt(patient.caseNumber || '2000000000', 10);
  const historicalNum = Number.isNaN(activeNum) ? '1999999999' : String(activeNum - 1);

  return {
    caseNumber: historicalNum,
    caseType: 'Outpatient',
    department: 'Internal Medicine',
    admissionDate: '2023-06-15',
    status: 'Closed',
    diagnosis: 'Routine follow-up — resolved',
    physician: 'Dr. Grace Hopper',
    wardBed: 'Outpatient',
  };
};

export const getPatientCases = (patient: Patient): PatientCaseSummary[] => {
  const caseMap = new Map<string, PatientCaseSummary>();

  const markActive = (caseNumber: string) => {
    const existing = caseMap.get(caseNumber);
    if (existing) {
      caseMap.set(caseNumber, { ...existing, status: 'Active' });
    }
  };

  Object.keys(PATIENT_CASE_SNAPSHOTS).forEach((key) => {
    if (!key.startsWith(`${patient.id}__`)) return;
    const caseNumber = key.split('__')[1];
    const snapshot = PATIENT_CASE_SNAPSHOTS[key];
    caseMap.set(caseNumber, {
      caseNumber,
      caseType: snapshot.caseDetails.wardBed === 'Outpatient' ? 'Outpatient' : 'Inpatient',
      department: snapshot.caseDetails.deptOu,
      admissionDate: snapshot.caseDetails.admissionDate,
      status: snapshot.isActive ? 'Active' : 'Closed',
      diagnosis: snapshot.diagnoses[0]?.description || 'Clinical case',
      physician: snapshot.caseDetails.attendingPhysician,
      wardBed: snapshot.caseDetails.wardBed,
    });
  });

  MOCK_INPATIENT_LIST.filter((ip) => ip.patientId === patient.id).forEach((inpatient) => {
    const existing = caseMap.get(inpatient.id);
    const summary = buildSummaryFromInpatient(inpatient);
    caseMap.set(inpatient.id, {
      ...summary,
      status: existing?.status === 'Active' ? 'Active' : summary.status,
    });
  });

  (MOCK_ENCOUNTERS[patient.id] || []).forEach((encounter) => {
    if (!caseMap.has(encounter.caseNumber)) {
      caseMap.set(encounter.caseNumber, buildSummaryFromEncounter(encounter));
    }
  });

  if (patient.caseNumber && !caseMap.has(patient.caseNumber)) {
    caseMap.set(patient.caseNumber, {
      caseNumber: patient.caseNumber,
      caseType: 'Outpatient',
      department: 'Cardiology',
      admissionDate: patient.lastVisit || '2024-01-01',
      status: 'Active',
      diagnosis: 'Active clinical case',
      physician: 'Dr. Sarah Connor',
      wardBed: 'Outpatient',
    });
  }

  if (patient.caseNumber) {
    markActive(patient.caseNumber);
  }

  const inpatient = MOCK_INPATIENT_LIST.find((ip) => ip.patientId === patient.id);
  if (inpatient) {
    markActive(inpatient.id);
  }

  let cases = Array.from(caseMap.values());

  if (cases.length < 2 && patient.caseNumber) {
    const synthetic = buildSyntheticHistoricalCase(patient);
    if (!caseMap.has(synthetic.caseNumber)) {
      cases = [...cases, synthetic];
    }
  }

  return cases.sort((a, b) => {
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (b.status === 'Active' && a.status !== 'Active') return 1;
    return b.admissionDate.localeCompare(a.admissionDate);
  });
};

export const getDefaultCaseNumber = (patient: Patient): string => {
  const cases = getPatientCases(patient);
  if (patient.caseNumber) {
    const primary = cases.find((c) => c.caseNumber === patient.caseNumber);
    if (primary?.status === 'Active') return patient.caseNumber;
  }
  return cases.find((c) => c.status === 'Active')?.caseNumber || cases[0]?.caseNumber || patient.caseNumber || 'N/A';
};

const buildFallbackSnapshot = (
  patient: Patient,
  caseSummary: PatientCaseSummary,
): CaseClinicalSnapshot => ({
  isActive: caseSummary.status === 'Active',
  caseDetails: {
    caseNumber: caseSummary.caseNumber,
    admissionDate: caseSummary.admissionDate,
    deptOu: caseSummary.department,
    attendingPhysician: caseSummary.physician,
    wardBed: caseSummary.wardBed,
  },
  diagnoses: [
    {
      id: 'hist-1',
      code: 'Z09',
      description: caseSummary.diagnosis,
      date: caseSummary.admissionDate,
      status: caseSummary.status === 'Active' ? 'Active' : 'Resolved',
      type: 'Discharge',
      markers: [],
    },
  ],
  medications: [],
  orders: [],
  clinicalOrders: [],
  points: [],
  documents: [
    {
      id: `doc-${caseSummary.caseNumber}`,
      date: caseSummary.admissionDate.split('-').reverse().join('.'),
      time: '09:00',
      department: caseSummary.department,
      status: 'Signed',
      description: 'Admission Note',
      responsible: caseSummary.physician,
      hasPDF: true,
      xmlContent: '',
    },
  ] as ClinicalDocument[],
});

export const getCaseSnapshot = (patient: Patient, caseNumber: string): CaseClinicalSnapshot => {
  const stored = PATIENT_CASE_SNAPSHOTS[snapshotKey(patient.id, caseNumber)];
  if (stored) return stored;

  const caseSummary = getPatientCases(patient).find((c) => c.caseNumber === caseNumber);
  if (caseSummary) {
    return buildFallbackSnapshot(patient, caseSummary);
  }

  return buildFallbackSnapshot(patient, {
    caseNumber,
    caseType: 'Outpatient',
    department: 'Cardiology',
    admissionDate: patient.lastVisit || '2024-01-01',
    status: 'Closed',
    diagnosis: 'Historical case',
    physician: 'Dr. Sarah Connor',
    wardBed: 'Outpatient',
  });
};

export const applyCaseSnapshot = (
  snapshot: CaseClinicalSnapshot,
  setters: {
    setDiagnoses: (value: Diagnosis[]) => void;
    setMedications: (value: Medication[]) => void;
    setOrders: (value: Order[]) => void;
    setClinicalOrders: (value: ClinicalOrder[]) => void;
    setPoints: (value: Point[]) => void;
    setDocuments: (value: ClinicalDocument[]) => void;
  },
) => {
  setters.setDiagnoses(snapshot.diagnoses);
  setters.setMedications(snapshot.medications);
  setters.setOrders(snapshot.orders);
  setters.setClinicalOrders(snapshot.clinicalOrders);
  setters.setPoints(snapshot.points);
  setters.setDocuments(snapshot.documents);
};

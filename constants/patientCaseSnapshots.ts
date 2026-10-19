import { SOAP_DOCUMENT_DESCRIPTION } from '../utils/soapDocumentXml';
import { CaseClinicalSnapshot } from '../types';

export const PATIENT_CASE_SNAPSHOTS: Record<string, CaseClinicalSnapshot> = {
  'MRN-1001__2000000001': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000001',
      admissionDate: '2024-03-12',
      deptOu: 'Cardiology',
      attendingPhysician: 'Dr. Sarah Connor',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: '1', code: 'I10', description: 'Essential (primary) hypertension', date: '2023-10-15', status: 'Active', type: 'Admitting', markers: ['Chronic'] },
      { id: '2', code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', date: '2023-10-15', status: 'Active', type: 'Admitting', markers: ['Confirmed'] },
    ],
    medications: [
      {
        id: '1',
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once Daily',
        route: 'Oral',
        startDate: '2023-05-12',
        validityDate: '2026-12-31T23:59',
        responsibleEmployee: 'Dr. Sarah Connor',
        status: 'Signed',
      },
      {
        id: '2',
        name: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        dosage: '500mg',
        frequency: 'Twice Daily',
        route: 'Oral',
        startDate: '2023-08-20',
        validityDate: '2024-01-01T00:00',
        responsibleEmployee: 'Dr. Sarah Connor',
        status: 'Signed',
      },
    ],
    orders: [
      { id: '1', type: 'Nursing', description: 'Monitor vitals every 4 hours', assignedTo: 'Nurse', status: 'Saved', timestamp: '2024-03-12 09:00' },
      { id: '2', type: 'Physiotherapy', description: 'Chest PT twice daily', assignedTo: 'Physiotherapist', status: 'Signed', timestamp: '2024-03-12 10:30' },
    ],
    clinicalOrders: [
      {
        id: 'c1',
        type: 'Laboratory',
        items: [{ code: '80048', description: 'Basic Metabolic Panel', category: 'Biology', performingOu: 'Main Lab' }],
        priority: 'Routine',
        status: 'Signed',
        timestamp: '2024-03-12 11:00',
      },
      {
        id: 'c2',
        type: 'Radiology',
        items: [{ code: '70551', description: 'MRI Brain without contrast', category: 'MRI', performingOu: 'Radiology Dept A' }],
        priority: 'Urgent',
        status: 'Saved',
        timestamp: '2024-03-12 11:30',
      },
    ],
    points: [],
    documents: [
      {
        id: '1',
        date: '07.11.2024',
        time: '08:30',
        department: 'Cardiology',
        status: 'Signed',
        description: 'Admission Note',
        responsible: 'Dr. Sarah Connor',
        hasPDF: true,
        xmlContent: '',
      },
      {
        id: '2',
        date: '28.01.2026',
        time: '09:15',
        department: 'Cardiology',
        status: 'Reviewed',
        description: SOAP_DOCUMENT_DESCRIPTION,
        responsible: 'Dr. Sarah Connor',
        hasPDF: true,
        xmlContent: '',
      },
    ],
  },
  'MRN-1001__2000000003': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000003',
      admissionDate: '2024-03-12',
      deptOu: 'Surgery',
      attendingPhysician: 'Dr. Elena Rodriguez',
      wardBed: 'General Surgical Ward / 302-A',
    },
    diagnoses: [
      { id: 'h1', code: 'K81.0', description: 'Acute Cholecystitis', date: '2024-03-12', status: 'Active', type: 'Admitting', markers: ['Confirmed'] },
      { id: 'h2', code: 'I10', description: 'Secondary Hypertension', date: '2024-03-13', status: 'Active', type: 'Secondary', markers: [] },
    ],
    medications: [
      {
        id: 'h-m1',
        name: 'Cefazolin',
        genericName: 'Cefazolin',
        dosage: '2g IV',
        frequency: 'Every 8 hours',
        route: 'IV',
        startDate: '2024-03-12',
        validityDate: '2024-03-20T23:59',
        responsibleEmployee: 'Dr. Elena Rodriguez',
        status: 'Signed',
      },
      {
        id: 'h-m2',
        name: 'Morphine',
        genericName: 'Morphine Sulfate',
        dosage: '2mg',
        frequency: 'PRN',
        route: 'IV',
        startDate: '2024-03-13',
        validityDate: '2024-03-18T23:59',
        responsibleEmployee: 'Dr. Elena Rodriguez',
        status: 'Signed',
      },
    ],
    orders: [
      { id: 'h-o1', type: 'Nursing', description: 'NPO until cleared by surgery', assignedTo: 'Nurse', status: 'Signed', timestamp: '2024-03-12 07:00' },
      { id: 'h-o2', type: 'Nursing', description: 'Post-op wound care', assignedTo: 'Nurse', status: 'Saved', timestamp: '2024-03-13 14:00' },
    ],
    clinicalOrders: [
      {
        id: 'h-c1',
        type: 'Laboratory',
        items: [{ code: '80076', description: 'Liver Function Tests', category: 'Biology', performingOu: 'Main Lab' }],
        priority: 'Urgent',
        status: 'Executed',
        timestamp: '2024-03-12 08:30',
      },
    ],
    points: [],
    documents: [
      {
        id: 'h-d1',
        date: '12.03.2024',
        time: '08:15',
        department: 'Surgery',
        status: 'Signed',
        description: 'Admission Note',
        responsible: 'Dr. Sarah Connor',
        hasPDF: true,
        xmlContent: '',
      },
      {
        id: 'h-d2',
        date: '15.03.2024',
        time: '10:00',
        department: 'Surgery',
        status: 'Signed',
        description: 'Discharge Summary',
        responsible: 'Dr. Sarah Connor',
        hasPDF: true,
        xmlContent: '',
      },
    ],
  },
  'MRN-1002__2000000002': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000002',
      admissionDate: '2024-03-11',
      deptOu: 'Obstetrics',
      attendingPhysician: 'Dr. Sophie Taylor',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'f1', code: 'O24.4', description: 'Gestational diabetes mellitus', date: '2024-02-01', status: 'Active', type: 'Admitting', markers: ['Chronic'] },
    ],
    medications: [
      {
        id: 'f-m1',
        name: 'Prenatal Vitamins',
        genericName: 'Multivitamin',
        dosage: '1 tablet',
        frequency: 'Once Daily',
        route: 'Oral',
        startDate: '2024-01-15',
        validityDate: '2024-12-31T23:59',
        responsibleEmployee: 'Dr. Sophie Taylor',
        status: 'Signed',
      },
    ],
    orders: [],
    clinicalOrders: [
      {
        id: 'f-c1',
        type: 'Laboratory',
        items: [{ code: '83036', description: 'HbA1c', category: 'Biology', performingOu: 'Main Lab' }],
        priority: 'Routine',
        status: 'Signed',
        timestamp: '2024-03-11 09:00',
      },
    ],
    points: [],
    documents: [
      {
        id: 'f-d1',
        date: '11.03.2024',
        time: '09:30',
        department: 'Obstetrics',
        status: 'Signed',
        description: 'Antenatal Visit Note',
        responsible: 'Dr. Sophie Taylor',
        hasPDF: true,
        xmlContent: '',
      },
    ],
  },
  'MRN-1002__2000000004': {
    isActive: false,
    caseDetails: {
      caseNumber: '2000000004',
      admissionDate: '2023-11-20',
      deptOu: 'Cardiology',
      attendingPhysician: 'Dr. Sarah Connor',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'f-h1', code: 'I20.9', description: 'Stable Angina', date: '2023-11-20', status: 'Resolved', type: 'Discharge', markers: [] },
    ],
    medications: [
      {
        id: 'f-hm1',
        name: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        dosage: '81mg',
        frequency: 'Once Daily',
        route: 'Oral',
        startDate: '2023-11-20',
        validityDate: '2024-03-01T00:00',
        responsibleEmployee: 'Dr. Sarah Connor',
        status: 'Signed',
      },
    ],
    orders: [],
    clinicalOrders: [
      {
        id: 'f-hc1',
        type: 'Laboratory',
        items: [{ code: '93000', description: 'ECG', category: 'Cardiology', performingOu: 'Cardiology Clinic' }],
        priority: 'Routine',
        status: 'Executed',
        timestamp: '2023-11-20 10:00',
      },
    ],
    points: [],
    documents: [
      {
        id: 'f-hd1',
        date: '20.11.2023',
        time: '10:15',
        department: 'Cardiology',
        status: 'Signed',
        description: 'Outpatient Consultation',
        responsible: 'Dr. Sarah Connor',
        hasPDF: true,
        xmlContent: '',
      },
    ],
  },
  'MRN-5001__2000000003': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000003',
      admissionDate: '2024-03-01',
      deptOu: 'Internal Medicine',
      attendingPhysician: 'Dr. Grace Hopper',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'j1', code: 'I10', description: 'Essential hypertension', date: '2024-03-01', status: 'Active', type: 'Admitting', markers: ['Chronic'] },
      { id: 'j2', code: 'E78.5', description: 'Hyperlipidemia, unspecified', date: '2024-03-01', status: 'Active', type: 'Secondary', markers: [] },
    ],
    medications: [
      { id: 'j-m1', name: 'Amlodipine', genericName: 'Amlodipine', dosage: '5mg', frequency: 'Once Daily', route: 'Oral', startDate: '2024-03-01', validityDate: '2025-12-31T23:59', responsibleEmployee: 'Dr. Grace Hopper', status: 'Signed' },
      { id: 'j-m2', name: 'Atorvastatin', genericName: 'Atorvastatin', dosage: '20mg', frequency: 'Once Daily', route: 'Oral', startDate: '2024-03-01', validityDate: '2025-12-31T23:59', responsibleEmployee: 'Dr. Grace Hopper', status: 'Signed' },
    ],
    orders: [
      { id: 'j-o1', type: 'Nursing', description: 'Blood pressure monitoring twice daily', assignedTo: 'Nurse', status: 'Signed', timestamp: '2024-03-01 09:00' },
    ],
    clinicalOrders: [
      { id: 'j-c1', type: 'Laboratory', items: [{ code: '80061', description: 'Lipid Panel', category: 'Biology', performingOu: 'Main Lab' }], priority: 'Routine', status: 'Signed', timestamp: '2024-03-01 10:00' },
    ],
    points: [],
    documents: [
      { id: 'j-d1', date: '01.03.2024', time: '09:30', department: 'Internal Medicine', status: 'Signed', description: 'Initial Consultation', responsible: 'Dr. Grace Hopper', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-5001__2000000002': {
    isActive: false,
    caseDetails: {
      caseNumber: '2000000002',
      admissionDate: '2023-09-14',
      deptOu: 'Emergency Medicine',
      attendingPhysician: 'Dr. Robert Brown',
      wardBed: 'Emergency / Bay 4',
    },
    diagnoses: [
      { id: 'j-h1', code: 'J06.9', description: 'Acute upper respiratory infection', date: '2023-09-14', status: 'Resolved', type: 'Discharge', markers: [] },
    ],
    medications: [
      { id: 'j-hm1', name: 'Ibuprofen', genericName: 'Ibuprofen', dosage: '400mg', frequency: 'PRN', route: 'Oral', startDate: '2023-09-14', validityDate: '2023-09-21T23:59', responsibleEmployee: 'Dr. Robert Brown', status: 'Signed' },
    ],
    orders: [],
    clinicalOrders: [
      { id: 'j-hc1', type: 'Laboratory', items: [{ code: '85025', description: 'CBC with Differential', category: 'Biology', performingOu: 'Main Lab' }], priority: 'Routine', status: 'Executed', timestamp: '2023-09-14 14:00' },
    ],
    points: [],
    documents: [
      { id: 'j-hd1', date: '14.09.2023', time: '15:00', department: 'Emergency Medicine', status: 'Signed', description: 'ED Discharge Note', responsible: 'Dr. Robert Brown', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-5002__2000000004': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000004',
      admissionDate: '2024-03-05',
      deptOu: 'Cardiology',
      attendingPhysician: 'Dr. James Wilson',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'm1', code: 'I25.10', description: 'Atherosclerotic heart disease', date: '2024-03-05', status: 'Active', type: 'Admitting', markers: ['Chronic'] },
    ],
    medications: [
      { id: 'm-m1', name: 'Clopidogrel', genericName: 'Clopidogrel', dosage: '75mg', frequency: 'Once Daily', route: 'Oral', startDate: '2024-03-05', validityDate: '2025-06-30T23:59', responsibleEmployee: 'Dr. James Wilson', status: 'Signed' },
    ],
    orders: [],
    clinicalOrders: [
      { id: 'm-c1', type: 'Radiology', items: [{ code: '93306', description: 'Echocardiogram', category: 'Cardiology', performingOu: 'Cardiology Clinic' }], priority: 'Routine', status: 'Signed', timestamp: '2024-03-05 11:00' },
    ],
    points: [],
    documents: [
      { id: 'm-d1', date: '05.03.2024', time: '10:00', department: 'Cardiology', status: 'Signed', description: 'Cardiology Follow-up', responsible: 'Dr. James Wilson', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-5002__2000000003': {
    isActive: false,
    caseDetails: {
      caseNumber: '2000000003',
      admissionDate: '2023-12-08',
      deptOu: 'Internal Medicine',
      attendingPhysician: 'Dr. Grace Hopper',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'm-h1', code: 'E78.0', description: 'Pure hypercholesterolemia', date: '2023-12-08', status: 'Resolved', type: 'Discharge', markers: [] },
    ],
    medications: [
      { id: 'm-hm1', name: 'Rosuvastatin', genericName: 'Rosuvastatin', dosage: '10mg', frequency: 'Once Daily', route: 'Oral', startDate: '2023-12-08', validityDate: '2024-03-01T00:00', responsibleEmployee: 'Dr. Grace Hopper', status: 'Signed' },
    ],
    orders: [],
    clinicalOrders: [
      { id: 'm-hc1', type: 'Laboratory', items: [{ code: '80061', description: 'Lipid Panel', category: 'Biology', performingOu: 'Main Lab' }], priority: 'Routine', status: 'Executed', timestamp: '2023-12-08 09:00' },
    ],
    points: [],
    documents: [
      { id: 'm-hd1', date: '08.12.2023', time: '09:45', department: 'Internal Medicine', status: 'Signed', description: 'Lipid Management Visit', responsible: 'Dr. Grace Hopper', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-7001__2000000005': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000005',
      admissionDate: '2024-03-10',
      deptOu: 'Pediatrics',
      attendingPhysician: 'Dr. Sophie Taylor',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 's1', code: 'J45.909', description: 'Unspecified asthma, uncomplicated', date: '2024-03-10', status: 'Active', type: 'Admitting', markers: [] },
    ],
    medications: [
      { id: 's-m1', name: 'Albuterol', genericName: 'Albuterol', dosage: '90mcg', frequency: 'PRN', route: 'Inhalation', startDate: '2024-03-10', validityDate: '2025-03-10T23:59', responsibleEmployee: 'Dr. Sophie Taylor', status: 'Signed' },
    ],
    orders: [
      { id: 's-o1', type: 'Nursing', description: 'Peak flow monitoring education', assignedTo: 'Nurse', status: 'Signed', timestamp: '2024-03-10 10:00' },
    ],
    clinicalOrders: [
      { id: 's-c1', type: 'Radiology', items: [{ code: '71046', description: 'Chest X-Ray', category: 'Radiology', performingOu: 'Radiology Dept A' }], priority: 'Routine', status: 'Saved', timestamp: '2024-03-10 11:30' },
    ],
    points: [],
    documents: [
      { id: 's-d1', date: '10.03.2024', time: '09:00', department: 'Pediatrics', status: 'Signed', description: 'Asthma Management Plan', responsible: 'Dr. Sophie Taylor', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-7001__2000000004': {
    isActive: false,
    caseDetails: {
      caseNumber: '2000000004',
      admissionDate: '2023-08-22',
      deptOu: 'Emergency Medicine',
      attendingPhysician: 'Dr. Robert Brown',
      wardBed: 'Emergency',
    },
    diagnoses: [
      { id: 's-h1', code: 'S09.90XA', description: 'Head injury, unspecified', date: '2023-08-22', status: 'Resolved', type: 'Discharge', markers: [] },
    ],
    medications: [],
    orders: [],
    clinicalOrders: [
      { id: 's-hc1', type: 'Radiology', items: [{ code: '70450', description: 'CT Head without contrast', category: 'CT', performingOu: 'Radiology Dept A' }], priority: 'Urgent', status: 'Executed', timestamp: '2023-08-22 18:00' },
    ],
    points: [],
    documents: [
      { id: 's-hd1', date: '22.08.2023', time: '19:30', department: 'Emergency Medicine', status: 'Signed', description: 'ED Trauma Note', responsible: 'Dr. Robert Brown', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-8001__2000000006': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000006',
      admissionDate: '2024-03-14',
      deptOu: 'Cardiology',
      attendingPhysician: 'Dr. Sarah Connor',
      wardBed: 'Cardiac Care Unit / 201-C',
    },
    diagnoses: [
      { id: 'z1', code: 'I21.4', description: 'Non-ST elevation myocardial infarction', date: '2024-03-14', status: 'Active', type: 'Admitting', markers: ['Confirmed'] },
      { id: 'z2', code: 'I10', description: 'Hypertension', date: '2024-03-14', status: 'Active', type: 'Secondary', markers: ['Chronic'] },
    ],
    medications: [
      { id: 'z-m1', name: 'Heparin', genericName: 'Heparin', dosage: '5000 units', frequency: 'Every 8 hours', route: 'IV', startDate: '2024-03-14', validityDate: '2024-03-21T23:59', responsibleEmployee: 'Dr. Sarah Connor', status: 'Signed' },
      { id: 'z-m2', name: 'Metoprolol', genericName: 'Metoprolol', dosage: '25mg', frequency: 'Twice Daily', route: 'Oral', startDate: '2024-03-14', validityDate: '2025-12-31T23:59', responsibleEmployee: 'Dr. Sarah Connor', status: 'Signed' },
    ],
    orders: [
      { id: 'z-o1', type: 'Nursing', description: 'Continuous cardiac monitoring', assignedTo: 'Nurse', status: 'Signed', timestamp: '2024-03-14 06:00' },
      { id: 'z-o2', type: 'Physiotherapy', description: 'Early mobilization protocol', assignedTo: 'Physiotherapist', status: 'Saved', timestamp: '2024-03-15 08:00' },
    ],
    clinicalOrders: [
      { id: 'z-c1', type: 'Laboratory', items: [{ code: '84484', description: 'Troponin I', category: 'Biology', performingOu: 'Main Lab' }], priority: 'STAT', status: 'Executed', timestamp: '2024-03-14 05:30' },
      { id: 'z-c2', type: 'Radiology', items: [{ code: '93458', description: 'Left Heart Catheterization', category: 'Cardiology', performingOu: 'Cath Lab' }], priority: 'Urgent', status: 'Signed', timestamp: '2024-03-14 12:00' },
    ],
    points: [],
    documents: [
      { id: 'z-d1', date: '14.03.2024', time: '07:00', department: 'Cardiology', status: 'Signed', description: 'Admission Note', responsible: 'Dr. Sarah Connor', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-8001__2000000005': {
    isActive: false,
    caseDetails: {
      caseNumber: '2000000005',
      admissionDate: '2022-11-03',
      deptOu: 'Cardiology',
      attendingPhysician: 'Dr. James Wilson',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'z-h1', code: 'I48.91', description: 'Atrial fibrillation', date: '2022-11-03', status: 'Resolved', type: 'Discharge', markers: [] },
    ],
    medications: [
      { id: 'z-hm1', name: 'Warfarin', genericName: 'Warfarin', dosage: '5mg', frequency: 'Once Daily', route: 'Oral', startDate: '2022-11-03', validityDate: '2024-01-01T00:00', responsibleEmployee: 'Dr. James Wilson', status: 'Signed' },
    ],
    orders: [],
    clinicalOrders: [
      { id: 'z-hc1', type: 'Laboratory', items: [{ code: '85610', description: 'INR', category: 'Biology', performingOu: 'Main Lab' }], priority: 'Routine', status: 'Executed', timestamp: '2022-11-03 10:00' },
    ],
    points: [],
    documents: [
      { id: 'z-hd1', date: '03.11.2022', time: '11:00', department: 'Cardiology', status: 'Signed', description: 'AFib Management Note', responsible: 'Dr. James Wilson', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-4009__2000000007': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000007',
      admissionDate: '2024-03-13',
      deptOu: 'Internal Medicine',
      attendingPhysician: 'Dr. Grace Hopper',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'o1', code: 'E11.65', description: 'Type 2 diabetes with hyperglycemia', date: '2024-03-13', status: 'Active', type: 'Admitting', markers: ['Chronic'] },
    ],
    medications: [
      { id: 'o-m1', name: 'Insulin Glargine', genericName: 'Insulin Glargine', dosage: '20 units', frequency: 'Once Daily', route: 'SC', startDate: '2024-03-13', validityDate: '2025-12-31T23:59', responsibleEmployee: 'Dr. Grace Hopper', status: 'Signed' },
    ],
    orders: [],
    clinicalOrders: [
      { id: 'o-c1', type: 'Laboratory', items: [{ code: '83036', description: 'HbA1c', category: 'Biology', performingOu: 'Main Lab' }], priority: 'Routine', status: 'Signed', timestamp: '2024-03-13 09:00' },
    ],
    points: [],
    documents: [
      { id: 'o-d1', date: '13.03.2024', time: '09:30', department: 'Internal Medicine', status: 'Signed', description: 'Diabetes Follow-up', responsible: 'Dr. Grace Hopper', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-4009__2000000002': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000002',
      admissionDate: '2024-03-14',
      deptOu: 'Cardiology',
      attendingPhysician: 'Dr. Sarah Connor',
      wardBed: 'Cardiac Care Unit / 104-B',
    },
    diagnoses: [
      { id: 'o-p1', code: 'I21.3', description: 'ST elevation myocardial infarction', date: '2024-03-14', status: 'Active', type: 'Admitting', markers: ['Confirmed'] },
    ],
    medications: [
      { id: 'o-pm1', name: 'Aspirin', genericName: 'Acetylsalicylic Acid', dosage: '325mg', frequency: 'Once Daily', route: 'Oral', startDate: '2024-03-14', validityDate: '2025-12-31T23:59', responsibleEmployee: 'Dr. Sarah Connor', status: 'Signed' },
      { id: 'o-pm2', name: 'Nitroglycerin', genericName: 'Nitroglycerin', dosage: '0.4mg', frequency: 'PRN', route: 'SL', startDate: '2024-03-14', validityDate: '2024-03-21T23:59', responsibleEmployee: 'Dr. Sarah Connor', status: 'Signed' },
    ],
    orders: [
      { id: 'o-po1', type: 'Nursing', description: 'Telemetry monitoring', assignedTo: 'Nurse', status: 'Signed', timestamp: '2024-03-14 05:00' },
    ],
    clinicalOrders: [
      { id: 'o-pc1', type: 'Laboratory', items: [{ code: '84484', description: 'Troponin I', category: 'Biology', performingOu: 'Main Lab' }], priority: 'STAT', status: 'Executed', timestamp: '2024-03-14 04:30' },
    ],
    points: [],
    documents: [
      { id: 'o-pd1', date: '14.03.2024', time: '06:00', department: 'Cardiology', status: 'Signed', description: 'STEMI Admission Note', responsible: 'Dr. Sarah Connor', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-9002__2000000008': {
    isActive: true,
    caseDetails: {
      caseNumber: '2000000008',
      admissionDate: '2024-03-16',
      deptOu: 'Internal Medicine',
      attendingPhysician: 'Dr. Grace Hopper',
      wardBed: 'Outpatient',
    },
    diagnoses: [
      { id: 'c1', code: 'J44.9', description: 'Chronic obstructive pulmonary disease', date: '2024-03-16', status: 'Active', type: 'Admitting', markers: ['Chronic'] },
    ],
    medications: [
      { id: 'c-m1', name: 'Tiotropium', genericName: 'Tiotropium', dosage: '18mcg', frequency: 'Once Daily', route: 'Inhalation', startDate: '2024-03-16', validityDate: '2025-12-31T23:59', responsibleEmployee: 'Dr. Grace Hopper', status: 'Signed' },
      { id: 'c-m2', name: 'Prednisone', genericName: 'Prednisone', dosage: '40mg', frequency: 'Once Daily', route: 'Oral', startDate: '2024-03-16', validityDate: '2024-03-23T23:59', responsibleEmployee: 'Dr. Grace Hopper', status: 'Signed' },
    ],
    orders: [
      { id: 'c-o1', type: 'Nursing', description: 'Oxygen saturation monitoring', assignedTo: 'Nurse', status: 'Signed', timestamp: '2024-03-16 08:00' },
    ],
    clinicalOrders: [
      { id: 'c-c1', type: 'Radiology', items: [{ code: '71046', description: 'Chest X-Ray', category: 'Radiology', performingOu: 'Radiology Dept A' }], priority: 'Routine', status: 'Signed', timestamp: '2024-03-16 09:00' },
    ],
    points: [],
    documents: [
      { id: 'c-d1', date: '16.03.2024', time: '08:30', department: 'Internal Medicine', status: 'Signed', description: 'COPD Exacerbation Note', responsible: 'Dr. Grace Hopper', hasPDF: true, xmlContent: '' },
    ],
  },
  'MRN-9002__2000000007': {
    isActive: false,
    caseDetails: {
      caseNumber: '2000000007',
      admissionDate: '2023-05-18',
      deptOu: 'Emergency Medicine',
      attendingPhysician: 'Dr. Robert Brown',
      wardBed: 'Emergency',
    },
    diagnoses: [
      { id: 'c-h1', code: 'J18.9', description: 'Pneumonia, unspecified', date: '2023-05-18', status: 'Resolved', type: 'Discharge', markers: [] },
    ],
    medications: [
      { id: 'c-hm1', name: 'Azithromycin', genericName: 'Azithromycin', dosage: '500mg', frequency: 'Once Daily', route: 'Oral', startDate: '2023-05-18', validityDate: '2023-05-25T23:59', responsibleEmployee: 'Dr. Robert Brown', status: 'Signed' },
    ],
    orders: [],
    clinicalOrders: [
      { id: 'c-hc1', type: 'Laboratory', items: [{ code: '87040', description: 'Blood Culture', category: 'Microbiology', performingOu: 'Main Lab' }], priority: 'Urgent', status: 'Executed', timestamp: '2023-05-18 12:00' },
    ],
    points: [],
    documents: [
      { id: 'c-hd1', date: '18.05.2023', time: '14:00', department: 'Emergency Medicine', status: 'Signed', description: 'Pneumonia Discharge Summary', responsible: 'Dr. Robert Brown', hasPDF: true, xmlContent: '' },
    ],
  },
};

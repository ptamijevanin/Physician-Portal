
import { Patient, Surgery, Doctor, Encounter, InpatientCase } from './types';

const today = new Date().toISOString().split('T')[0];
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; 
};

const generateCardiacBookings = () => {
  const bookings: any[] = [];
  const names = [
    'Ahmed Mansour Al-Farsi', 'Abdullah Aziz Al-Saud', 'Fatima Zayed Al-Maktoum', 
    'Omar Khalid Al-Said', 'Layla Rashid Al-Mubarak', 'Mohammed Ali Al-Zahrani',
    'Yousif Hamad Al-Thani', 'Zainab Hassan Al-Harbi', 'Khalid Ibrahim Al-Otaibi', 'Mariam Saleh Al-Ghamdi',
    'Yousif Al-Hamad', 'Emily Watson', 'Abdullah Aziz', 'Grace Hopper',
    'David Miller', 'Sophie Taylor', 'Michael Chen', 'Elena Rodriguez'
  ];
  const mrns = ['MRN-1001', 'MRN-5001', 'MRN-1002', 'MRN-4009', 'MRN-7001', 'MRN-8001', 'MRN-9001', 'MRN-9002', 'MRN-9003', 'MRN-9004', 'MRN-1005', 'MRN-1006', 'MRN-1007', 'MRN-1008', 'MRN-1009', 'MRN-1010', 'MRN-1011', 'MRN-1012'];
  const dobs = ['1985-05-15', '1978-06-25', '1990-11-20', '1960-08-12', '1992-04-10', '1975-09-30', '1988-02-14', '1965-11-30', '1995-07-22', '1982-03-05', '1980-01-01', '1991-05-05', '1987-03-03', '1970-12-12', '1984-06-06', '1993-09-09', '1972-11-11', '1989-12-12'];
  const genders = ['Male', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female'];
  const types = ['Cardiac Follow-up', 'Echo Review', 'ECG Analysis', 'Hypertension Screen', 'Post-Op Check'];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = new Date(currentYear, currentMonth, i);
    if (isWeekend(dateObj)) continue;

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isToday = dateStr === today;
    
    const numApps = isToday ? 15 : 3;

    for (let j = 0; j < numApps; j++) {
      const idx = (i + j) % names.length;
      let time = "";
      let status = "confirmed";
      
      if (isToday) {
        const h = 7 + j;
        time = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
        if (j < 5) status = "completed";
      } else {
        time = `${j === 0 ? '09:00' : '02:30'} ${j === 0 ? 'AM' : 'PM'}`;
        status = dateObj < new Date() ? 'completed' : 'confirmed';
      }

      bookings.push({
        id: `CB-${i}-${j}`,
        patientId: mrns[idx],
        patientName: names[idx],
        patientDob: dobs[idx],
        patientGender: genders[idx],
        caseNumber: `20000${100 + i * 10 + j}`,
        time: time,
        date: dateStr,
        type: types[(i + j) % types.length],
        status: status
      });
    }
  }
  return bookings;
};

const generateMockSurgeries = () => {
  const surgeries: Surgery[] = [];
  const names = ['Ahmed Mansour Al-Farsi', 'John Michael Doe', 'Fatima Zayed Al-Maktoum', 'Omar Khalid Al-Said', 'Sarah Elizabeth Williams', 'Mohammed Ali Al-Zahrani', 'Christopher Smith'];
  const mrns = ['MRN-1001', 'MRN-5001', 'MRN-1002', 'MRN-4009', 'MRN-7001', 'MRN-8001', 'MRN-9002'];
  const procedures = ['Mitral Valve Repair', 'Aortic Stent Graft', 'CABG x3', 'Pacemaker Implantation', 'Heart Valve Replacement', 'Coronary Angioplasty', 'Septal Defect Repair'];
  const rooms = ['OR-01', 'OR-02', 'OR-03', 'OR-04'];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = new Date().getDate();

  for (let d = currentDay; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    if (isWeekend(dateObj)) continue;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const count = d === currentDay ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const idx = (d + i) % names.length;
      const h = 8 + (i * 3);
      const time = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
      
      let status: any = 'Scheduled';
      if (d < currentDay) status = 'Completed';
      else if (d === currentDay) {
        if (h < 10) status = 'Completed';
        else if (h === 11) status = 'In Progress';
        else if (h === 8 && i === 0) status = 'Delayed';
        else status = 'Scheduled';
      }

      surgeries.push({
        id: `SURG-${d}-${i}`,
        patientId: mrns[idx],
        patientName: names[idx],
        procedure: procedures[(d + i) % procedures.length],
        date: dateStr,
        time: time,
        surgeon: 'Dr. Sarah Connor',
        room: rooms[(d + i) % rooms.length],
        status: status
      });
    }
  }
  return surgeries;
};

export const MOCK_PATIENTS: Patient[] = [
  { id: 'MRN-1001', name: 'Ahmed Mansour Al-Farsi', dob: '1985-05-15', gender: 'Male', bloodType: 'O+', allergies: ['Penicillin'], riskFactors: ['T2DM', 'Smoker'], lastVisit: '2024-03-12', insurance: 'NSSF', patientClass: '1S', caseNumber: '2000000001' },
  { id: 'MRN-1002', name: 'Fatima Zayed Al-Maktoum', dob: '1990-11-20', gender: 'Female', bloodType: 'A-', allergies: [], riskFactors: ['GDM Risk'], lastVisit: '2024-03-11', insurance: 'Daman', patientClass: '2N', caseNumber: '2000000002' },
  { id: 'MRN-5001', name: 'John Michael Doe', dob: '1978-06-25', gender: 'Male', bloodType: 'AB+', allergies: ['Peanuts'], riskFactors: ['Hypertension'], lastVisit: '2024-03-01', insurance: 'Alico', patientClass: '3R', caseNumber: '2000000003' },
  { id: 'MRN-5002', name: 'Mohammad Abdul Rahman', dob: '1982-12-05', gender: 'Male', bloodType: 'B-', allergies: ['Iodine'], riskFactors: ['Hyperlipidemia'], lastVisit: '2024-03-05', insurance: 'MetLife', patientClass: '1S', caseNumber: '2000000004' },
  { id: 'MRN-7001', name: 'Sarah Elizabeth Williams', dob: '1992-04-10', gender: 'Female', bloodType: 'O+', allergies: [], riskFactors: [], lastVisit: '2024-03-10', insurance: 'NSSF', patientClass: '2N', caseNumber: '2000000005' },
  { id: 'MRN-8001', name: 'Mohammed Ali Al-Zahrani', dob: '1975-09-30', gender: 'Male', bloodType: 'A+', allergies: ['Sulfa'], riskFactors: ['CAD'], lastVisit: '2024-03-14', insurance: 'Daman', patientClass: '3R', caseNumber: '2000000006' },
  { id: 'MRN-4009', name: 'Omar Khalid Al-Said', dob: '1960-08-12', gender: 'Male', bloodType: 'O-', allergies: [], riskFactors: ['Diabetes'], lastVisit: '2024-03-13', insurance: 'Alico', patientClass: '1S', caseNumber: '2000000007' },
  { id: 'MRN-9002', name: 'Christopher Smith', dob: '1965-11-30', gender: 'Male', bloodType: 'B+', allergies: ['Dust'], riskFactors: ['COPD'], lastVisit: '2024-03-16', insurance: 'NSSF', patientClass: '2N', caseNumber: '2000000008' }
];

export const MOCK_SURGERIES: Surgery[] = generateMockSurgeries();

export const MOCK_DOCTORS: Doctor[] = [
  { id: 'DOC-01', name: 'Dr. Sarah Connor', department: 'Cardiology', specialization: 'Structural Heart Disease', education: 'MD, Harvard Medical School', experience: 18, clinicalPractice: 'Focuses on transcatheter valve replacement and complex structural interventions. Leads the Physician Portal Heart Team with a specialized background in invasive cardiology.', avatar: 'https://picsum.photos/seed/doc1/200/200' },
  { id: 'DOC-02', name: 'Dr. James Wilson', department: 'Cardiology', specialization: 'Electrophysiology', education: 'MD, Yale University', experience: 12, clinicalPractice: 'Expert in cardiac arrhythmia management and catheter ablation. Specializes in implementing next-gen pacemakers and ICDs.', avatar: 'https://picsum.photos/seed/doc2/200/200' },
  { id: 'DOC-03', name: 'Dr. Elena Rodriguez', department: 'Surgery', specialization: 'Cardiothoracic Surgery', education: 'MD, Johns Hopkins University', experience: 15, clinicalPractice: 'Performs over 200 open-heart surgeries annually. Known for minimally invasive bypass and advanced pulmonary bypass techniques.', avatar: 'https://picsum.photos/seed/doc3/200/200' },
  { id: 'DOC-04', name: 'Dr. Michael Chen', department: 'Surgery', specialization: 'Vascular Surgery', education: 'MD, Stanford University', experience: 10, clinicalPractice: 'Pioneer in endovascular repair of aortic aneurysms. Clinical focus includes carotid artery stenting and peripheral arterial disease.', avatar: 'https://picsum.photos/seed/doc4/200/200' },
  { id: 'DOC-05', name: 'Dr. Sophie Taylor', department: 'Pediatrics', specialization: 'Pediatric Cardiology', education: 'MD, Columbia University', experience: 8, clinicalPractice: 'Passionate about congenital heart disease across the lifespan. Leads the neonatal cardiology screening program at Physician Portal Childrens.', avatar: 'https://picsum.photos/seed/doc5/200/200' },
  { id: 'DOC-06', name: 'Dr. David Miller', department: 'Neurology', specialization: 'Neuro-Cardiology', education: 'MD, University of Chicago', experience: 20, clinicalPractice: 'Studies the autonomic nervous system control of the heart. Treats patients with syncope and complex heart-brain interactions.', avatar: 'https://picsum.photos/seed/doc6/200/200' },
  { id: 'DOC-07', name: 'Dr. Grace Hopper', department: 'Internal Medicine', specialization: 'Integrative Cardiology', education: 'MD, Oxford University', experience: 25, clinicalPractice: 'Emphasis on preventive cardiology through diet, lifestyle, and pharmacological management. Expert in lipidology.', avatar: 'https://picsum.photos/seed/doc7/200/200' },
  { id: 'DOC-08', name: 'Dr. Robert Brown', department: 'Emergency Medicine', specialization: 'Critical Care', education: 'MD, Emory University', experience: 9, clinicalPractice: 'Manages acute cardiovascular emergencies in the ICU and ED. Specialized in extracorporeal membrane oxygenation (ECMO) support.', avatar: 'https://picsum.photos/seed/doc8/200/200' }
];

export const MOCK_INPATIENT_LIST: InpatientCase[] = [
  { id: '2000000001', patientId: 'MRN-1001', patientName: 'Ahmed Mansour Al-Farsi', room: '302-A', nursingUnit: 'General Surgical Ward', department: 'Surgery', diagnosis: 'Post-Mitral Repair', admissionDate: '2024-03-12' },
  { id: '2000000002', patientId: 'MRN-4009', patientName: 'Omar Khalid Al-Said', room: '104-B', nursingUnit: 'Cardiac Care Unit', department: 'Cardiology', diagnosis: 'Acute MI', admissionDate: '2024-03-14' }
];

export const CALENDAR_DATA = generateCardiacBookings();

export const MOCK_ENCOUNTERS: Record<string, Encounter[]> = {
  'MRN-1001': [
    {
      caseNumber: '2000000003',
      caseType: 'Inpatient',
      department: 'Surgery',
      date: '2024-03-12',
      reason: 'Surgical Admission',
      physician: 'Dr. Sarah Connor',
      diagnosis: 'Acute Cholecystitis',
      medications: ['Cefazolin 2g IV'],
      labOrders: ['LFTs'],
      vitals: { bp: '142/90', hr: '88', temp: '38.2' },
      documents: ['Admission Note']
    },
    {
      caseNumber: '2000000003',
      caseType: 'Inpatient',
      department: 'Surgery',
      date: '2024-03-13',
      reason: 'Post-op Follow-up',
      physician: 'Dr. Sarah Connor',
      diagnosis: 'Secondary Hypertension',
      medications: [],
      labOrders: [],
      vitals: { bp: '150/95', hr: '82', temp: '37.0' },
      documents: []
    }
  ],
  'MRN-1002': [
    {
      caseNumber: '2000000004',
      caseType: 'Outpatient',
      department: 'Cardiology',
      date: today,
      reason: 'Regular Follow-up',
      physician: 'Dr. Sarah Connor',
      diagnosis: 'Stable Angina',
      medications: ['Aspirin 81mg'],
      labOrders: ['ECG'],
      vitals: { bp: '120/80', hr: '72', temp: '36.6' },
      documents: []
    }
  ]
};

export const INSTITUTIONS = ['Physician Portal Medical Center'];

export const CLINICAL_DEPARTMENTS = [
  'Cardiology',
  'Surgery',
  'Emergency',
  'Emergency Medicine',
  'Neurology',
  'Pediatrics',
  'Internal Medicine',
  'Radiology',
  'Laboratory',
];

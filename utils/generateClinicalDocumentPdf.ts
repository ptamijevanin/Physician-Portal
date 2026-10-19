import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicalDocument, Patient } from '../types';
import {
  CaseDetails,
  drawDocumentFooter,
  drawHospitalHeader,
  drawParagraph,
  drawPatientInfoBox,
  drawSectionTitle,
  drawSignatureBlock,
} from './pdfDocumentLayout';
import { isSoapDocument, parseSoapDocumentXml } from './soapDocumentXml';
import {
  isPatientInstructionsDocument,
  parsePatientInstructionsXml,
  PATIENT_INSTRUCTIONS_DESCRIPTION,
} from './patientInstructionsXml';
import { getDocumentVersion } from './versionedClinicalDocuments';

const ensurePageSpace = (doc: jsPDF, y: number, needed = 30) => {
  if (y + needed > 270) {
    doc.addPage();
    return 20;
  }
  return y;
};

const drawDraftStatusBlock = (doc: jsPDF, status: string, responsible: string, y: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('PREPARED BY', 14, y);
  doc.setFontSize(11);
  doc.setTextColor(49, 46, 129);
  doc.text(responsible, 14, y + 8);

  doc.text('DOCUMENT STATUS', pageWidth - 14, y, { align: 'right' });
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(9);
  doc.text(`${status.toUpperCase()} — NOT YET SIGNED`, pageWidth - 14, y + 8, { align: 'right' });
};

const generateAdmissionNotePdf = (patient: Patient, caseDetails: CaseDetails, document: ClinicalDocument): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuedAt = `${document.date} ${document.time}`;

  drawHospitalHeader(doc, 'Admission Note', issuedAt);
  let y = drawPatientInfoBox(doc, patient, caseDetails, {
    admittedOn: `${caseDetails.admissionDate} 08:15:04`,
    coverage: patient.insurance || 'Self Payer',
  });

  y = drawSectionTitle(doc, 'Reason for Admission', y + 4);
  y = drawParagraph(doc, 'Chief complaint', 'abdominal pain', y + 2);
  y = drawParagraph(
    doc,
    'Anamnesis',
    '72 year old male admitted for 2 days history of abdominal pain and fever',
    y + 4,
  );

  y = drawSectionTitle(doc, 'Patient History', y + 6);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Risk Factors']],
    body: [['None'], ['FALL'], ['Obesity'], ['Smoking'], ['Pregnancy']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = drawParagraph(doc, 'Allergies Status', 'No Known Allergies', y);

  autoTable(doc, {
    startY: y + 2,
    margin: { left: 14, right: 14 },
    head: [['Active Health Problems', 'Additional Information']],
    body: [['Tuberculosis', '']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
  });

  doc.addPage();
  y = 20;
  y = drawSectionTitle(doc, 'Physical Examination', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Vital Sign', 'Measured Value', 'Normal Range', 'Date/Time']],
    body: [
      ['Systolic Arterial Pressure', '210 mmHg', '90-140 mmHg', '21-05-2025 07:12:00'],
      ['Diastolic Arterial Pressure', '110 mmHg', '70-80 mmHg', '21-05-2025 07:12:00'],
      ['Heart Rate', '101 BPM', '60-90 BPM', '21-05-2025 07:12:00'],
      ['Oxygen Saturation', '88 %', '95-100 %', '21-05-2025 07:12:00'],
    ],
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 1: { fontStyle: 'bold' } },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = drawParagraph(doc, 'Summary of Physical Examination', 'abc\ndef\nhig\n123\n456', y);

  doc.addPage();
  y = 20;
  y = drawSectionTitle(doc, 'Findings and Care Plan', y);
  y = drawParagraph(doc, 'Admitting Diagnosis', 'E05 - Thyrotoxicosis [hyperthyroidism] (Admitting)', y + 2);
  y = drawParagraph(doc, 'Care Plan', 'Resume ATB for 5 days IV', y + 6);

  autoTable(doc, {
    startY: y + 4,
    margin: { left: 14, right: 14 },
    head: [['Order Type', 'Description', 'Dose', 'Validity', 'Route', 'Physician']],
    body: [
      ['General Prescription', 'TRAMAL RETARD 100 mg TAB, ORAL, 1 TAB, 4/DAY', '1 TAB', '07.04.2025 - 07.05.2025', 'Oral', document.responsible],
      ['General Prescription', 'PLAVix 75 mg TAB, ORAL, 75 MG, Q2H', '75 MG', '03.04.2025 - 03.04.2025', 'Oral', document.responsible],
    ],
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 220) + 16;
  drawSignatureBlock(doc, document.responsible, y);
  drawDocumentFooter(doc, 'LAU Medical Center • Admission Note • Electronic Health Record');

  return doc.output('blob');
};

const generateEmergencyRecordPdf = (patient: Patient, caseDetails: CaseDetails, document: ClinicalDocument): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuedAt = `${document.date} ${document.time}`;

  drawHospitalHeader(doc, 'Emergency Physician Record', issuedAt);
  let y = drawPatientInfoBox(doc, patient, caseDetails, { coverage: patient.insurance || 'Self Payer' });

  y = drawSectionTitle(doc, 'Emergency Presentation', y + 4);
  y = drawParagraph(doc, 'Chief complaint', 'Acute chest pain with shortness of breath', y + 2);
  y = drawParagraph(doc, 'Triage category', 'Category II - Emergent', y + 6);
  y = drawParagraph(doc, 'Arrival mode', 'Ambulance', y + 6);

  y = drawSectionTitle(doc, 'Initial Assessment', y + 8);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Assessment', 'Finding']],
    body: [
      ['Airway', 'Patent'],
      ['Breathing', 'Tachypnea, bilateral air entry'],
      ['Circulation', 'Tachycardic, warm peripheries'],
      ['Disability', 'Alert and oriented x3'],
      ['Exposure', 'No acute external trauma'],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  y = drawSectionTitle(doc, 'Emergency Interventions', y);
  y = drawParagraph(doc, 'Orders', 'ECG, Troponin, Chest X-Ray, IV access established', y + 2);
  y = drawParagraph(doc, 'Treatment', 'Aspirin 325 mg PO, supplemental oxygen 2L/min', y + 6);
  y = drawParagraph(doc, 'Disposition', 'Admitted to Cardiology for further monitoring', y + 6);

  drawSignatureBlock(doc, document.responsible, y + 18);
  drawDocumentFooter(doc, 'LAU Medical Center • Emergency Physician Record • Electronic Health Record');

  return doc.output('blob');
};

const generateSoapNotePdf = (patient: Patient, caseDetails: CaseDetails, document: ClinicalDocument): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuedAt = `${document.date} ${document.time}`;
  const soap = parseSoapDocumentXml(document.xmlContent);

  drawHospitalHeader(doc, `SOAP Document${getDocumentVersion(document) > 1 ? ` (v${getDocumentVersion(document)})` : ''}`, issuedAt);
  let y = drawPatientInfoBox(doc, patient, caseDetails, { coverage: patient.insurance || 'Self Payer' });

  y = ensurePageSpace(doc, y);
  y = drawSectionTitle(doc, 'Purpose of Visit', y + 4);
  y = drawParagraph(doc, 'Reason', soap.purposeOfVisit || 'N/A', y + 2);

  if (soap.complaints.length > 0) {
    y = ensurePageSpace(doc, y, 20);
    y = drawSectionTitle(doc, 'Complaints', y + 6);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['#', 'Complaint']],
      body: soap.complaints.map((complaint, index) => [String(index + 1), complaint]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 12 } },
    });
    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  }

  y = ensurePageSpace(doc, y);
  y = drawSectionTitle(doc, 'Clinical Assessment', y + 4);
  y = drawParagraph(doc, 'Subjective', soap.subjective || 'N/A', y + 2);
  y = ensurePageSpace(doc, y);
  y = drawParagraph(doc, 'Objective', soap.objective || 'N/A', y + 4);
  y = ensurePageSpace(doc, y);
  y = drawParagraph(doc, 'Assessment', soap.assessment || 'N/A', y + 4);
  y = ensurePageSpace(doc, y);
  y = drawParagraph(doc, 'Plan', soap.plan || 'N/A', y + 4);

  if (soap.icdDiagnoses.length > 0) {
    y = ensurePageSpace(doc, y, 24);
    y = drawSectionTitle(doc, 'ICD-10 Diagnoses', y + 6);
    soap.icdDiagnoses.forEach((item, index) => {
      y = ensurePageSpace(doc, y, 16);
      y = drawParagraph(doc, `Code ${index + 1}`, item.code || 'N/A', y + (index === 0 ? 2 : 4));
      y = drawParagraph(doc, 'Description', item.description || 'N/A', y + 2);
    });
  }

  y = ensurePageSpace(doc, y, 24);
  if (document.status === 'Signed') {
    drawSignatureBlock(doc, document.responsible, y + 6);
  } else {
    drawDraftStatusBlock(doc, document.status, document.responsible, y + 6);
  }
  drawDocumentFooter(doc, 'LAU Medical Center • SOAP Document • Electronic Health Record');

  return doc.output('blob');
};

const generatePatientInstructionsPdf = (
  patient: Patient,
  caseDetails: CaseDetails,
  document: ClinicalDocument,
): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuedAt = `${document.date} ${document.time}`;
  const instructions = parsePatientInstructionsXml(document.xmlContent);
  const version = getDocumentVersion(document);

  drawHospitalHeader(
    doc,
    `${PATIENT_INSTRUCTIONS_DESCRIPTION}${version > 1 ? ` (v${version})` : ''}`,
    issuedAt,
  );
  let y = drawPatientInfoBox(doc, patient, caseDetails, { coverage: patient.insurance || 'Self Payer' });

  instructions.blocks.forEach((block, index) => {
    y = ensurePageSpace(doc, y, 30);
    y = drawSectionTitle(doc, block.title || `Section ${index + 1}`, y + (index === 0 ? 4 : 8));
    y = drawParagraph(doc, 'Instructions', block.content || 'N/A', y + 2);
  });

  y = ensurePageSpace(doc, y, 24);
  if (document.status === 'Signed') {
    drawSignatureBlock(doc, document.responsible, y + 6);
  } else {
    drawDraftStatusBlock(doc, document.status, document.responsible, y + 6);
  }
  drawDocumentFooter(doc, 'LAU Medical Center • Patient Instructions • Electronic Health Record');

  return doc.output('blob');
};

const generateGenericClinicalPdf = (patient: Patient, caseDetails: CaseDetails, document: ClinicalDocument): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuedAt = `${document.date} ${document.time}`;

  drawHospitalHeader(doc, document.description, issuedAt);
  let y = drawPatientInfoBox(doc, patient, caseDetails);

  y = drawSectionTitle(doc, 'Document Summary', y + 4);
  y = drawParagraph(doc, 'Department', document.department, y + 2);
  y = drawParagraph(doc, 'Status', document.status, y + 6);
  y = drawParagraph(doc, 'Responsible', document.responsible, y + 6);
  y = drawParagraph(
    doc,
    'Clinical Notes',
    'This document is available in the clinical record. Refer to the full chart for complete details.',
    y + 6,
  );

  drawSignatureBlock(doc, document.responsible, y + 20);
  drawDocumentFooter(doc, `LAU Medical Center • ${document.description} • Electronic Health Record`);

  return doc.output('blob');
};

export const generateClinicalDocumentPdfBlob = (
  document: ClinicalDocument,
  patient: Patient,
  caseDetails: CaseDetails,
): Blob => {
  if (isSoapDocument(document)) {
    return generateSoapNotePdf(patient, caseDetails, document);
  }
  if (isPatientInstructionsDocument(document)) {
    return generatePatientInstructionsPdf(patient, caseDetails, document);
  }
  if (document.description === 'Admission Note') {
    return generateAdmissionNotePdf(patient, caseDetails, document);
  }
  if (document.description === 'Emergency Physician Record') {
    return generateEmergencyRecordPdf(patient, caseDetails, document);
  }
  return generateGenericClinicalPdf(patient, caseDetails, document);
};

export const getClinicalDocumentPdfFilename = (document: ClinicalDocument, patientId: string) => {
  if (document.fileName?.toLowerCase().endsWith('.pdf')) return document.fileName;
  if (document.fileName) return `${document.fileName}.pdf`;
  const slug = document.description.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return `${slug}-${patientId}.pdf`;
};

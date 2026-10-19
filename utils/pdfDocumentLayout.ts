import { jsPDF } from 'jspdf';
import { Patient } from '../types';

export interface CaseDetails {
  caseNumber: string;
  admissionDate: string;
  deptOu: string;
  attendingPhysician: string;
  wardBed: string;
}

export const calculateAge = (dob: string) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export const formatPdfDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB').replace(/\//g, '-');
};

export const drawLabelValue = (
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  valueColor?: [number, number, number],
) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (valueColor) doc.setTextColor(...valueColor);
  else doc.setTextColor(15, 23, 42);
  doc.text(`: ${value}`, x + 34, y);
};

export const drawHospitalHeader = (doc: jsPDF, documentTitle: string, issuedAt?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(79, 70, 229);
  doc.roundedRect(14, 14, 18, 18, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LAU', 23, 25.5, { align: 'center' });

  doc.setTextColor(49, 46, 129);
  doc.setFontSize(15);
  doc.text('LAU Medical Center', 36, 21);
  doc.setFontSize(7);
  doc.setTextColor(129, 140, 248);
  doc.text('RIZK HOSPITAL • 1925-2025', 36, 27);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text(documentTitle.toUpperCase(), pageWidth - 14, 21, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    issuedAt ? `Issued: ${issuedAt}` : `Issued: ${new Date().toLocaleString('en-GB').replace(',', '')}`,
    pageWidth - 14,
    27,
    { align: 'right' },
  );

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.line(14, 36, pageWidth - 14, 36);
};

export const drawPatientInfoBox = (
  doc: jsPDF,
  patient: Patient,
  caseDetails: CaseDetails,
  options?: { admittedOn?: string; coverage?: string },
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const allergies = patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None recorded';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, pageWidth - 28, 38, 3, 3, 'FD');

  const leftX = 18;
  const rightX = pageWidth / 2 + 4;
  let leftY = 50;
  let rightY = 50;

  drawLabelValue(doc, leftX, leftY, 'Patient Name', patient.name);
  leftY += 7;
  drawLabelValue(doc, leftX, leftY, 'MRN', patient.id);
  leftY += 7;
  drawLabelValue(doc, leftX, leftY, 'D.O.B / Age', `${formatPdfDate(patient.dob)} / ${calculateAge(patient.dob)} years`);
  leftY += 7;
  drawLabelValue(doc, leftX, leftY, 'Allergies', allergies, [190, 18, 60]);

  drawLabelValue(doc, rightX, rightY, 'Case No', caseDetails.caseNumber);
  rightY += 7;
  drawLabelValue(doc, rightX, rightY, 'Gender', patient.gender);
  rightY += 7;
  drawLabelValue(doc, rightX, rightY, 'Department', caseDetails.deptOu);
  rightY += 7;
  drawLabelValue(doc, rightX, rightY, 'Ward / Bed', caseDetails.wardBed);
  rightY += 7;
  drawLabelValue(doc, rightX, rightY, 'Physician', caseDetails.attendingPhysician);

  if (options?.admittedOn) {
    leftY += 7;
    drawLabelValue(doc, leftX, leftY, 'Admitted on', options.admittedOn);
  }
  if (options?.coverage) {
    rightY += 7;
    drawLabelValue(doc, rightX, rightY, 'Coverage', options.coverage);
  }

  return 86;
};

export const drawSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), 14, y);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(14, y + 2, doc.internal.pageSize.getWidth() - 14, y + 2);
  return y + 8;
};

export const drawParagraph = (doc: jsPDF, label: string, value: string, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${label}:`, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(value, doc.internal.pageSize.getWidth() - 56);
  doc.text(lines, 52, y);
  return y + Math.max(6, lines.length * 5);
};

export const drawSignatureBlock = (doc: jsPDF, signer: string, y: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('FINALIZED & DIGITALLY SIGNED BY', 14, y);
  doc.setFontSize(11);
  doc.setTextColor(49, 46, 129);
  doc.text(signer, 14, y + 8);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Signed on: ${new Date().toLocaleString('en-GB').replace(',', '')}`, 14, y + 14);

  doc.text('DOCUMENT STATUS', pageWidth - 14, y, { align: 'right' });
  doc.setTextColor(4, 120, 87);
  doc.setFontSize(9);
  doc.text('SIGNED & VERIFIED', pageWidth - 14, y + 8, { align: 'right' });
};

export const drawDocumentFooter = (doc: jsPDF, text: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(text, pageWidth / 2, pageHeight - 10, { align: 'center' });
};

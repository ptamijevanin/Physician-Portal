import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient } from '../types';
import {
  CaseDetails,
  drawDocumentFooter,
  drawHospitalHeader,
  drawLabelValue,
  drawParagraph,
  drawPatientInfoBox,
  drawSectionTitle,
  drawSignatureBlock,
} from './pdfDocumentLayout';

export interface LabRadReportDetail {
  code?: string;
  parameter: string;
  result: string;
  unit: string;
  referenceRange: string;
  flag?: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface LabRadReport {
  id: string;
  type: 'Laboratory' | 'Radiology';
  service: string;
  date: string;
  status: 'Final' | 'Preliminary' | 'Critical';
  performingOu: string;
  physician: string;
  summary: string;
  isCritical?: boolean;
  details?: LabRadReportDetail[];
  findings?: string;
  impression?: string;
}

const drawMultilineBody = (doc: jsPDF, text: string, y: number) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 28);
  doc.text(lines, 14, y);
  return y + Math.max(8, lines.length * 5);
};

export const generateLabRadReportPdfBlob = (
  report: LabRadReport,
  patient: Patient,
  caseDetails: CaseDetails,
): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const title = report.type === 'Laboratory' ? 'Laboratory Report' : 'Radiology Report';

  drawHospitalHeader(doc, title, report.date);
  let y = drawPatientInfoBox(doc, patient, caseDetails);

  y = drawSectionTitle(doc, 'Report Information', y + 6);
  drawLabelValue(doc, 14, y + 2, 'Report ID', report.id);
  drawLabelValue(doc, 14, y + 9, 'Status', report.status);
  drawLabelValue(doc, 14, y + 16, 'Performing OU', report.performingOu);
  drawLabelValue(doc, 14, y + 23, 'Ordering Physician', report.physician);
  y += 32;

  y = drawSectionTitle(doc, 'Service', y);
  y = drawParagraph(doc, 'Description', report.service, y + 2);
  y = drawParagraph(doc, 'Summary', report.summary, y + 4);

  if (report.type === 'Laboratory' && report.details?.length) {
    y = drawSectionTitle(doc, 'Test Results', y + 6);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Parameter', 'Result', 'Unit', 'Ref. Range', 'Flag']],
      body: report.details.map((detail) => [
        detail.parameter,
        detail.result,
        detail.unit,
        detail.referenceRange,
        detail.flag && detail.flag !== 'Normal' ? detail.flag : '',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
    });
    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  }

  if (report.type === 'Radiology') {
    if (report.findings) {
      y = drawSectionTitle(doc, 'Findings', y + 6);
      y = drawMultilineBody(doc, report.findings, y + 2);
    }
    if (report.impression) {
      y = drawSectionTitle(doc, 'Impression', y + 6);
      y = drawMultilineBody(doc, report.impression, y + 2);
    }
  }

  y += 10;
  drawSignatureBlock(doc, report.physician, y);
  drawDocumentFooter(
    doc,
    `LAU Medical Center • ${report.service} • ${report.id} • Electronic Health Record`,
  );

  return doc.output('blob');
};

export const getLabRadReportPdfFilename = (report: LabRadReport, patientId: string) => {
  const slug = report.service.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return `${report.id}-${slug}-${patientId}.pdf`;
};

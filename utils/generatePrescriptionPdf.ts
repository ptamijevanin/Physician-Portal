import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Medication, Patient } from '../types';
import {
  ARABIC_FONT_NAME,
  drawArabicText,
  drawBilingualLabel,
  drawBilingualSectionTitle,
  registerArabicFont,
  setLatinFont,
  shapeArabic,
} from './pdfArabicFont';

interface CaseDetails {
  caseNumber: string;
  admissionDate: string;
  deptOu: string;
  attendingPhysician: string;
  wardBed: string;
}

const MARGIN = 10;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const PRESCRIPTION_AR = {
  republic: 'الجمهورية اللبنانية',
  moph: 'وزارة الصحة العامة',
  title: 'الوصفة الطبية الموحدة',
  decision: 'قرار وزاري رقم 1295 — التعويض بالدواء الجنيس مسموح',
  copyWhite: 'نسخة بيضاء — المريض / الضمان',
  copyPink: 'نسخة وردية — الصيدلي',
  copyYellow: 'نسخة صفراء — الطبيب',
  physician: 'الطبيب المعالج',
  patient: 'المريض',
  name: 'الاسم',
  orderNo: 'رقم النقابة',
  specialty: 'الاختصاص / القسم',
  facility: 'المستشفى',
  fullName: 'الاسم والشهرة',
  ageSex: 'العمر / الجنس',
  insured: 'رقم المؤمن / الملف',
  dob: 'تاريخ الولادة',
  medications: 'الأدوية والمستلزمات الطبية',
  drug: 'دواء (DCI)',
  formDose: 'الشكل والجرعة',
  route: 'طريقة الاستعمال',
  frequency: 'التكرار',
  duration: 'المدة',
  ns: 'غ.ت',
  substitution: 'التعويض بالدواء الجنيس',
  substitutionNote:
    'إذا لم تُوضَع علامة غير قابل للتعويض (غ.ت)، يحق للصيدلي صرف دواء جنيس مكافئ وفقاً للقانون وقائمة وزارة الصحة العامة.',
  allergies: 'الحساسية المعروفة',
  noneKnown: 'لا يوجد',
  physicianSignature: 'توقيع وختم الطبيب',
  pharmacistReserved: 'خاص بالصيدلي / المخبر / الأشعة',
  stampSignature: 'الختم والتوقيع',
  dispenseDate: 'تاريخ الصرف',
  price: 'السعر (ل.ل)',
  copyPatient: 'نسخة: المريض',
};

const calculateAge = (dob: string) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const formatLebaneseDate = (value?: Date | string) => {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDuration = (startDate: string, validityDate?: string) => {
  if (!validityDate) return '—';
  const start = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00`);
  const end = new Date(validityDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return '—';
  if (days === 1) return '1 jour';
  if (days < 30) return `${days} jours`;
  const months = Math.round(days / 30);
  return months === 1 ? '1 mois' : `${months} mois`;
};

const generatePrescriptionSerial = (patientId: string) => {
  const stamp = Date.now().toString().slice(-8);
  const patientSuffix = patientId.replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `LB-${patientSuffix}-${stamp}`;
};

const drawFieldLine = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  labelFr: string,
  labelAr: string,
  value: string,
) => {
  drawBilingualLabel(doc, labelFr, labelAr, x, y - 3.2, width, 6);

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.2);
  doc.line(x, y + 1.5, x + width, y + 1.5);

  setLatinFont(doc, 'normal', 8);
  doc.text(value || ' ', x + 1, y + 0.8);
};

const drawSectionBox = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  titleFr: string,
  titleAr: string,
) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(x, y, width, height);

  doc.setFillColor(245, 245, 245);
  doc.rect(x, y, width, 7, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.line(x, y + 7, x + width, y + 7);

  drawBilingualSectionTitle(doc, titleFr, titleAr, x + 2, y + 4.8, width - 4);
};

const drawBarcodePlaceholder = (doc: jsPDF, x: number, y: number, width: number, height: number, code: string) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, height);

  const barWidth = 0.35;
  let cursor = x + 1;
  const pattern = code.split('').map((char) => (char.charCodeAt(0) % 3) + 1);
  pattern.forEach((size) => {
    doc.setFillColor(0, 0, 0);
    doc.rect(cursor, y + 1, barWidth * size, height - 2, 'F');
    cursor += barWidth * size + 0.2;
    if (cursor > x + width - 2) return;
  });

  setLatinFont(doc, 'normal', 6);
  doc.setTextColor(40, 40, 40);
  doc.text(code, x + width / 2, y + height + 3, { align: 'center' });
};

export const generatePrescriptionPdfBlob = async (
  patient: Patient,
  caseDetails: CaseDetails,
  medications: Medication[],
): Promise<Blob> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await registerArabicFont(doc);

  const prescriber = medications[0]?.responsibleEmployee || caseDetails.attendingPhysician;
  const issuedAt = new Date();
  const serialNumber = generatePrescriptionSerial(patient.id);
  const allergies =
    patient.allergies.length > 0 ? patient.allergies.join(', ') : `Aucune connue / ${PRESCRIPTION_AR.noneKnown}`;
  const genderFr = patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : '—';
  const physicianOrderNo = '20000389';

  let y = MARGIN;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 24);

  setLatinFont(doc, 'bold', 8);
  doc.text('REPUBLIQUE LIBANAISE', MARGIN + 3, y + 5);
  drawArabicText(doc, PRESCRIPTION_AR.republic, MARGIN + CONTENT_WIDTH - 3, y + 5, {
    fontSize: 8,
    align: 'right',
    style: 'bold',
  });

  setLatinFont(doc, 'bold', 8);
  doc.text('MINISTERE DE LA SANTE PUBLIQUE', MARGIN + 3, y + 10);
  drawArabicText(doc, PRESCRIPTION_AR.moph, MARGIN + CONTENT_WIDTH - 3, y + 10, {
    fontSize: 8,
    align: 'right',
    style: 'bold',
  });

  setLatinFont(doc, 'bold', 11);
  doc.text('ORDONNANCE MEDICALE UNIFIEE', PAGE_WIDTH / 2, y + 16, { align: 'center' });
  drawArabicText(doc, PRESCRIPTION_AR.title, PAGE_WIDTH / 2, y + 21, {
    fontSize: 9,
    align: 'center',
    style: 'bold',
  });

  setLatinFont(doc, 'normal', 6);
  doc.setTextColor(80, 80, 80);
  doc.text('Decision ministerielle n° 1295 — Substitution generique autorisee', PAGE_WIDTH / 2, y + 23.5, {
    align: 'center',
  });

  setLatinFont(doc, 'bold', 7);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Serie: ${serialNumber}`, PAGE_WIDTH - MARGIN - 3, y + 5, { align: 'right' });
  setLatinFont(doc, 'normal', 7);
  doc.text(`Date: ${formatLebaneseDate(issuedAt)}`, PAGE_WIDTH - MARGIN - 3, y + 10, { align: 'right' });
  doc.text('Copie: PATIENT', PAGE_WIDTH - MARGIN - 3, y + 15, { align: 'right' });
  drawArabicText(doc, PRESCRIPTION_AR.copyPatient, PAGE_WIDTH - MARGIN - 3, y + 19, {
    fontSize: 6.5,
    align: 'right',
  });

  y += 26;

  const copyStripHeight = 8;
  doc.setFillColor(248, 248, 248);
  doc.rect(MARGIN, y, CONTENT_WIDTH, copyStripHeight, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.rect(MARGIN, y, CONTENT_WIDTH, copyStripHeight);

  setLatinFont(doc, 'bold', 5.5);
  doc.text('COPIE BLANCHE — PATIENT / MUTUELLE', MARGIN + 2, y + 3);
  drawArabicText(doc, PRESCRIPTION_AR.copyWhite, MARGIN + 64, y + 3, { fontSize: 5.5, align: 'right' });

  setLatinFont(doc, 'bold', 5.5);
  doc.text('COPIE ROSE — PHARMACIEN', MARGIN + 68, y + 3);
  drawArabicText(doc, PRESCRIPTION_AR.copyPink, MARGIN + 128, y + 3, { fontSize: 5.5, align: 'right' });

  setLatinFont(doc, 'bold', 5.5);
  doc.text('COPIE JAUNE — MEDECIN', MARGIN + 132, y + 3);
  drawArabicText(doc, PRESCRIPTION_AR.copyYellow, MARGIN + CONTENT_WIDTH - 2, y + 3, {
    fontSize: 5.5,
    align: 'right',
  });

  setLatinFont(doc, 'normal', 5);
  doc.setTextColor(80, 80, 80);
  doc.text('Triplicate form — Ministerial Decision 1295', MARGIN + 2, y + 6.5);

  y += 10;

  const infoBoxHeight = 36;
  const colWidth = CONTENT_WIDTH / 2 - 1;

  drawSectionBox(doc, MARGIN, y, colWidth, infoBoxHeight, 'Medecin Prescripteur', PRESCRIPTION_AR.physician);
  drawFieldLine(doc, MARGIN + 2, y + 12, colWidth - 4, 'Nom', PRESCRIPTION_AR.name, prescriber);
  drawFieldLine(
    doc,
    MARGIN + 2,
    y + 19,
    colWidth - 4,
    'N° Ordre des Medecins',
    PRESCRIPTION_AR.orderNo,
    physicianOrderNo,
  );
  drawFieldLine(
    doc,
    MARGIN + 2,
    y + 26,
    colWidth - 4,
    'Specialite / Service',
    PRESCRIPTION_AR.specialty,
    caseDetails.deptOu,
  );
  drawFieldLine(
    doc,
    MARGIN + 2,
    y + 33,
    colWidth - 4,
    'Etablissement',
    PRESCRIPTION_AR.facility,
    'LAU Medical Center — Rizk Hospital',
  );

  const patientX = MARGIN + colWidth + 2;
  drawSectionBox(doc, patientX, y, colWidth, infoBoxHeight, 'Patient', PRESCRIPTION_AR.patient);
  drawFieldLine(doc, patientX + 2, y + 12, colWidth - 4, 'Nom et Prenom', PRESCRIPTION_AR.fullName, patient.name);
  drawFieldLine(
    doc,
    patientX + 2,
    y + 19,
    colWidth - 4,
    'Age / Sexe',
    PRESCRIPTION_AR.ageSex,
    `${calculateAge(patient.dob)} ans / ${genderFr}`,
  );
  drawFieldLine(
    doc,
    patientX + 2,
    y + 26,
    colWidth - 4,
    'N° Assure / Dossier',
    PRESCRIPTION_AR.insured,
    `${patient.insurance || '—'} / ${caseDetails.caseNumber}`,
  );
  drawFieldLine(
    doc,
    patientX + 2,
    y + 33,
    colWidth - 4,
    'Date de naissance',
    PRESCRIPTION_AR.dob,
    formatLebaneseDate(patient.dob),
  );

  y += infoBoxHeight + 4;

  drawBarcodePlaceholder(doc, PAGE_WIDTH - MARGIN - 42, y, 42, 12, serialNumber);
  drawBilingualLabel(
    doc,
    'MEDICAMENTS, APPAREILS ET DISPOSITIFS MEDICAUX',
    PRESCRIPTION_AR.medications,
    MARGIN,
    y + 4,
    CONTENT_WIDTH - 44,
    7,
  );

  y += 12;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        '#',
        shapeArabic(PRESCRIPTION_AR.drug),
        shapeArabic(PRESCRIPTION_AR.formDose),
        shapeArabic(PRESCRIPTION_AR.route),
        shapeArabic(PRESCRIPTION_AR.frequency),
        shapeArabic(PRESCRIPTION_AR.duration),
        shapeArabic(PRESCRIPTION_AR.ns),
      ],
      ['#', 'Medicament (DCI)', 'Forme / Dosage', 'Voie', 'Frequence', 'Duree', 'NS'],
    ],
    body: medications.map((med, index) => [
      String(index + 1),
      `${med.name}\n(${med.genericName})`,
      med.dosage,
      med.route,
      med.frequency,
      formatDuration(med.startDate, med.validityDate),
      ' ',
    ]),
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      valign: 'middle',
      font: 'helvetica',
      fontStyle: 'normal',
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      fontSize: 6.5,
      halign: 'center',
      font: ARABIC_FONT_NAME,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8, font: 'helvetica' },
      1: { cellWidth: 48, fontStyle: 'bold', font: 'helvetica' },
      2: { cellWidth: 28, font: 'helvetica' },
      3: { cellWidth: 18, halign: 'center', font: 'helvetica' },
      4: { cellWidth: 28, font: 'helvetica' },
      5: { cellWidth: 18, halign: 'center', font: 'helvetica' },
      6: { halign: 'center', cellWidth: 10, font: 'helvetica' },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.row.index === 1) {
        data.cell.styles.font = 'helvetica';
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.section === 'body') {
        data.cell.styles.font = 'helvetica';
        data.cell.styles.fontStyle = data.column.index === 1 ? 'bold' : 'normal';
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const { x, y: cellY, width, height } = data.cell;
        const boxSize = 3.5;
        const boxX = x + (width - boxSize) / 2;
        const boxY = cellY + (height - boxSize) / 2;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);
        doc.rect(boxX, boxY, boxSize, boxSize);
      }
    },
  });

  let finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
  finalY += 4;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN, finalY, CONTENT_WIDTH, 18);

  drawBilingualLabel(
    doc,
    'SUBSTITUTION GENERIQUE (NS = Non-Substituable)',
    PRESCRIPTION_AR.substitution,
    MARGIN + 2,
    finalY + 4,
    CONTENT_WIDTH - 4,
    6.5,
  );

  setLatinFont(doc, 'normal', 5.5);
  const substitutionNoteFr =
    'Si la case NS n\'est pas cochee, le pharmacien peut delivrer un medicament generique equivalent ' +
    'conformement a la loi (art. 47) et a la liste du MOPH.';
  const noteLinesFr = doc.splitTextToSize(substitutionNoteFr, CONTENT_WIDTH / 2 - 4);
  doc.text(noteLinesFr, MARGIN + 2, finalY + 9);

  drawArabicText(doc, PRESCRIPTION_AR.substitutionNote, MARGIN + CONTENT_WIDTH - 2, finalY + 9, {
    fontSize: 5.5,
    align: 'right',
    maxWidth: CONTENT_WIDTH / 2 - 4,
  });

  finalY += 20;

  doc.rect(MARGIN, finalY, CONTENT_WIDTH, 10);
  drawBilingualLabel(doc, 'Allergies connues:', PRESCRIPTION_AR.allergies, MARGIN + 2, finalY + 4, 40, 6.5);
  setLatinFont(doc, 'normal', 7);
  doc.setTextColor(150, 0, 0);
  doc.text(allergies, MARGIN + 42, finalY + 4);
  doc.setTextColor(0, 0, 0);

  finalY += 12;

  const signatureHeight = 30;
  const sigColWidth = CONTENT_WIDTH / 2 - 1;

  drawSectionBox(
    doc,
    MARGIN,
    finalY,
    sigColWidth,
    signatureHeight,
    'Signature et cachet du medecin',
    PRESCRIPTION_AR.physicianSignature,
  );
  setLatinFont(doc, 'normal', 8);
  doc.text(prescriber, MARGIN + 3, finalY + 15);
  setLatinFont(doc, 'normal', 6);
  doc.text(`Date: ${formatLebaneseDate(issuedAt)}`, MARGIN + 3, finalY + 21);
  doc.line(MARGIN + 3, finalY + 25, MARGIN + sigColWidth - 6, finalY + 25);

  const pharmacistX = MARGIN + sigColWidth + 2;
  drawSectionBox(
    doc,
    pharmacistX,
    finalY,
    sigColWidth,
    signatureHeight,
    'Reserve au Pharmacien / Labo / Radio',
    PRESCRIPTION_AR.pharmacistReserved,
  );
  drawFieldLine(doc, pharmacistX + 2, finalY + 13, sigColWidth - 4, 'Cachet et signature', PRESCRIPTION_AR.stampSignature, '');
  drawFieldLine(
    doc,
    pharmacistX + 2,
    finalY + 21,
    (sigColWidth - 6) / 2,
    'Date delivrance',
    PRESCRIPTION_AR.dispenseDate,
    '',
  );
  drawFieldLine(
    doc,
    pharmacistX + 2 + (sigColWidth - 6) / 2 + 2,
    finalY + 21,
    (sigColWidth - 6) / 2,
    'Prix (LL)',
    PRESCRIPTION_AR.price,
    '',
  );

  finalY += signatureHeight + 4;

  setLatinFont(doc, 'italic', 5.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    'Document electronique — LAU Medical Center — Conforme a l\'Ordonnance Medicale Unifiee (MOPH). ' +
      'Valable avec signature et cachet du medecin.',
    PAGE_WIDTH / 2,
    finalY,
    { align: 'center', maxWidth: CONTENT_WIDTH },
  );

  drawArabicText(
    doc,
    'وثيقة إلكترونية — مستشفى LAU — مطابقة للوصفة الطبية الموحدة (وزارة الصحة العامة)',
    PAGE_WIDTH / 2,
    finalY + 5,
    { fontSize: 5.5, align: 'center', maxWidth: CONTENT_WIDTH },
  );

  setLatinFont(doc, 'normal', 5.5);
  doc.text(
    `LAU Medical Center • Rizk Hospital • ${serialNumber} • ${formatLebaneseDate(issuedAt)}`,
    PAGE_WIDTH / 2,
    doc.internal.pageSize.getHeight() - 6,
    { align: 'center' },
  );

  return doc.output('blob');
};

export const getPrescriptionPdfFilename = (patientId: string) =>
  `Ordonnance-Medicale-Unifiee-${patientId}.pdf`;

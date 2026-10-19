import { SOAPDocumentData } from '../components/SOAPDocumentForm';
import { ClinicalDocument } from '../types';

export const SOAP_DOCUMENT_DESCRIPTION = 'SOAP Document';

const getTagValue = (content: string, tag: string) => {
  const match = content.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match?.[1]?.trim() || '';
};

const stripNestedTags = (value: string) => value.replace(/<[^>]+>/g, '').trim();

export const isSoapXmlContent = (content: string) => content.includes('<SOAPNote>');

export const isSoapDocument = (doc: ClinicalDocument) =>
  doc.description === SOAP_DOCUMENT_DESCRIPTION ||
  doc.description.startsWith('SOAP Note') ||
  doc.description.startsWith('SOAP Document') ||
  isSoapXmlContent(doc.xmlContent);

export const resolveSoapDocumentGroupId = (doc: ClinicalDocument) =>
  doc.documentGroupId || doc.soapDocumentGroupId || doc.id;

export const getSoapDocumentVersion = (doc: ClinicalDocument) => doc.version || 1;

export const getSoapDocumentsInGroup = (documents: ClinicalDocument[], groupId: string) =>
  documents.filter((doc) => isSoapDocument(doc) && resolveSoapDocumentGroupId(doc) === groupId);

export const getNextSoapDocumentVersion = (documents: ClinicalDocument[], sourceDoc: ClinicalDocument) => {
  const groupId = resolveSoapDocumentGroupId(sourceDoc);
  const inGroup = getSoapDocumentsInGroup(documents, groupId);
  const maxVersion = inGroup.reduce((max, item) => Math.max(max, getSoapDocumentVersion(item)), 0);
  return maxVersion + 1;
};

export const formatSoapDocumentDescription = (version?: number) =>
  version && version > 1 ? `${SOAP_DOCUMENT_DESCRIPTION} (v${version})` : SOAP_DOCUMENT_DESCRIPTION;

export {
  getDocumentVersion,
  getNextDocumentVersion,
  isLatestVersionedDocument as isLatestSoapDocumentVersion,
  organizeDocumentsForDisplay,
  resolveDocumentGroupId,
} from './versionedClinicalDocuments';

export const buildSoapDocumentXml = (data: SOAPDocumentData): string => {
  const complaintsXml = data.complaints.length
    ? data.complaints.map((c) => `    <Complaint>${c}</Complaint>`).join('\n')
    : '    <Complaint>N/A</Complaint>';

  const icdXml = data.icdDiagnoses.length
    ? data.icdDiagnoses
        .map(
          (d) => `  <ICD10>
    <Code>${d.code}</Code>
    <Description>${d.description}</Description>
  </ICD10>`,
        )
        .join('\n')
    : `  <ICD10>
    <Code></Code>
    <Description></Description>
  </ICD10>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<SOAPNote>
  <PurposeOfVisit>${data.purposeOfVisit}</PurposeOfVisit>
  <Complaints>
${complaintsXml}
  </Complaints>
  <Subjective>${data.subjective || 'N/A'}</Subjective>
  <Objective>${data.objective || 'N/A'}</Objective>
  <Assessment>${data.assessment || 'N/A'}</Assessment>
  <Plan>${data.plan || 'N/A'}</Plan>
${icdXml}
</SOAPNote>`;
};

export const parseSoapDocumentXml = (content: string): SOAPDocumentData => {
  const complaints = [...content.matchAll(/<Complaint>([\s\S]*?)<\/Complaint>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  let assessment = getTagValue(content, 'Assessment');
  if (!assessment || assessment.includes('<')) {
    assessment = getTagValue(content, 'Diagnosis') || stripNestedTags(assessment);
  }

  let plan = getTagValue(content, 'Plan') || getTagValue(content, 'Treatment');
  if (!plan || plan.includes('<')) {
    plan = getTagValue(content, 'Medication') || stripNestedTags(plan);
  }

  const icdBlocks = [...content.matchAll(/<ICD10>([\s\S]*?)<\/ICD10>/g)];
  const icdDiagnoses = icdBlocks
    .map((match) => ({
      code: getTagValue(match[1], 'Code'),
      description: getTagValue(match[1], 'Description'),
    }))
    .filter((d) => d.code || d.description);

  // Legacy single Code/Description outside repeated blocks (already covered by ICD10 blocks)
  if (icdDiagnoses.length === 0) {
    const code = getTagValue(content, 'Code');
    const description = getTagValue(content, 'Description');
    if (code || description) {
      icdDiagnoses.push({ code, description });
    }
  }

  return {
    purposeOfVisit:
      getTagValue(content, 'PurposeOfVisit') ||
      getTagValue(content, 'ChiefComplaint') ||
      stripNestedTags(getTagValue(content, 'History')),
    complaints,
    subjective: getTagValue(content, 'Subjective') || getTagValue(content, 'History'),
    objective: getTagValue(content, 'Objective') || getTagValue(content, 'Vitals'),
    assessment,
    plan,
    icdDiagnoses,
  };
};

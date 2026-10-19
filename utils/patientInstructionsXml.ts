import { PatientInstructionsData } from '../components/PatientInstructionsForm';
import { ClinicalDocument } from '../types';

export const PATIENT_INSTRUCTIONS_DESCRIPTION = 'Patient Instructions';

export const isPatientInstructionsXmlContent = (content: string) =>
  content.includes('<PatientInstructions>');

export const isPatientInstructionsDocument = (doc: ClinicalDocument) =>
  doc.description === PATIENT_INSTRUCTIONS_DESCRIPTION ||
  doc.description.startsWith('Patient Instructions') ||
  isPatientInstructionsXmlContent(doc.xmlContent);

export const formatPatientInstructionsDescription = (version?: number) =>
  version && version > 1
    ? `${PATIENT_INSTRUCTIONS_DESCRIPTION} (v${version})`
    : PATIENT_INSTRUCTIONS_DESCRIPTION;

const wrapCdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export const buildPatientInstructionsXml = (data: PatientInstructionsData): string => {
  const blocksXml = data.blocks.length
    ? data.blocks
        .map(
          (block, index) => `  <Block index="${index + 1}">
    <Title>${block.title.trim() || `Section ${index + 1}`}</Title>
    <Content>${wrapCdata(block.content)}</Content>
  </Block>`,
        )
        .join('\n')
    : `  <Block index="1">
    <Title>Section 1</Title>
    <Content>${wrapCdata('')}</Content>
  </Block>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<PatientInstructions>
${blocksXml}
</PatientInstructions>`;
};

const getTagValue = (content: string, tag: string) => {
  const match = content.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match?.[1]?.trim() || '';
};

const parseCdataContent = (raw: string) => {
  const cdataMatch = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) return cdataMatch[1];
  return raw.replace(/<[^>]+>/g, '').trim();
};

export const parsePatientInstructionsXml = (content: string): PatientInstructionsData => {
  const blocks = [...content.matchAll(/<Block[^>]*>([\s\S]*?)<\/Block>/g)].map((match, index) => ({
    id: `block-${index + 1}`,
    title: getTagValue(match[1], 'Title') || `Section ${index + 1}`,
    content: parseCdataContent(getTagValue(match[1], 'Content')),
  }));

  return {
    blocks: blocks.length ? blocks : [{ id: 'block-1', title: 'Section 1', content: '' }],
  };
};

import { ClinicalDocument } from '../types';
import { isPatientInstructionsDocument } from './patientInstructionsXml';
import { isSoapDocument } from './soapDocumentXml';

export type VersionedDocumentKind = 'soap' | 'patient-instructions';

export const resolveDocumentGroupId = (doc: ClinicalDocument) =>
  doc.documentGroupId || doc.soapDocumentGroupId || doc.id;

export const getDocumentVersion = (doc: ClinicalDocument) => doc.version || 1;

export const getVersionedDocumentKind = (doc: ClinicalDocument): VersionedDocumentKind | null => {
  if (isSoapDocument(doc)) return 'soap';
  if (isPatientInstructionsDocument(doc)) return 'patient-instructions';
  return null;
};

export const isVersionedClinicalDocument = (doc: ClinicalDocument) =>
  !!getVersionedDocumentKind(doc);

export const getDocumentsInVersionGroup = (
  documents: ClinicalDocument[],
  kind: VersionedDocumentKind,
  groupId: string,
) =>
  documents.filter(
    (doc) => getVersionedDocumentKind(doc) === kind && resolveDocumentGroupId(doc) === groupId,
  );

export const isLatestVersionedDocument = (doc: ClinicalDocument, documents: ClinicalDocument[]) => {
  const kind = getVersionedDocumentKind(doc);
  if (!kind) return true;
  const groupId = resolveDocumentGroupId(doc);
  const inGroup = getDocumentsInVersionGroup(documents, kind, groupId);
  const maxVersion = inGroup.reduce((max, item) => Math.max(max, getDocumentVersion(item)), 0);
  return getDocumentVersion(doc) === maxVersion;
};

export const getNextDocumentVersion = (documents: ClinicalDocument[], sourceDoc: ClinicalDocument) => {
  const kind = getVersionedDocumentKind(sourceDoc);
  if (!kind) return 1;
  const groupId = resolveDocumentGroupId(sourceDoc);
  const inGroup = getDocumentsInVersionGroup(documents, kind, groupId);
  const maxVersion = inGroup.reduce((max, item) => Math.max(max, getDocumentVersion(item)), 0);
  return maxVersion + 1;
};

export interface VersionedDocumentGroupDisplay {
  type: 'versioned-group';
  kind: VersionedDocumentKind;
  groupId: string;
  latest: ClinicalDocument;
  previousVersions: ClinicalDocument[];
}

export interface SingleDocumentDisplay {
  type: 'document';
  doc: ClinicalDocument;
}

export type DocumentDisplayItem = VersionedDocumentGroupDisplay | SingleDocumentDisplay;

const versionedGroupKey = (kind: VersionedDocumentKind, groupId: string) => `${kind}::${groupId}`;

export const organizeDocumentsForDisplay = (documents: ClinicalDocument[]): DocumentDisplayItem[] => {
  const result: DocumentDisplayItem[] = [];
  const processedGroups = new Set<string>();

  for (const doc of documents) {
    const kind = getVersionedDocumentKind(doc);
    if (!kind) {
      result.push({ type: 'document', doc });
      continue;
    }

    const groupId = resolveDocumentGroupId(doc);
    const key = versionedGroupKey(kind, groupId);
    if (processedGroups.has(key)) continue;
    processedGroups.add(key);

    const groupDocs = getDocumentsInVersionGroup(documents, kind, groupId);
    const sorted = [...groupDocs].sort(
      (a, b) => getDocumentVersion(b) - getDocumentVersion(a),
    );
    const [latest, ...previousVersions] = sorted;
    result.push({ type: 'versioned-group', kind, groupId, latest, previousVersions });
  }

  return result;
};

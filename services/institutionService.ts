import { sapAuthService, SapInstitution } from './sapAuthService';

const getRecordList = (payload: unknown): Array<Record<string, unknown>> => {
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as {
    d?: { results?: unknown } | unknown[];
    value?: unknown;
  };
  const results = Array.isArray(data.d) ? data.d : data.d?.results;
  const records = results || data.value;
  return Array.isArray(records)
    ? records.filter((record): record is Record<string, unknown> => !!record && typeof record === 'object')
    : [];
};

const findField = (
  record: Record<string, unknown>,
  names: string[],
): { key: string; value: string } | undefined => {
  const match = Object.keys(record).find((key) => names.includes(key.toLowerCase()));
  if (!match || record[match] === null || record[match] === undefined) return undefined;
  const value = String(record[match]).trim();
  return value ? { key: match, value } : undefined;
};

const normalizeInstitution = (record: Record<string, unknown>, index: number): SapInstitution => {
  const id = findField(record, ['einri'])?.value || `institution-${index + 1}`;
  const name = findField(record, ['einbz'])?.value || id;
  return { id, name, details: [] };
};

export const institutionService = {
  async fetchForUser(userId: string): Promise<SapInstitution[]> {
    const session = sapAuthService.getSession();
    if (!session) throw new Error('Your SAP session has expired. Please sign in again.');

    if (session.isDemo) {
      return [{ id: 'DEMO', name: 'Physician Portal Medical Center', details: [] }];
    }

    const escapedUserId = userId.replace(/'/g, "''").trim().toUpperCase();
    const filter = encodeURIComponent(`Userid eq '${escapedUserId}'`);
    const response = await sapAuthService.fetchOData(
      `PhysInstListSet?$filter=${filter}&$format=json&sap-client=${session.sapClient || '110'}`,
    );

    if (!response.ok) {
      throw new Error(`Unable to load institutions from SAP (HTTP ${response.status}).`);
    }

    const payload = await response.json();
    if (payload && typeof payload === 'object' && 'error' in payload) {
      throw new Error('SAP returned an error while loading your institutions.');
    }

    return getRecordList(payload).map(normalizeInstitution);
  },
};
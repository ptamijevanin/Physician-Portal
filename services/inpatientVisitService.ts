import { sapAuthService } from './sapAuthService';

export interface InpatientVisit {
  id: string;
  patientId: string;
  patientName: string;
  age: string;
  ward: string;
  room: string;
  bed: string;
  diagnosis: string;
  admissionDate: string;
  admissionTime: string;
}

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

const getField = (record: Record<string, unknown>, field: string): string => {
  const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === field.toLowerCase());
  const value = key ? record[key] : undefined;
  return value === null || value === undefined ? '' : String(value).trim();
};

const formatSapDate = (value: string): string => {
  if (!value) return '';

  const compactDate = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactDate) return `${compactDate[1]}-${compactDate[2]}-${compactDate[3]}`;

  const formattedDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (formattedDate) return `${formattedDate[1]}-${formattedDate[2]}-${formattedDate[3]}`;

  const odataDate = value.match(/^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/);
  if (odataDate) {
    const date = new Date(Number(odataDate[1]));
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  return value;
};

const formatSapTime = (value: string): string => {
  const durationTime = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  let hours: number;
  let minutes: string;

  if (durationTime) {
    hours = Number(durationTime[1] || '0');
    minutes = (durationTime[2] || '0').padStart(2, '0');
  } else {
    const colonTime = value.match(/(?:^|T)(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/);
    const compactTime = value.match(/^(\d{2})(\d{2})(\d{2})?$/);
    if (colonTime) {
      hours = Number(colonTime[1]);
      minutes = colonTime[2];
    } else if (compactTime) {
      hours = Number(compactTime[1]);
      minutes = compactTime[2];
    } else {
      return value;
    }
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = String(hours % 12 || 12).padStart(2, '0');
  return `${displayHour}:${minutes} ${period}`;
};

const escapeODataValue = (value: string): string => value.replace(/'/g, "''");

export const inpatientVisitService = {
  async fetchForPhysician(physicianId: string, institutionId: string): Promise<InpatientVisit[]> {
    const session = sapAuthService.getSession();
    if (!session) throw new Error('Your SAP session has expired. Please sign in again.');
    if (!physicianId.trim() || !institutionId.trim()) {
      throw new Error('A physician and institution are required to load inpatient visits.');
    }

    const filter = [
      `Physicianid eq '${escapeODataValue(physicianId.trim())}'`,
      `Einri eq '${escapeODataValue(institutionId.trim())}'`,
    ].join(' and ');
    const response = await sapAuthService.fetchOData(
      `PhysIPVistSet?$filter=${encodeURIComponent(filter)}&$format=json&sap-client=${session.sapClient || '110'}`,
    );

    if (!response.ok) {
      throw new Error(`Unable to load inpatient visits from SAP (HTTP ${response.status}).`);
    }

    const payload: unknown = await response.json();
    if (payload && typeof payload === 'object' && 'error' in payload) {
      throw new Error('SAP returned an error while loading inpatient visits.');
    }

    return getRecordList(payload).map((record, index) => {
      const patientId = getField(record, 'Patnr');
      const admissionDate = formatSapDate(getField(record, 'Admissiondate'));
      const admissionTime = formatSapTime(getField(record, 'Admissiontime'));

      return {
        id: `${patientId}-${admissionDate}-${admissionTime}-${index}`,
        patientId,
        patientName: getField(record, 'PatName'),
        age: getField(record, 'Age'),
        ward: getField(record, 'Ward'),
        room: getField(record, 'Room'),
        bed: getField(record, 'Bed'),
        diagnosis: getField(record, 'OrgDesc'),
        admissionDate,
        admissionTime,
      };
    });
  },
};

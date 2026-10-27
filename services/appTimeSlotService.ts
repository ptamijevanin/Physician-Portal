import { sapAuthService } from './sapAuthService';

export interface AppTimeSlot {
  id: string;
  dateTime: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  age: string;
  status: string;
}

type SapRecord = Record<string, unknown>;

const getRecordList = (payload: unknown): SapRecord[] => {
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as {
    d?: { results?: unknown } | unknown[];
    value?: unknown;
  };
  const results = Array.isArray(data.d) ? data.d : data.d?.results;
  const records = results || data.value;
  return Array.isArray(records)
    ? records.filter((record): record is SapRecord => !!record && typeof record === 'object')
    : [];
};

const getField = (record: SapRecord, field: string): string => {
  const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === field.toLowerCase());
  const value = key ? record[key] : undefined;
  return value === null || value === undefined ? '' : String(value).trim();
};

const getPatientDetails = (record: SapRecord): SapRecord => {
  const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === 'topatdetailsset');
  const details = key ? record[key] : undefined;
  if (!details || typeof details !== 'object') return {};

  const expanded = details as { results?: unknown };
  if (Array.isArray(expanded.results)) {
    const firstRecord = expanded.results.find(
      (item): item is SapRecord => !!item && typeof item === 'object',
    );
    return firstRecord || {};
  }
  if (Array.isArray(details)) {
    const firstRecord = details.find(
      (item): item is SapRecord => !!item && typeof item === 'object',
    );
    return firstRecord || {};
  }
  return details as SapRecord;
};

const formatSapDate = (value: string): string => {
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

export const appTimeSlotService = {
  async fetchForPhysician(physicianId: string, institutionId: string): Promise<AppTimeSlot[]> {
    const session = sapAuthService.getSession();
    if (!session) throw new Error('Your SAP session has expired. Please sign in again.');
    if (!physicianId.trim() || !institutionId.trim()) {
      throw new Error('A physician and institution are required to load upcoming appointments.');
    }

    const filter = [
      `Pernr eq '${escapeODataValue(physicianId.trim())}'`,
      `Einri eq '${escapeODataValue(institutionId.trim())}'`,
    ].join(' and ');
    const response = await sapAuthService.fetchOData(
      `AppTimeSlotSet?$filter=${encodeURIComponent(filter)}&$expand=toPatDetailsSet&$format=json&sap-client=${session.sapClient || '110'}`,
    );

    if (!response.ok) {
      throw new Error(`Unable to load upcoming appointments from SAP (HTTP ${response.status}).`);
    }

    const payload: unknown = await response.json();
    if (payload && typeof payload === 'object' && 'error' in payload) {
      throw new Error('SAP returned an error while loading upcoming appointments.');
    }

    return getRecordList(payload).map((record, index) => {
      const patientDetails = getPatientDetails(record);
      const date = formatSapDate(getField(record, 'Tmndt'));
      const time = formatSapTime(getField(record, 'Tmnzt'));

      return {
        id: `${getField(record, 'Patnr') || getField(patientDetails, 'Patnr')}-${date}-${time}-${index}`,
        dateTime: [date, time].filter(Boolean).join(' '),
        patientId: getField(patientDetails, 'Patnr') || getField(record, 'Patnr'),
        patientName: getField(patientDetails, 'PatName') || getField(record, 'PatName'),
        patientDob: formatSapDate(getField(patientDetails, 'Birthdt') || getField(record, 'Birthdt')),
        patientGender: getField(patientDetails, 'Gender') || getField(record, 'Gender'),
        age: getField(patientDetails, 'Age') || getField(record, 'Age'),
        status: getField(record, 'StatuText') || getField(patientDetails, 'StatuText'),
      };
    });
  },
};

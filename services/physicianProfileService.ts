/**
 * Physician Profile Service
 * Fetches and manages physician data and specialties from SAP OData entities:
 * 1. xSMYxPHYSICIAN_CDS (Physician Data)
 * 2. xSMYxPhysSpecialty (Physician Specialties)
 */

import { sapAuthService, getEffectiveODataEndpoint, SapUserSession } from './sapAuthService';

export interface SapPhysicianData {
  physicianId: string;
  userId: string;
  fullName: string;
  title?: string;
  academicTitle?: string;
  department?: string;
  orgUnit?: string;
  email?: string;
  phone?: string;
  extension?: string;
  room?: string;
  building?: string;
  credentials: string[];
  administrativeRoles: string[];
  raw?: Record<string, unknown>;
}

export interface SapPhysSpecialty {
  specialtyId?: string;
  specialtyName: string;
  description?: string;
  department?: string;
  isPrimary?: boolean;
  raw?: Record<string, unknown>;
}

export interface PhysicianProfileState {
  physician: SapPhysicianData | null;
  specialties: SapPhysSpecialty[];
  isLoading: boolean;
  error: string | null;
  source: 'sap' | 'cached' | 'demo';
  lastUpdated?: string;
}

const PROFILE_STORAGE_KEY = 'sap_physician_profile_data';

/**
 * Case-insensitive property lookup helper
 */
const findProp = (obj: Record<string, unknown>, candidateKeys: string[]): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;

  for (const key of candidateKeys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return String(obj[key]).trim();
    }
  }

  const objKeys = Object.keys(obj);
  for (const key of candidateKeys) {
    const lowerKey = key.toLowerCase();
    const matched = objKeys.find((k) => k.toLowerCase() === lowerKey);
    if (matched && obj[matched] !== undefined && obj[matched] !== null && String(obj[matched]).trim() !== '') {
      return String(obj[matched]).trim();
    }
  }

  return undefined;
};

class PhysicianProfileService {
  private profileState: PhysicianProfileState = {
    physician: null,
    specialties: [],
    isLoading: false,
    error: null,
    source: 'demo',
  };

  private listeners: Array<(state: PhysicianProfileState) => void> = [];

  constructor() {
    this.restoreProfile();
  }

  public subscribe(listener: (state: PhysicianProfileState) => void): () => void {
    this.listeners.push(listener);
    listener(this.profileState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.profileState);
    }
  }

  public getProfile(): PhysicianProfileState {
    return this.profileState;
  }

  private restoreProfile(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.profileState = {
          ...parsed,
          isLoading: false,
        };
      }
    } catch (e) {
      console.warn('Failed to restore physician profile from storage', e);
    }
  }

  private saveProfile(state: PhysicianProfileState): void {
    this.profileState = state;
    this.notify();
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save physician profile to storage', e);
    }
  }

  public clearProfile(): void {
    this.profileState = {
      physician: null,
      specialties: [],
      isLoading: false,
      error: null,
      source: 'demo',
    };
    this.notify();
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove physician profile from storage', e);
    }
  }

  /**
   * Fetches physician and specialty data from SAP OData entities based on logged-in user
   */
  public async fetchProfile(forcedUsername?: string): Promise<PhysicianProfileState> {
    const session = sapAuthService.getSession();
    // SAP stores all user IDs (BNAME) in uppercase. Normalise here so every
    // $filter value matches what is stored in the SAP system.
    const username = (forcedUsername || session?.username || '').trim().toUpperCase();

    if (!session || session.isDemo) {
      console.log('[PhysicianProfile] Demo mode or unauthenticated; applying demo profile.');
      const demoState: PhysicianProfileState = {
        physician: {
          physicianId: 'DEMO-001',
          userId: username || 'DEMO_USER',
          fullName: session?.displayName || 'Dr. Sarah Connor',
          title: 'Chief of Cardiology',
          academicTitle: 'MD, FACC',
          department: 'Cardiology Division',
          orgUnit: 'Cardiovascular Care',
          email: 's.connor@physicianportal.md',
          phone: '+1 (555) 902-3412',
          extension: 'Ext: 3412',
          room: 'Suite 402',
          building: 'Tower A',
          credentials: [
            'MD, Harvard Medical School - Fellowship in Structural Heart Disease',
            'Board Certified in Cardiovascular Disease and Interventional Cardiology',
          ],
          administrativeRoles: [
            'Head of Cardiovascular Surgical Planning Committee',
            'Director of Physician Portal Cardiology Residency Program',
          ],
        },
        specialties: [
          {
            specialtyId: 'CARD-01',
            specialtyName: 'Interventional Cardiology',
            description: 'Percutaneous coronary intervention and structural heart procedures',
            department: 'Cardiology',
            isPrimary: true,
          },
          {
            specialtyId: 'CARD-02',
            specialtyName: 'Cardiovascular Disease',
            description: 'Comprehensive diagnostic and preventive cardiovascular care',
            department: 'Cardiology',
            isPrimary: false,
          },
        ],
        isLoading: false,
        error: null,
        source: 'demo',
        lastUpdated: new Date().toISOString(),
      };

      this.saveProfile(demoState);
      return demoState;
    }

    this.profileState.isLoading = true;
    this.profileState.error = null;
    this.notify();

    const baseEndpoint = getEffectiveODataEndpoint();
    const sapClient = session.sapClient || '110';
    // Explicitly pass 'GET' so X-CSRF-Token is NEVER included in read-only entity queries.
    // SAP NetWeaver rejects GET requests that carry a token value with 403 CSRF validation failed.
    const authHeaders = sapAuthService.getAuthHeaders('GET');

    console.log(`[PhysicianProfile] Fetching profile from SAP (Client: ${sapClient}) for user: "${username}"`);

    try {
      // =========================================================================
      // STEP 1: Query xSMYxPHYSICIAN_CDS by passing the logged-in UserId
      // =========================================================================
      console.log(`[PhysicianProfile] Step 1: Passing UserId "${username}" to xSMYxPHYSICIAN_CDS`);

      // Try filtered query by UserId / Bname first, then fallback to full entity set
      const physicianCandidateUrls = [
        `${baseEndpoint}xSMYxPHYSICIAN_CDS?$filter=UserId eq '${encodeURIComponent(username)}'&$format=json&sap-client=${sapClient}`,
        //`${baseEndpoint}xSMYxPHYSICIAN_CDS?$filter=Bname eq '${encodeURIComponent(username)}'&$format=json&sap-client=${sapClient}`,
        //`${baseEndpoint}xSMYxPHYSICIAN_CDS?$filter=User eq '${encodeURIComponent(username)}'&$format=json&sap-client=${sapClient}`,
        //`${baseEndpoint}xSMYxPHYSICIAN_CDS?$format=json&sap-client=${sapClient}`,
      ];

      let physicianList: Array<Record<string, unknown>> = [];
      for (const pUrl of physicianCandidateUrls) {
        try {
          const resp = await fetch(pUrl, {
            method: 'GET',
            headers: {
              ...authHeaders,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            },
            credentials: 'include',
          });

          if (resp.ok) {
            const data = await resp.json();
            const list = data?.d?.results || data?.value || (Array.isArray(data?.d) ? data.d : []);
            if (Array.isArray(list) && list.length > 0) {
              physicianList = list;
              console.log(`[PhysicianProfile] Step 1 success from ${pUrl} (returned ${list.length} records)`);
              break;
            }
          }
        } catch (e) {
          console.warn(`[PhysicianProfile] Step 1 query attempt failed: ${pUrl}`, e);
        }
      }

      // Match the specific physician record corresponding to the UserId
      let matchedPhysicianRecord: Record<string, unknown> | null = null;

      if (physicianList.length === 1) {
        matchedPhysicianRecord = physicianList[0];
      } else if (physicianList.length > 1) {
        matchedPhysicianRecord = physicianList.find((rec) => {
          const recordUser = findProp(rec, [
            'userid',
            'user_id',
            'bname',
            'username',
            'user',
            'sapuser',
            'logonid',
            'pernr',
          ]);
          return recordUser && recordUser.toLowerCase() === username.toLowerCase();
        }) || null;

        // If not matched by exact user ID, fallback to physician/doctor identifier or name match
        if (!matchedPhysicianRecord) {
          matchedPhysicianRecord = physicianList.find((rec) => {
            const physId = findProp(rec, ['physician', 'physicianid', 'doctorid', 'id']);
            return physId && physId.toLowerCase() === username.toLowerCase();
          }) || physicianList.find((rec) => {
            const name = findProp(rec, ['name', 'fullname', 'physicianname', 'doctorname']);
            return name && name.toLowerCase().includes(username.toLowerCase());
          }) || physicianList[0];
        }
      }

      // =========================================================================
      // STEP 2: Extract the Physician ID from the matched Physician Data record
      // =========================================================================
      let rawPhysicianId = username;

      if (matchedPhysicianRecord) {
        rawPhysicianId = findProp(matchedPhysicianRecord, [
          'physicianid',
          'physician_id',
          'physician',
          'doctorid',
          'doctor_id',
          'id',
          'pernr',
        ]) || username;
      }

      // SAP physician / doctor IDs are stored in uppercase — normalise before
      // using as a $filter value in xSMYxPhysSpecialty.
      const extractedPhysicianId = rawPhysicianId.toUpperCase();

      console.log(`[PhysicianProfile] Step 2: Extracted Physician ID "${extractedPhysicianId}" from UserId "${username}"`);

      // =========================================================================
      // STEP 3: Pass Physician ID to xSMYxPhysSpecialty to get specialties
      // =========================================================================
      console.log(`[PhysicianProfile] Step 3: Passing Physician ID "${extractedPhysicianId}" to xSMYxPhysSpecialty`);

      const specialtyCandidateUrls = [
        `${baseEndpoint}xSMYxPhysSpecialty?$filter=Pernr eq '${encodeURIComponent(extractedPhysicianId)}'&$format=json&sap-client=${sapClient}`,
        //`${baseEndpoint}xSMYxPhysSpecialty?$filter=Physician eq '${encodeURIComponent(extractedPhysicianId)}'&$format=json&sap-client=${sapClient}`,
        //`${baseEndpoint}xSMYxPhysSpecialty?$filter=DoctorId eq '${encodeURIComponent(extractedPhysicianId)}'&$format=json&sap-client=${sapClient}`,
        //`${baseEndpoint}xSMYxPhysSpecialty?$format=json&sap-client=${sapClient}`,
      ];

      let specialtyList: Array<Record<string, unknown>> = [];
      for (const sUrl of specialtyCandidateUrls) {
        try {
          const resp = await fetch(sUrl, {
            method: 'GET',
            headers: {
              ...authHeaders,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            },
            credentials: 'include',
          });

          if (resp.ok) {
            const data = await resp.json();
            const list = data?.d?.results || data?.value || (Array.isArray(data?.d) ? data.d : []);
            if (Array.isArray(list) && list.length > 0) {
              specialtyList = list;
              console.log(`[PhysicianProfile] Step 3 success from ${sUrl} (returned ${list.length} records)`);
              break;
            }
          }
        } catch (e) {
          console.warn(`[PhysicianProfile] Step 3 query attempt failed: ${sUrl}`, e);
        }
      }

      // Map matched physician
      let mappedPhysician: SapPhysicianData | null = null;

      if (matchedPhysicianRecord) {
        const raw = matchedPhysicianRecord;

        const physicianId = findProp(raw, ['physician', 'physicianid', 'doctorid', 'id', 'pernr']) || username;
        const userId = findProp(raw, ['bname', 'userid', 'user_id', 'username', 'user']) || username;

        // Construct full name
        const rawName = findProp(raw, ['fullname', 'physicianname', 'doctorname', 'name', 'nametext']);
        const firstName = findProp(raw, ['firstname', 'first_name', 'vorna']);
        const lastName = findProp(raw, ['lastname', 'last_name', 'nachn']);
        const title = findProp(raw, ['title', 'academic_title', 'role', 'position', 'description']);

        let fullName = rawName;
        if (!fullName && (firstName || lastName)) {
          fullName = `${firstName || ''} ${lastName || ''}`.trim();
        }
        if (!fullName) {
          fullName = session.displayName || `Dr. ${username}`;
        }
        if (!fullName.toLowerCase().startsWith('dr')) {
          fullName = `Dr. ${fullName}`;
        }

        const email = findProp(raw, ['email', 'mail', 'smtp_addr', 'emailaddress']);
        const phone = findProp(raw, ['phone', 'telephone', 'telnr', 'mobile', 'cellphone']);
        const extension = findProp(raw, ['extension', 'ext', 'phoneext', 'telext', 'telExtension']);
        const department = findProp(raw, ['department', 'dept', 'orgunit', 'org_unit', 'division', 'hospital', 'ward']);
        const building = findProp(raw, ['building', 'bldg', 'location', 'site']);
        const room = findProp(raw, ['room', 'roomno', 'office']);

        // Gather qualifications or credentials from properties
        const credentialsList: string[] = [];
        const rawCred = findProp(raw, ['credentials', 'qualification', 'qualifications', 'degree', 'education', 'certifications']);
        if (rawCred) {
          credentialsList.push(rawCred);
        } else {
          credentialsList.push('Board Certified Physician - Hospital Medical Staff');
          if (department) credentialsList.push(`Specialized Clinical Staff - ${department}`);
        }

        // Gather administrative roles
        const adminRolesList: string[] = [];
        const rawAdmin = findProp(raw, ['adminrole', 'admin_role', 'role', 'administrative', 'committee']);
        if (rawAdmin) {
          adminRolesList.push(rawAdmin);
        } else if (title) {
          adminRolesList.push(title);
        } else {
          adminRolesList.push('Attending Medical Staff');
        }

        mappedPhysician = {
          physicianId,
          userId,
          fullName,
          title: title || 'Attending Physician',
          academicTitle: findProp(raw, ['academictitle', 'academic_title', 'degree']) || 'MD',
          department: department || 'Clinical Medicine',
          orgUnit: findProp(raw, ['orgunit', 'org_unit', 'ou']) || department,
          email: email || `${username.toLowerCase()}@hospital.org`,
          phone: phone || '+1 (555) 902-3400',
          extension: extension ? (extension.startsWith('Ext') ? extension : `Ext: ${extension}`) : 'Ext: 3400',
          room: room || 'Suite 100',
          building: building || 'Main Hospital Wing',
          credentials: credentialsList,
          administrativeRoles: adminRolesList,
          raw,
        };
      } else {
        // Fallback using session info
        mappedPhysician = {
          physicianId: username,
          userId: username,
          fullName: session.displayName || `Dr. ${username}`,
          title: 'Consultant Physician',
          academicTitle: 'MD',
          department: 'Department of Medicine',
          email: `${username.toLowerCase()}@hospital.org`,
          phone: '+1 (555) 902-3400',
          extension: 'Ext: 3400',
          room: 'Main Clinical Pavilion',
          building: 'Hospital Central',
          credentials: [
            'Certified Medical Practitioner - Active Registry',
            'NetWeaver SAP Clinical System Staff',
          ],
          administrativeRoles: [
            'Hospital Clinical Care Team',
          ],
        };
      }

      // Filter and map specialties
      // Check if specialty records link to this physician
      const physKey = mappedPhysician.physicianId.toLowerCase();
      const userKey = username.toLowerCase();

      let matchedSpecialties = specialtyList.filter((spec) => {
        const specPhys = findProp(spec, ['physician', 'physicianid', 'doctorid', 'userid', 'bname', 'id']);
        if (!specPhys) return true; // if no linking key is present, include
        const lower = specPhys.toLowerCase();
        return lower === physKey || lower === userKey;
      });

      if (matchedSpecialties.length === 0 && specialtyList.length > 0) {
        // If filtering was too strict, take all available specialties from the CDS view
        matchedSpecialties = specialtyList;
      }

      const mappedSpecialties: SapPhysSpecialty[] = matchedSpecialties.map((spec, index) => {
        const specialtyName = findProp(spec, [
          'specialty',
          'specialtyname',
          'specialization',
          'speciality',
          'description',
          'discipline',
          'name',
          'Fatxt'
        ]) || `Specialty #${index + 1}`;

        const description = findProp(spec, [
          'description',
          'specialtydesc',
          'text',
          'details',
          'notes',
        ]) || 'Clinical specialty practice and diagnostic consultations';

        const department = findProp(spec, ['department', 'dept', 'orgunit', 'division']);
        const isPrimary = findProp(spec, ['isprimary', 'primary', 'main']) === 'X' || index === 0;

        return {
          specialtyId: findProp(spec, ['specialtyid', 'id', 'code', 'Fachr']) || `SPEC-${index + 1}`,
          specialtyName,
          description,
          department,
          isPrimary,
          raw: spec,
        };
      });

      const updatedState: PhysicianProfileState = {
        physician: mappedPhysician,
        specialties: mappedSpecialties,
        isLoading: false,
        error: null,
        source: 'sap',
        lastUpdated: new Date().toISOString(),
      };

      this.saveProfile(updatedState);

      // If physician name changed, also update session displayName in sapAuthService
      if (mappedPhysician.fullName && session) {
        session.displayName = mappedPhysician.fullName;
      }

      return updatedState;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[PhysicianProfile] Error fetching physician profile:', err);

      const errorState: PhysicianProfileState = {
        ...this.profileState,
        isLoading: false,
        error: `Could not load physician data from SAP: ${msg}`,
      };

      this.saveProfile(errorState);
      return errorState;
    }
  }
}

export const physicianProfileService = new PhysicianProfileService();

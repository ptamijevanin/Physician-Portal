/**
 * SAP OData Authentication & API Service
 * Handles Basic Authentication, CSRF token management, and session state
 * for SAP NetWeaver OData Service (/SMY/ISH_PHYS_PORTAL_SRV/)
 */

export interface SapUserSession {
  username: string;
  displayName: string;
  basicAuthToken: string;
  csrfToken?: string;
  endpoint: string;
  sapSystem?: string;
  sapClient?: string;
  authenticatedAt: string;
  isDemo?: boolean;
}

export interface SapLoginResult {
  success: boolean;
  user?: SapUserSession;
  error?: string;
  statusCode?: number;
  data?: unknown;
}

const STORAGE_KEY = 'sap_physician_portal_session';

/**
 * Returns the raw endpoint configured in .env (or default)
 */
export const getRawODataEndpoint = (): string => {
  return (
    import.meta.env.VITE_SAP_ODATA_BASE_URL
  );
};

/**
 * Normalizes URL to end with a trailing slash
 */
const ensureTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : `${url}/`;
};

/**
 * Resolves the effective endpoint to use for fetch requests.
 * In browser development mode, if the target is cross-origin,
 * routes through Vite's local `/sap` proxy to bypass browser CORS preflight blocking.
 */
export const getEffectiveODataEndpoint = (): string => {
  const raw = ensureTrailingSlash(getRawODataEndpoint());

  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    try {
      const url = new URL(raw);
      if (url.origin !== window.location.origin) {
        // Use path relative to current domain so Vite dev proxy handles it
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // If not a full URL, return raw
    }
  }

  return raw;
};

/**
 * Safely creates a Basic Auth header supporting UTF-8 characters
 */
export const createBasicAuthHeader = (username: string, password: string): string => {
  const utf8String = unescape(encodeURIComponent(`${username}:${password}`));
  return `Basic ${btoa(utf8String)}`;
};

class SapAuthService {
  private currentSession: SapUserSession | null = null;

  constructor() {
    this.restoreSession();
  }

  /**
   * Restores session from sessionStorage if available
   */
  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to restore SAP session from storage', e);
      this.currentSession = null;
    }
  }

  /**
   * Returns current active session or null
   */
  public getSession(): SapUserSession | null {
    if (!this.currentSession) {
      this.restoreSession();
    }
    return this.currentSession;
  }

  /**
   * Returns whether a user is currently authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getSession();
  }

  /**
   * Logs in against SAP OData service using HTTP Basic Authentication
   *
   * @param username SAP User ID
   * @param password SAP Password
   */
  public async login(username: string, password: string): Promise<SapLoginResult> {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return { success: false, error: 'Please enter your SAP Username.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your SAP Password.' };
    }

    const endpoint = getEffectiveODataEndpoint();
    const rawEndpoint = getRawODataEndpoint();
    const basicAuthHeader = createBasicAuthHeader(trimmedUsername, password);

    try {
      console.log(`[SAP Auth] Sending Basic Auth probe to: ${endpoint}`);
      console.log(`[SAP Auth] User: "${trimmedUsername}"`);

      // Send GET request to service document with Basic Auth.
      // NOTE: credentials must be 'omit' during the authentication check so that ambient
      // browser cookies or cached credentials do NOT bypass the username/password entered.
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': basicAuthHeader,
          'Accept': 'application/json, application/xml, text/plain, */*',
          'X-CSRF-Token': 'Fetch',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        credentials: 'omit',
      });

      console.log(`[SAP Auth] Response Status: ${response.status} (${response.statusText})`);
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      console.log(`[SAP Auth] Response Content-Type: ${contentType}`);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.warn('[SAP Auth] 401 Unauthorized received - credentials rejected.');
        return {
          success: false,
          statusCode: 401,
          error: 'Authentication failed: Invalid SAP username or password.',
        };
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        console.warn('[SAP Auth] 403 Forbidden received.');
        return {
          success: false,
          statusCode: 403,
          error: 'Access Forbidden (403): Your SAP account lacks authorization for this CDS service or is locked.',
        };
      }

      // If status is not 200 or 204
      if (response.status !== 200 && response.status !== 204) {
        return {
          success: false,
          statusCode: response.status,
          error: `SAP Server returned HTTP ${response.status} (${response.statusText || 'Error'}).`,
        };
      }

      // Read response body to verify this is genuinely a valid OData document
      // and NOT an HTML logon error page, form redirect, or SPA fallback
      const bodyText = await response.text();

      // Check if response is an HTML error / logon page or SPA fallback
      const isHtml = contentType.includes('text/html') ||
        bodyText.trim().startsWith('<!DOCTYPE') ||
        bodyText.trim().startsWith('<html') ||
        bodyText.includes('<title>Logon Error Message</title>') ||
        bodyText.includes('Anmeldung fehlgeschlagen') ||
        bodyText.includes('Logon Error Message') ||
        bodyText.includes('name="sap-password"') ||
        bodyText.includes('<title>Physician Portal</title>');

      if (isHtml) {
        console.warn('[SAP Auth] Rejected HTTP 200 because response body is an HTML error/logon page rather than valid OData.');
        return {
          success: false,
          statusCode: 401,
          error: 'Authentication failed: Invalid SAP username or password (SAP returned logon error page).',
        };
      }

      // If JSON, verify it does not contain an OData error payload
      let responseData: unknown = null;
      if (contentType.includes('application/json')) {
        try {
          responseData = JSON.parse(bodyText);
          if (responseData && typeof responseData === 'object' && 'error' in responseData) {
            const errObj = (responseData as { error: { message?: { value?: string } | string } }).error;
            const errMsg = typeof errObj.message === 'string' ? errObj.message : errObj.message?.value || 'SAP OData Error';
            console.warn('[SAP Auth] SAP returned OData JSON error:', errMsg);
            return {
              success: false,
              statusCode: 401,
              error: `Authentication failed: ${errMsg}`,
            };
          }
        } catch {
          console.warn('[SAP Auth] Failed to parse JSON response body');
        }
      } else {
        // XML or other text format
        if (bodyText.includes('<error xmlns="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">')) {
          console.warn('[SAP Auth] SAP returned OData XML error');
          return {
            success: false,
            statusCode: 401,
            error: 'Authentication failed: Invalid SAP credentials.',
          };
        }
        responseData = bodyText;
      }

      // At this point, the response is HTTP 200/204 and verified to NOT be an HTML error page
      const csrfToken = response.headers.get('x-csrf-token') || undefined;
      const sapSystem = response.headers.get('sap-system') || 'LED';

      const formattedName = trimmedUsername.startsWith('DR')
        ? trimmedUsername
        : `Dr. ${trimmedUsername.charAt(0).toUpperCase() + trimmedUsername.slice(1).toLowerCase()}`;

      const session: SapUserSession = {
        username: trimmedUsername,
        displayName: formattedName,
        basicAuthToken: basicAuthHeader,
        csrfToken,
        endpoint: rawEndpoint,
        sapSystem,
        sapClient: '110',
        authenticatedAt: new Date().toISOString(),
        isDemo: false,
      };

      this.currentSession = session;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Unable to persist session to sessionStorage', e);
      }

      console.log('[SAP Auth] Successfully authenticated user:', trimmedUsername);

      return {
        success: true,
        user: session,
        statusCode: response.status,
        data: responseData,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('SAP OData Login Error:', err);

      return {
        success: false,
        error: `Unable to connect to SAP endpoint (${rawEndpoint}). Please verify your network connection or VPN. Details: ${message}`,
      };
    }
  }

  /**
   * Provides demo/fallback login for offline development or testing
   */
  public loginAsDemo(username = 'Dr. Sarah Connor'): SapLoginResult {
    const session: SapUserSession = {
      username: 'DEMO_USER',
      displayName: username,
      basicAuthToken: 'Basic DEMO_TOKEN',
      endpoint: getRawODataEndpoint(),
      sapSystem: 'LED (Demo)',
      sapClient: '110',
      authenticatedAt: new Date().toISOString(),
      isDemo: true,
    };

    this.currentSession = session;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Unable to persist demo session', e);
    }

    return {
      success: true,
      user: session,
    };
  }

  /**
   * Logs out current user and clears session
   */
  public logout(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear session storage', e);
      }
    }
  }

  /**
   * Returns request headers with authentication.
   *
   * NOTE: X-CSRF-Token is ONLY injected for state-changing HTTP methods
   * (POST, PUT, DELETE, PATCH). SAP NetWeaver's ICF security filter will
   * reject GET/HEAD requests that carry a CSRF token value with
   * 403 "CSRF token validation failed" — even if the token was previously
   * issued by the server. Never pass X-CSRF-Token on read-only requests.
   *
   * @param method HTTP method for this request (default: 'GET')
   */
  public getAuthHeaders(method = 'GET'): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (this.currentSession?.basicAuthToken) {
      headers['Authorization'] = this.currentSession.basicAuthToken;
    }

    // Only include CSRF token for state-changing methods.
    // GET and HEAD are read-only; sending a token value causes SAP to reject with 403.
    const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
    if (isWriteMethod && this.currentSession?.csrfToken) {
      headers['X-CSRF-Token'] = this.currentSession.csrfToken;
    }

    return headers;
  }

  /**
   * Helper to make authenticated requests against the SAP CDS service
   */
  public async fetchOData(path = '', options: RequestInit = {}): Promise<Response> {
    const base = getEffectiveODataEndpoint();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = cleanPath ? `${base}${cleanPath}` : base;

    const method = (options.method || 'GET').toUpperCase();
    const headers = {
      ...this.getAuthHeaders(method),
      ...(options.headers as Record<string, string> || {}),
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  }
}

export const sapAuthService = new SapAuthService();

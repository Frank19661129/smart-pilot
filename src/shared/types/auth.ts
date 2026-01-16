/**
 * Authentication Types for Smart Pilot
 *
 * Handles Windows Integrated Authentication and JWT token management
 */

export interface WindowsUser {
  /** Windows username (e.g., 'DOMAIN\\username' or 'username@domain.com') */
  username: string;

  /** Display name from Active Directory */
  displayName?: string;

  /** Email address from Entra ID / Azure AD */
  email?: string;

  /** Domain name (for classic AD) */
  domain?: string;

  /** User Principal Name (for Entra ID) */
  upn?: string;

  /** Security Identifier */
  sid?: string;

  /** Authentication provider type */
  authProvider: 'EntraID' | 'ActiveDirectory' | 'Local';
}

export interface JWTToken {
  /** Access token for API requests */
  accessToken: string;

  /** Refresh token for token renewal */
  refreshToken?: string;

  /** Token type (usually 'Bearer') */
  tokenType: string;

  /** Expiration time in seconds from now */
  expiresIn: number;

  /** Timestamp when token was issued */
  issuedAt: number;

  /** Timestamp when token expires */
  expiresAt: number;

  /** Scopes granted by this token */
  scopes?: string[];
}

export interface AuthResult {
  /** Indicates if authentication was successful */
  success: boolean;

  /** Windows user information */
  user?: WindowsUser;

  /** JWT tokens from IDDI backend */
  tokens?: JWTToken;

  /** Error message if authentication failed */
  error?: string;

  /** Error code for programmatic handling */
  errorCode?: AuthErrorCode;
}

export enum AuthErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  WINDOWS_AUTH_FAILED = 'WINDOWS_AUTH_FAILED',
  BACKEND_UNAVAILABLE = 'BACKEND_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  KERBEROS_ERROR = 'KERBEROS_ERROR',
  NTLM_ERROR = 'NTLM_ERROR',
}

export interface AuthConfig {
  /** IDDI backend base URL */
  backendUrl: string;

  /** Authentication endpoint path */
  authEndpoint: string;

  /** Token refresh endpoint path */
  refreshEndpoint: string;

  /** Enable automatic token refresh */
  autoRefresh: boolean;

  /** Refresh token before expiry (in seconds) */
  refreshBeforeExpiry: number;

  /** Maximum retry attempts for authentication */
  maxRetries: number;

  /** Timeout for authentication requests (ms) */
  timeout: number;

  /** Enable Kerberos authentication */
  enableKerberos: boolean;

  /** Enable NTLM authentication */
  enableNTLM: boolean;
}

export interface SessionInfo {
  /** Indicates if user is authenticated */
  isAuthenticated: boolean;

  /** Current user information */
  user?: WindowsUser;

  /** Remaining token lifetime in seconds */
  tokenExpiresIn?: number;

  /** Session start time */
  sessionStarted?: number;
}

export interface AuthStateChange {
  /** Previous authentication state */
  previousState: 'authenticated' | 'unauthenticated';

  /** New authentication state */
  newState: 'authenticated' | 'unauthenticated';

  /** Reason for state change */
  reason: 'login' | 'logout' | 'token_expired' | 'token_refreshed' | 'error';

  /** Timestamp of state change */
  timestamp: number;
}

export interface TokenRefreshResult {
  /** Indicates if refresh was successful */
  success: boolean;

  /** New JWT tokens */
  tokens?: JWTToken;

  /** Error message if refresh failed */
  error?: string;

  /** Error code for programmatic handling */
  errorCode?: AuthErrorCode;
}

/**
 * Secure storage interface for tokens
 */
export interface SecureStorage {
  /** Store tokens securely */
  setTokens(tokens: JWTToken): Promise<void>;

  /** Retrieve stored tokens */
  getTokens(): Promise<JWTToken | null>;

  /** Remove stored tokens */
  clearTokens(): Promise<void>;

  /** Check if tokens exist */
  hasTokens(): Promise<boolean>;
}

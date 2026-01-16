/**
 * Windows Integrated Authentication Module
 *
 * Handles Windows authentication using SSPI (Kerberos/NTLM)
 * Supports both Entra ID (Azure AD) and classic Active Directory
 */

// TODO: Install node-sspi for Windows auth
// import * as sspi from 'node-sspi';
const sspi: any = { Client: class {} }; // Stub for build
import axios, { AxiosError } from 'axios';
import log from 'electron-log';
import {
  WindowsUser,
  AuthResult,
  AuthErrorCode,
  JWTToken,
  AuthConfig,
} from '../../shared/types/auth';

export class WindowsAuthenticator {
  private config: AuthConfig;
  private sspiClient: any;

  constructor(config: AuthConfig) {
    this.config = config;
    this.initializeSSPI();
  }

  /**
   * Initialize SSPI client for Windows authentication
   */
  private initializeSSPI(): void {
    try {
      // Initialize SSPI with Kerberos and NTLM support
      const packageNames: string[] = [];
      if (this.config.enableKerberos) packageNames.push('Kerberos');
      if (this.config.enableNTLM) packageNames.push('Negotiate');

      this.sspiClient = new sspi.Client(packageNames[0] || 'Negotiate');
      log.info('SSPI client initialized successfully');
    } catch (error) {
      log.error('Failed to initialize SSPI client:', error);
      throw error;
    }
  }

  /**
   * Get current Windows user information
   */
  async getCurrentWindowsUser(): Promise<WindowsUser | null> {
    try {
      // Get Windows user credentials using SSPI
      const credentials = this.sspiClient.getCurrentUser();

      if (!credentials) {
        log.error('Failed to get Windows user credentials');
        return null;
      }

      // Parse username to determine domain and UPN
      const username = credentials.name || credentials.userName || '';
      const parts = username.split('\\');
      const upnParts = username.split('@');

      let domain: string | undefined;
      let userPart: string;
      let upn: string | undefined;
      let authProvider: 'EntraID' | 'ActiveDirectory' | 'Local';

      if (upnParts.length === 2) {
        // UPN format (user@domain.com) - likely Entra ID
        userPart = upnParts[0];
        upn = username;
        domain = upnParts[1];
        authProvider = 'EntraID';
      } else if (parts.length === 2) {
        // Domain\username format - classic AD
        domain = parts[0];
        userPart = parts[1];
        authProvider = 'ActiveDirectory';
      } else {
        // Local user
        userPart = username;
        authProvider = 'Local';
      }

      const windowsUser: WindowsUser = {
        username,
        displayName: credentials.displayName,
        email: upn,
        domain,
        upn,
        sid: credentials.sid,
        authProvider,
      };

      log.info('Windows user retrieved:', {
        username: windowsUser.username,
        authProvider: windowsUser.authProvider,
      });

      return windowsUser;
    } catch (error) {
      log.error('Error getting Windows user:', error);
      return null;
    }
  }

  /**
   * Authenticate with Windows credentials and exchange for JWT token
   */
  async authenticateWithWindowsUser(): Promise<AuthResult> {
    try {
      log.info('Starting Windows authentication...');

      // Step 1: Get current Windows user
      const windowsUser = await this.getCurrentWindowsUser();
      if (!windowsUser) {
        return {
          success: false,
          error: 'Failed to retrieve Windows user credentials',
          errorCode: AuthErrorCode.WINDOWS_AUTH_FAILED,
        };
      }

      // Step 2: Generate SSPI token
      const sspiToken = await this.generateSSPIToken();
      if (!sspiToken) {
        return {
          success: false,
          error: 'Failed to generate SSPI authentication token',
          errorCode: AuthErrorCode.WINDOWS_AUTH_FAILED,
        };
      }

      // Step 3: Exchange SSPI token for JWT from IDDI backend
      const jwtTokens = await this.exchangeTokenWithBackend(sspiToken, windowsUser);
      if (!jwtTokens) {
        return {
          success: false,
          error: 'Failed to exchange Windows credentials for JWT token',
          errorCode: AuthErrorCode.BACKEND_UNAVAILABLE,
        };
      }

      log.info('Windows authentication successful');

      return {
        success: true,
        user: windowsUser,
        tokens: jwtTokens,
      };
    } catch (error) {
      log.error('Windows authentication failed:', error);

      let errorCode = AuthErrorCode.UNKNOWN_ERROR;
      if (error instanceof Error) {
        if (error.message.includes('Kerberos')) {
          errorCode = AuthErrorCode.KERBEROS_ERROR;
        } else if (error.message.includes('NTLM')) {
          errorCode = AuthErrorCode.NTLM_ERROR;
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
        errorCode,
      };
    }
  }

  /**
   * Generate SSPI authentication token
   */
  private async generateSSPIToken(): Promise<string | null> {
    try {
      // Get SSPI token for current user
      const clientContextHandle = this.sspiClient.getClientContextHandle();
      const securityToken = this.sspiClient.getSecurityToken(clientContextHandle);

      if (!securityToken) {
        log.error('Failed to generate SSPI token');
        return null;
      }

      // Convert to base64 for transmission
      const base64Token = Buffer.from(securityToken).toString('base64');
      log.info('SSPI token generated successfully');

      return base64Token;
    } catch (error) {
      log.error('Error generating SSPI token:', error);
      return null;
    }
  }

  /**
   * Exchange SSPI token with IDDI backend for JWT
   */
  private async exchangeTokenWithBackend(
    sspiToken: string,
    windowsUser: WindowsUser
  ): Promise<JWTToken | null> {
    const url = `${this.config.backendUrl}${this.config.authEndpoint}`;
    let retryCount = 0;

    while (retryCount < this.config.maxRetries) {
      try {
        log.info(`Attempting token exchange with backend (attempt ${retryCount + 1})`);

        const response = await axios.post(
          url,
          {
            grant_type: 'windows_auth',
            windows_token: sspiToken,
            username: windowsUser.username,
            upn: windowsUser.upn,
            domain: windowsUser.domain,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Negotiate ${sspiToken}`,
            },
            timeout: this.config.timeout,
          }
        );

        if (response.status === 200 && response.data) {
          const data = response.data;
          const issuedAt = Date.now();
          const expiresIn = data.expires_in || 1800; // Default 30 minutes

          const jwtToken: JWTToken = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            tokenType: data.token_type || 'Bearer',
            expiresIn,
            issuedAt,
            expiresAt: issuedAt + expiresIn * 1000,
            scopes: data.scope ? data.scope.split(' ') : [],
          };

          log.info('JWT token received from backend');
          return jwtToken;
        }

        log.warn('Unexpected response from backend:', response.status);
        return null;
      } catch (error) {
        retryCount++;
        log.error(`Token exchange failed (attempt ${retryCount}):`, error);

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            log.error('Authentication failed - invalid credentials');
            return null; // Don't retry on 401
          }
        }

        if (retryCount < this.config.maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          log.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    log.error('Token exchange failed after max retries');
    return null;
  }

  /**
   * Test Windows authentication capabilities
   */
  async testAuthentication(): Promise<{
    canAuthenticate: boolean;
    kerberosAvailable: boolean;
    ntlmAvailable: boolean;
    currentUser?: string;
  }> {
    try {
      const user = await this.getCurrentWindowsUser();
      const packages = sspi.EnumerateSecurityPackages();

      return {
        canAuthenticate: user !== null,
        kerberosAvailable: packages.some((p: any) => p.Name === 'Kerberos'),
        ntlmAvailable: packages.some((p: any) => p.Name === 'NTLM'),
        currentUser: user?.username,
      };
    } catch (error) {
      log.error('Authentication test failed:', error);
      return {
        canAuthenticate: false,
        kerberosAvailable: false,
        ntlmAvailable: false,
      };
    }
  }
}

/**
 * Default configuration for Windows authentication
 */
export const defaultAuthConfig: AuthConfig = {
  backendUrl: 'http://localhost:8000',
  authEndpoint: '/api/v1/auth/windows',
  refreshEndpoint: '/api/v1/auth/refresh',
  autoRefresh: true,
  refreshBeforeExpiry: 300, // 5 minutes
  maxRetries: 3,
  timeout: 10000, // 10 seconds
  enableKerberos: true,
  enableNTLM: true,
};

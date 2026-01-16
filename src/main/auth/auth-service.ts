/**
 * Authentication Service
 *
 * Singleton service managing authentication state, token lifecycle,
 * and session management for Smart Pilot
 */

import Store from 'electron-store';
import axios from 'axios';
import log from 'electron-log';
import { EventEmitter } from 'events';
import {
  WindowsUser,
  JWTToken,
  AuthConfig,
  SessionInfo,
  AuthStateChange,
  TokenRefreshResult,
  AuthErrorCode,
  SecureStorage,
} from '../../shared/types/auth';
import { WindowsAuthenticator, defaultAuthConfig } from './windows-auth';
import { generateMachineSpecificKey } from '../../shared/utils/crypto';

/**
 * Secure token storage using electron-store with encryption
 */
class SecureTokenStorage implements SecureStorage {
  private store: Store;

  constructor() {
    // Generate machine-specific encryption key for secure token storage
    const encryptionKey = generateMachineSpecificKey();
    log.info('Initialized secure token storage with machine-specific encryption');

    this.store = new Store({
      name: 'auth-tokens',
      encryptionKey,
    });
  }

  async setTokens(tokens: JWTToken): Promise<void> {
    this.store.set('tokens', tokens);
    log.info('Tokens stored securely');
  }

  async getTokens(): Promise<JWTToken | null> {
    const tokens = this.store.get('tokens') as JWTToken | undefined;
    return tokens || null;
  }

  async clearTokens(): Promise<void> {
    this.store.delete('tokens');
    log.info('Tokens cleared from storage');
  }

  async hasTokens(): Promise<boolean> {
    return this.store.has('tokens');
  }
}

/**
 * Authentication Service - Singleton Pattern
 */
export class AuthService extends EventEmitter {
  private static instance: AuthService | null = null;

  private config: AuthConfig;
  private authenticator: WindowsAuthenticator;
  private storage: SecureStorage;
  private currentUser: WindowsUser | null = null;
  private currentTokens: JWTToken | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  private constructor(config: AuthConfig = defaultAuthConfig) {
    super();
    this.config = config;
    this.authenticator = new WindowsAuthenticator(config);
    this.storage = new SecureTokenStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: AuthConfig): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(config);
    }
    return AuthService.instance;
  }

  /**
   * Initialize service and restore session if available
   */
  async initialize(): Promise<void> {
    log.info('Initializing AuthService...');

    try {
      // Try to restore tokens from storage
      const storedTokens = await this.storage.getTokens();
      if (storedTokens) {
        // Check if token is still valid
        if (this.isTokenValid(storedTokens)) {
          this.currentTokens = storedTokens;
          log.info('Restored valid tokens from storage');

          // Try to get Windows user
          const user = await this.authenticator.getCurrentWindowsUser();
          if (user) {
            this.currentUser = user;
            this.scheduleTokenRefresh();
            this.emitStateChange('unauthenticated', 'authenticated', 'login');
          }
        } else {
          log.info('Stored tokens expired, clearing...');
          await this.storage.clearTokens();
        }
      }
    } catch (error) {
      log.error('Error initializing AuthService:', error);
    }
  }

  /**
   * Perform Windows authentication
   */
  async login(): Promise<{ success: boolean; error?: string }> {
    log.info('Performing Windows authentication...');

    try {
      const result = await this.authenticator.authenticateWithWindowsUser();

      if (result.success && result.user && result.tokens) {
        this.currentUser = result.user;
        this.currentTokens = result.tokens;

        // Store tokens securely
        await this.storage.setTokens(result.tokens);

        // Schedule automatic refresh
        if (this.config.autoRefresh) {
          this.scheduleTokenRefresh();
        }

        this.emitStateChange('unauthenticated', 'authenticated', 'login');

        log.info('Login successful');
        return { success: true };
      }

      log.error('Login failed:', result.error);
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      log.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    log.info('Logging out...');

    // Cancel refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Clear tokens
    await this.storage.clearTokens();
    this.currentTokens = null;
    this.currentUser = null;

    this.emitStateChange('authenticated', 'unauthenticated', 'logout');

    log.info('Logout complete');
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    if (this.isRefreshing) {
      log.info('Token refresh already in progress');
      return { success: false, error: 'Refresh already in progress' };
    }

    if (!this.currentTokens?.refreshToken) {
      log.error('No refresh token available');
      return {
        success: false,
        error: 'No refresh token available',
        errorCode: AuthErrorCode.TOKEN_EXPIRED,
      };
    }

    this.isRefreshing = true;

    try {
      log.info('Refreshing access token...');

      const response = await axios.post(
        `${this.config.backendUrl}${this.config.refreshEndpoint}`,
        {
          grant_type: 'refresh_token',
          refresh_token: this.currentTokens.refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout,
        }
      );

      if (response.status === 200 && response.data) {
        const data = response.data;
        const issuedAt = Date.now();
        const expiresIn = data.expires_in || 1800;

        const newTokens: JWTToken = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || this.currentTokens.refreshToken,
          tokenType: data.token_type || 'Bearer',
          expiresIn,
          issuedAt,
          expiresAt: issuedAt + expiresIn * 1000,
          scopes: data.scope ? data.scope.split(' ') : [],
        };

        this.currentTokens = newTokens;
        await this.storage.setTokens(newTokens);

        // Schedule next refresh
        this.scheduleTokenRefresh();

        this.emitStateChange('authenticated', 'authenticated', 'token_refreshed');

        log.info('Token refresh successful');
        return { success: true, tokens: newTokens };
      }

      log.error('Token refresh failed: unexpected response');
      return {
        success: false,
        error: 'Unexpected response from server',
        errorCode: AuthErrorCode.TOKEN_REFRESH_FAILED,
      };
    } catch (error) {
      log.error('Token refresh error:', error);

      // If refresh fails, logout user
      await this.logout();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
        errorCode: AuthErrorCode.TOKEN_REFRESH_FAILED,
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get current authentication status
   */
  getAuthStatus(): SessionInfo {
    const isAuthenticated = this.currentUser !== null && this.currentTokens !== null;

    if (!isAuthenticated) {
      return { isAuthenticated: false };
    }

    const tokenExpiresIn = this.currentTokens
      ? Math.floor((this.currentTokens.expiresAt - Date.now()) / 1000)
      : undefined;

    return {
      isAuthenticated: true,
      user: this.currentUser!,
      tokenExpiresIn,
      sessionStarted: this.currentTokens?.issuedAt,
    };
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (!this.currentTokens || !this.isTokenValid(this.currentTokens)) {
      return null;
    }
    return this.currentTokens.accessToken;
  }

  /**
   * Get current user
   */
  getCurrentUser(): WindowsUser | null {
    return this.currentUser;
  }

  /**
   * Check if token is valid
   */
  private isTokenValid(token: JWTToken): boolean {
    const now = Date.now();
    const expiresAt = token.expiresAt;
    // Add 60 second buffer
    return expiresAt > now + 60000;
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.currentTokens) {
      return;
    }

    // Calculate when to refresh (before expiry)
    const now = Date.now();
    const expiresAt = this.currentTokens.expiresAt;
    const refreshAt = expiresAt - this.config.refreshBeforeExpiry * 1000;
    const delay = Math.max(0, refreshAt - now);

    log.info(`Scheduling token refresh in ${Math.floor(delay / 1000)} seconds`);

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, delay);
  }

  /**
   * Emit authentication state change event
   */
  private emitStateChange(
    previousState: 'authenticated' | 'unauthenticated',
    newState: 'authenticated' | 'unauthenticated',
    reason: 'login' | 'logout' | 'token_expired' | 'token_refreshed' | 'error'
  ): void {
    const event: AuthStateChange = {
      previousState,
      newState,
      reason,
      timestamp: Date.now(),
    };

    this.emit('auth-state-change', event);
    log.info('Auth state changed:', event);
  }

  /**
   * Destroy service instance (for testing)
   */
  static destroyInstance(): void {
    if (AuthService.instance) {
      if (AuthService.instance.refreshTimer) {
        clearTimeout(AuthService.instance.refreshTimer);
      }
      AuthService.instance.removeAllListeners();
      AuthService.instance = null;
    }
  }
}

/**
 * IPC Handlers for Authentication
 *
 * Exposes authentication functionality to renderer process
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';
import { AuthService } from '../auth/auth-service';
import { SessionInfo } from '../../shared/types/auth';

let authService: AuthService;

/**
 * Initialize authentication IPC handlers
 */
export function setupAuthHandlers(): void {
  log.info('Setting up auth IPC handlers...');

  // Get or create auth service instance
  authService = AuthService.getInstance();

  // Initialize auth service
  authService.initialize().catch((error) => {
    log.error('Failed to initialize auth service:', error);
  });

  // Listen for auth state changes and broadcast to renderer
  authService.on('auth-state-change', (event) => {
    log.info('Broadcasting auth state change:', event);
    // Broadcast to all windows
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach((window: any) => {
      window.webContents.send('auth-state-changed', event);
    });
  });

  /**
   * Handle: windows-auth-login
   * Perform Windows integrated authentication
   */
  ipcMain.handle('windows-auth-login', async (event: IpcMainInvokeEvent) => {
    log.info('IPC: windows-auth-login called');

    try {
      const result = await authService.login();

      if (result.success) {
        const status = authService.getAuthStatus();
        log.info('Login successful:', status.user?.username);
        return {
          success: true,
          user: status.user,
          tokenExpiresIn: status.tokenExpiresIn,
        };
      }

      log.error('Login failed:', result.error);
      return {
        success: false,
        error: result.error,
      };
    } catch (error) {
      log.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Handle: check-auth-status
   * Check current authentication status
   */
  ipcMain.handle('check-auth-status', async (event: IpcMainInvokeEvent): Promise<SessionInfo> => {
    log.debug('IPC: check-auth-status called');

    try {
      const status = authService.getAuthStatus();
      return status;
    } catch (error) {
      log.error('Error checking auth status:', error);
      return { isAuthenticated: false };
    }
  });

  /**
   * Handle: refresh-token
   * Manually refresh authentication token
   */
  ipcMain.handle('refresh-token', async (event: IpcMainInvokeEvent) => {
    log.info('IPC: refresh-token called');

    try {
      const result = await authService.refreshToken();

      if (result.success) {
        log.info('Token refresh successful');
        return {
          success: true,
          tokenExpiresIn: result.tokens?.expiresIn,
        };
      }

      log.error('Token refresh failed:', result.error);
      return {
        success: false,
        error: result.error,
      };
    } catch (error) {
      log.error('Token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Handle: logout
   * Logout and clear session
   */
  ipcMain.handle('logout', async (event: IpcMainInvokeEvent) => {
    log.info('IPC: logout called');

    try {
      await authService.logout();
      log.info('Logout successful');
      return { success: true };
    } catch (error) {
      log.error('Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Handle: get-access-token
   * Get current access token for API requests
   */
  ipcMain.handle('get-access-token', async (event: IpcMainInvokeEvent): Promise<string | null> => {
    log.debug('IPC: get-access-token called');

    try {
      const token = authService.getAccessToken();
      return token;
    } catch (error) {
      log.error('Error getting access token:', error);
      return null;
    }
  });

  /**
   * Handle: get-current-user
   * Get current authenticated user
   */
  ipcMain.handle('get-current-user', async (event: IpcMainInvokeEvent) => {
    log.debug('IPC: get-current-user called');

    try {
      const user = authService.getCurrentUser();
      return user;
    } catch (error) {
      log.error('Error getting current user:', error);
      return null;
    }
  });

  log.info('Auth IPC handlers setup complete');
}

/**
 * Get auth service instance (for use by other modules)
 */
export function getAuthService(): AuthService {
  if (!authService) {
    authService = AuthService.getInstance();
  }
  return authService;
}

/**
 * Cleanup handlers
 */
export function cleanupAuthHandlers(): void {
  ipcMain.removeHandler('windows-auth-login');
  ipcMain.removeHandler('check-auth-status');
  ipcMain.removeHandler('refresh-token');
  ipcMain.removeHandler('logout');
  ipcMain.removeHandler('get-access-token');
  ipcMain.removeHandler('get-current-user');
  log.info('Auth IPC handlers cleaned up');
}

/**
 * IPC Handlers for Settings
 * Provides settings management endpoints
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { SettingsService } from '../services/settings-service';
import { WindowDetectionSettings } from '../../shared/types/settings';

/**
 * Error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Success response structure
 */
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: number;
}

type IpcResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Settings handler service
 */
export class SettingsHandlers {
  private settingsService: SettingsService;
  private isInitialized: boolean = false;

  constructor() {
    this.settingsService = SettingsService.getInstance();
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    if (this.isInitialized) {
      console.warn('SettingsHandlers already initialized');
      return;
    }

    // Settings handlers
    ipcMain.handle('settings-get-window-detection', this.handleGetWindowDetection.bind(this));
    ipcMain.handle('settings-set-window-detection', this.handleSetWindowDetection.bind(this));
    ipcMain.handle('settings-get-window-filter', this.handleGetWindowFilter.bind(this));
    ipcMain.handle('settings-set-window-filter', this.handleSetWindowFilter.bind(this));
    ipcMain.handle('settings-get-refresh-interval', this.handleGetRefreshInterval.bind(this));
    ipcMain.handle('settings-set-refresh-interval', this.handleSetRefreshInterval.bind(this));
    ipcMain.handle('settings-get-auto-refresh', this.handleGetAutoRefresh.bind(this));
    ipcMain.handle('settings-set-auto-refresh', this.handleSetAutoRefresh.bind(this));

    this.isInitialized = true;
    console.log('SettingsHandlers registered successfully');
  }

  /**
   * Unregister all IPC handlers
   */
  unregisterHandlers(): void {
    if (!this.isInitialized) {
      return;
    }

    ipcMain.removeHandler('settings-get-window-detection');
    ipcMain.removeHandler('settings-set-window-detection');
    ipcMain.removeHandler('settings-get-window-filter');
    ipcMain.removeHandler('settings-set-window-filter');
    ipcMain.removeHandler('settings-get-refresh-interval');
    ipcMain.removeHandler('settings-set-refresh-interval');
    ipcMain.removeHandler('settings-get-auto-refresh');
    ipcMain.removeHandler('settings-set-auto-refresh');

    this.isInitialized = false;
    console.log('SettingsHandlers unregistered');
  }

  /**
   * Get window detection settings
   */
  private async handleGetWindowDetection(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<WindowDetectionSettings>> {
    try {
      const settings = this.settingsService.getWindowDetectionSettings();
      return {
        success: true,
        data: settings,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting window detection settings:', error);
      return this.createErrorResponse('GET_SETTINGS_ERROR', 'Failed to get settings', error);
    }
  }

  /**
   * Set window detection settings
   */
  private async handleSetWindowDetection(
    event: IpcMainInvokeEvent,
    settings: Partial<WindowDetectionSettings>
  ): Promise<IpcResponse<boolean>> {
    try {
      this.settingsService.setWindowDetectionSettings(settings);
      return {
        success: true,
        data: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error setting window detection settings:', error);
      return this.createErrorResponse('SET_SETTINGS_ERROR', 'Failed to set settings', error);
    }
  }

  /**
   * Get window filter
   */
  private async handleGetWindowFilter(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<string>> {
    try {
      const filter = this.settingsService.getWindowFilter();
      return {
        success: true,
        data: filter,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting window filter:', error);
      return this.createErrorResponse('GET_FILTER_ERROR', 'Failed to get filter', error);
    }
  }

  /**
   * Set window filter
   */
  private async handleSetWindowFilter(
    event: IpcMainInvokeEvent,
    filter: string
  ): Promise<IpcResponse<boolean>> {
    try {
      this.settingsService.setWindowFilter(filter);
      return {
        success: true,
        data: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error setting window filter:', error);
      return this.createErrorResponse('SET_FILTER_ERROR', 'Failed to set filter', error);
    }
  }

  /**
   * Get refresh interval
   */
  private async handleGetRefreshInterval(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<number>> {
    try {
      const interval = this.settingsService.getRefreshInterval();
      return {
        success: true,
        data: interval,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting refresh interval:', error);
      return this.createErrorResponse('GET_INTERVAL_ERROR', 'Failed to get interval', error);
    }
  }

  /**
   * Set refresh interval
   */
  private async handleSetRefreshInterval(
    event: IpcMainInvokeEvent,
    interval: number
  ): Promise<IpcResponse<boolean>> {
    try {
      this.settingsService.setRefreshInterval(interval);
      return {
        success: true,
        data: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error setting refresh interval:', error);
      return this.createErrorResponse('SET_INTERVAL_ERROR', 'Failed to set interval', error);
    }
  }

  /**
   * Get auto-refresh enabled
   */
  private async handleGetAutoRefresh(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<boolean>> {
    try {
      const enabled = this.settingsService.getEnableAutoRefresh();
      return {
        success: true,
        data: enabled,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting auto-refresh:', error);
      return this.createErrorResponse('GET_AUTO_REFRESH_ERROR', 'Failed to get auto-refresh', error);
    }
  }

  /**
   * Set auto-refresh enabled
   */
  private async handleSetAutoRefresh(
    event: IpcMainInvokeEvent,
    enabled: boolean
  ): Promise<IpcResponse<boolean>> {
    try {
      this.settingsService.setEnableAutoRefresh(enabled);
      return {
        success: true,
        data: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error setting auto-refresh:', error);
      return this.createErrorResponse('SET_AUTO_REFRESH_ERROR', 'Failed to set auto-refresh', error);
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(code: string, message: string, details?: unknown): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details: details instanceof Error ? {
          name: details.name,
          message: details.message,
          stack: details.stack
        } : details
      }
    };
  }
}

/**
 * Singleton instance
 */
let handlerInstance: SettingsHandlers | null = null;

/**
 * Initialize settings handlers
 */
export function initializeSettingsHandlers(): void {
  if (handlerInstance) {
    console.warn('SettingsHandlers already initialized');
    return;
  }

  handlerInstance = new SettingsHandlers();
  handlerInstance.registerHandlers();
}

/**
 * Cleanup settings handlers
 */
export function cleanupSettingsHandlers(): void {
  if (handlerInstance) {
    handlerInstance.unregisterHandlers();
    handlerInstance = null;
  }
}

/**
 * Get handler instance (for testing)
 */
export function getHandlerInstance(): SettingsHandlers | null {
  return handlerInstance;
}

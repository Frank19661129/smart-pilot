/**
 * IPC Handlers for Version Information
 *
 * Provides Electron IPC handlers for:
 * - Getting version information
 * - Getting build details
 *
 * Follows secure IPC patterns from iddoc-viewer
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { getVersionInfo, VersionInfo } from '../../shared/utils/version';
import { IPC_CHANNELS } from '../../shared/types';

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
 * Version handler service
 */
export class VersionHandlers {
  private isInitialized: boolean = false;

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    if (this.isInitialized) {
      console.warn('VersionHandlers already initialized');
      return;
    }

    ipcMain.handle(IPC_CHANNELS.VERSION_GET_INFO, this.handleGetVersionInfo.bind(this));

    this.isInitialized = true;
    console.log('VersionHandlers registered successfully');
  }

  /**
   * Unregister all IPC handlers
   */
  unregisterHandlers(): void {
    if (!this.isInitialized) {
      return;
    }

    ipcMain.removeHandler(IPC_CHANNELS.VERSION_GET_INFO);

    this.isInitialized = false;
    console.log('VersionHandlers unregistered');
  }

  /**
   * Handle get-version-info request
   */
  private async handleGetVersionInfo(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<VersionInfo>> {
    try {
      console.log('IPC: get-version-info requested');

      const versionInfo = getVersionInfo();

      return {
        success: true,
        data: versionInfo,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-version-info:', error);
      return this.createErrorResponse('GET_VERSION_ERROR', 'Failed to get version info', error);
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
let handlerInstance: VersionHandlers | null = null;

/**
 * Initialize version handlers
 */
export function initializeVersionHandlers(): void {
  if (handlerInstance) {
    console.warn('VersionHandlers already initialized');
    return;
  }

  handlerInstance = new VersionHandlers();
  handlerInstance.registerHandlers();
}

/**
 * Cleanup version handlers
 */
export function cleanupVersionHandlers(): void {
  if (handlerInstance) {
    handlerInstance.unregisterHandlers();
    handlerInstance = null;
  }
}

/**
 * Get handler instance (for testing)
 */
export function getHandlerInstance(): VersionHandlers | null {
  return handlerInstance;
}

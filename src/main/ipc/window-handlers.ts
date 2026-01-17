/**
 * IPC Handlers for Windows Integration
 *
 * Provides Electron IPC handlers for:
 * - Window detection and enumeration
 * - Browser tab detection
 * - Session context detection
 *
 * Follows secure IPC patterns from iddoc-viewer
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
// Use native C# executable for ALL Windows detection (enterprise-grade, bundled resource)
import { WindowDetectorNative as WindowDetector } from '../windows-integration/window-detector-native';
import { SessionDetector } from '../windows-integration/session-detector';
import { ContextDetectionService, WindowContext } from '../services/context-detection-service';
import {
  WindowInfo,
  BrowserTab,
  SessionContext,
  WindowsDetectionResult,
  BrowserDetectionResult
} from '../../shared/types/windows';

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
 * Window handler service
 */
export class WindowHandlers {
  private windowDetector: WindowDetector;
  private sessionDetector: SessionDetector;
  private contextDetector: ContextDetectionService;
  private isInitialized: boolean = false;

  constructor() {
    this.windowDetector = WindowDetector.getInstance();
    this.sessionDetector = SessionDetector.getInstance();
    this.contextDetector = ContextDetectionService.getInstance();
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    if (this.isInitialized) {
      console.warn('WindowHandlers already initialized');
      return;
    }

    // Window detection handlers
    ipcMain.handle('get-all-windows', this.handleGetAllWindows.bind(this));
    ipcMain.handle('get-browser-tabs', this.handleGetBrowserTabs.bind(this));
    ipcMain.handle('get-active-window', this.handleGetActiveWindow.bind(this));
    ipcMain.handle('get-windows-by-process', this.handleGetWindowsByProcess.bind(this));
    ipcMain.handle('get-windows-by-class', this.handleGetWindowsByClassName.bind(this));

    // Session detection handlers
    ipcMain.handle('get-session-context', this.handleGetSessionContext.bind(this));
    ipcMain.handle('is-remote-session', this.handleIsRemoteSession.bind(this));

    // Utility handlers
    ipcMain.handle('get-window-details', this.handleGetWindowDetails.bind(this));
    ipcMain.handle('activate-window', this.handleActivateWindow.bind(this));

    // Context detection handlers
    ipcMain.handle('detect-window-context', this.handleDetectWindowContext.bind(this));

    this.isInitialized = true;
    console.log('WindowHandlers registered successfully');
  }

  /**
   * Unregister all IPC handlers
   */
  unregisterHandlers(): void {
    if (!this.isInitialized) {
      return;
    }

    ipcMain.removeHandler('get-all-windows');
    ipcMain.removeHandler('get-browser-tabs');
    ipcMain.removeHandler('get-active-window');
    ipcMain.removeHandler('get-windows-by-process');
    ipcMain.removeHandler('get-windows-by-class');
    ipcMain.removeHandler('get-session-context');
    ipcMain.removeHandler('is-remote-session');
    ipcMain.removeHandler('get-window-details');
    ipcMain.removeHandler('activate-window');
    ipcMain.removeHandler('detect-window-context');

    this.isInitialized = false;
    console.log('WindowHandlers unregistered');
  }

  /**
   * Handle get-all-windows request
   */
  private async handleGetAllWindows(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<WindowsDetectionResult>> {
    try {
      console.log('IPC: get-all-windows requested');

      const result = await this.windowDetector.getAllWindows();

      return {
        success: true,
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-all-windows:', error);
      return this.createErrorResponse('GET_WINDOWS_ERROR', 'Failed to enumerate windows', error);
    }
  }

  /**
   * Handle get-browser-tabs request
   */
  private async handleGetBrowserTabs(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<BrowserDetectionResult>> {
    try {
      console.log('IPC: get-browser-tabs requested');

      const result = await this.windowDetector.getBrowserTabs();

      return {
        success: true,
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-browser-tabs:', error);
      return this.createErrorResponse('GET_BROWSER_TABS_ERROR', 'Failed to detect browser tabs', error);
    }
  }

  /**
   * Handle get-active-window request
   */
  private async handleGetActiveWindow(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<WindowInfo | null>> {
    try {
      console.log('IPC: get-active-window requested');

      const window = await this.windowDetector.getActiveWindow();

      return {
        success: true,
        data: window,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-active-window:', error);
      return this.createErrorResponse('GET_ACTIVE_WINDOW_ERROR', 'Failed to get active window', error);
    }
  }

  /**
   * Handle get-windows-by-process request
   */
  private async handleGetWindowsByProcess(
    event: IpcMainInvokeEvent,
    processName: string
  ): Promise<IpcResponse<WindowInfo[]>> {
    try {
      // Validate input
      if (!processName || typeof processName !== 'string') {
        return this.createErrorResponse('INVALID_INPUT', 'Process name must be a non-empty string');
      }

      console.log(`IPC: get-windows-by-process requested for "${processName}"`);

      const windows = await this.windowDetector.getWindowsByProcess(processName);

      return {
        success: true,
        data: windows,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-windows-by-process:', error);
      return this.createErrorResponse('GET_WINDOWS_BY_PROCESS_ERROR', 'Failed to get windows by process', error);
    }
  }

  /**
   * Handle get-windows-by-class request
   */
  private async handleGetWindowsByClassName(
    event: IpcMainInvokeEvent,
    className: string
  ): Promise<IpcResponse<WindowInfo[]>> {
    try {
      // Validate input
      if (!className || typeof className !== 'string') {
        return this.createErrorResponse('INVALID_INPUT', 'Class name must be a non-empty string');
      }

      console.log(`IPC: get-windows-by-class requested for "${className}"`);

      const windows = await this.windowDetector.getWindowsByClassName(className);

      return {
        success: true,
        data: windows,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-windows-by-class:', error);
      return this.createErrorResponse('GET_WINDOWS_BY_CLASS_ERROR', 'Failed to get windows by class', error);
    }
  }

  /**
   * Handle get-session-context request
   */
  private async handleGetSessionContext(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<SessionContext>> {
    try {
      console.log('IPC: get-session-context requested');

      const context = await this.sessionDetector.getSessionContext();

      return {
        success: true,
        data: context,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-session-context:', error);
      return this.createErrorResponse('GET_SESSION_CONTEXT_ERROR', 'Failed to get session context', error);
    }
  }

  /**
   * Handle is-remote-session request
   */
  private async handleIsRemoteSession(
    event: IpcMainInvokeEvent
  ): Promise<IpcResponse<boolean>> {
    try {
      console.log('IPC: is-remote-session requested');

      const isRemote = this.sessionDetector.isCurrentSessionRemote();

      return {
        success: true,
        data: isRemote,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in is-remote-session:', error);
      return this.createErrorResponse('IS_REMOTE_SESSION_ERROR', 'Failed to check if session is remote', error);
    }
  }

  /**
   * Handle get-window-details request
   * Gets detailed information about a specific window by handle
   */
  private async handleGetWindowDetails(
    event: IpcMainInvokeEvent,
    windowHandle: number
  ): Promise<IpcResponse<WindowInfo | null>> {
    try {
      // Validate input
      if (typeof windowHandle !== 'number') {
        return this.createErrorResponse('INVALID_INPUT', 'Window handle must be a number');
      }

      console.log(`IPC: get-window-details requested for handle ${windowHandle}`);

      // Get all windows and find the matching one
      const result = await this.windowDetector.getAllWindows();
      const window = result.windows.find(w => w.windowHandle === windowHandle);

      return {
        success: true,
        data: window || null,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in get-window-details:', error);
      return this.createErrorResponse('GET_WINDOW_DETAILS_ERROR', 'Failed to get window details', error);
    }
  }

  /**
   * Handle activate-window request
   * Brings a window to the foreground
   */
  private async handleActivateWindow(
    event: IpcMainInvokeEvent,
    windowHandle: number
  ): Promise<IpcResponse<boolean>> {
    try {
      // Validate input
      if (typeof windowHandle !== 'number') {
        return this.createErrorResponse('INVALID_INPUT', 'Window handle must be a number');
      }

      console.log(`IPC: activate-window requested for handle ${windowHandle}`);

      const result = await this.windowDetector.activateWindow(windowHandle);

      if (result.success) {
        return {
          success: true,
          data: true,
          timestamp: Date.now()
        };
      } else {
        return this.createErrorResponse('ACTIVATE_WINDOW_ERROR', result.error || 'Failed to activate window');
      }
    } catch (error) {
      console.error('Error in activate-window:', error);
      return this.createErrorResponse('ACTIVATE_WINDOW_ERROR', 'Failed to activate window', error);
    }
  }

  /**
   * Handle detect-window-context request
   * Detects Relatienummer from window screenshot using OCR
   */
  private async handleDetectWindowContext(
    event: IpcMainInvokeEvent,
    windowHandle: number
  ): Promise<IpcResponse<WindowContext>> {
    try {
      // Validate input
      if (typeof windowHandle !== 'number') {
        return this.createErrorResponse('INVALID_INPUT', 'Window handle must be a number');
      }

      console.log(`IPC: detect-window-context requested for handle ${windowHandle}`);

      const context = await this.contextDetector.detectContext(windowHandle);

      return {
        success: true,
        data: context,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in detect-window-context:', error);
      return this.createErrorResponse('DETECT_CONTEXT_ERROR', 'Failed to detect window context', error);
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
let handlerInstance: WindowHandlers | null = null;

/**
 * Initialize window handlers
 */
export function initializeWindowHandlers(): void {
  if (handlerInstance) {
    console.warn('WindowHandlers already initialized');
    return;
  }

  handlerInstance = new WindowHandlers();
  handlerInstance.registerHandlers();
}

/**
 * Cleanup window handlers
 */
export function cleanupWindowHandlers(): void {
  if (handlerInstance) {
    handlerInstance.unregisterHandlers();
    handlerInstance = null;
  }
}

/**
 * Get handler instance (for testing)
 */
export function getHandlerInstance(): WindowHandlers | null {
  return handlerInstance;
}

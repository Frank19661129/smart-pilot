/**
 * Smart Pilot API - Exposed to renderer via contextBridge
 * Complete interface for all IPC communication
 */

import type { WindowsDetectionResult, BrowserDetectionResult, SessionContext } from './windows';
import type { VersionInfo } from './index';
import type { IpcResponse } from './ipc';

/**
 * Complete Smart Pilot API exposed to renderer
 */
export interface SmartPilotAPI {
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  restoreWindow: () => Promise<void>;
  getWindowState: () => Promise<any>;

  // Settings
  getSettings: () => Promise<any>;
  setSetting: (key: string, value: any) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Authentication
  auth: {
    login: () => Promise<any>;
    logout: () => Promise<void>;
    checkStatus: () => Promise<any>;
    refreshToken: () => Promise<any>;
    getAccessToken: () => Promise<string | null>;
    getCurrentUser: () => Promise<any>;
    onAuthStateChanged: (callback: (data: any) => void) => () => void;
  };

  // WebSocket
  ws: {
    connect: (config?: any) => Promise<void>;
    disconnect: () => Promise<void>;
    sendMessage: (type: string, payload: any, correlationId?: string) => Promise<void>;
    cancelOperation: (operationId: string, reason?: string) => Promise<void>;
    sendCustomPayload: (data: any) => Promise<void>;
    getState: () => Promise<any>;
    getStats: () => Promise<any>;
    updateToken: (token: string) => Promise<void>;
    onConnected: (callback: (state: any) => void) => () => void;
    onDisconnected: (callback: (state: any) => void) => () => void;
    onReconnecting: (callback: (state: any) => void) => () => void;
    onError: (callback: (error: any) => void) => () => void;
    onMessage: (callback: (message: any) => void) => () => void;
    onProgressUpdate: (callback: (payload: any) => void) => () => void;
    onTaskAssigned: (callback: (payload: any) => void) => () => void;
    onNotification: (callback: (payload: any) => void) => () => void;
  };

  // Windows detection - NEW!
  windows: {
    getAll: () => Promise<IpcResponse<WindowsDetectionResult>>;
    getBrowserTabs: () => Promise<IpcResponse<BrowserDetectionResult>>;
    getActive: () => Promise<any>;
    getByProcess: (processName: string) => Promise<IpcResponse<any>>;
    getByClassName: (className: string) => Promise<IpcResponse<any>>;
  };

  // Session detection - NEW!
  session: {
    getContext: () => Promise<IpcResponse<SessionContext>>;
    isRemote: () => Promise<IpcResponse<boolean>>;
  };

  // Legacy WebSocket
  connectWebSocket: (url: string) => Promise<void>;
  disconnectWebSocket: () => Promise<void>;
  sendWebSocketMessage: (message: any) => Promise<void>;
  onWebSocketMessage: (callback: (message: any) => void) => () => void;
  getConnectionStatus: () => Promise<any>;

  // System
  getSystemInfo: () => Promise<any>;
  getActiveWindow: () => Promise<any>;

  // Notifications
  showNotification: (options: any) => Promise<void>;

  // File dialogs
  showOpenDialog: (options: any) => Promise<any>;
  showSaveDialog: (options: any) => Promise<any>;

  // Version
  getVersionInfo: () => Promise<IpcResponse<VersionInfo>>;

  // Event listeners
  onSettingsChanged: (callback: (settings: any) => void) => () => void;
  onConnectionStatusChanged: (callback: (status: any) => void) => () => void;
}

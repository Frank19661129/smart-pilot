/**
 * Shared TypeScript types and interfaces for Smart Pilot
 * Used across main, renderer, and preload processes
 *
 * @deprecated This file is deprecated. Import from './types/index' instead.
 * Re-exports from the new organized type structure for backward compatibility.
 */

// Re-export everything from the new organized structure
export * from './types/index';

// Keep legacy exports for backward compatibility
export type {
  ElectronWindowState as WindowState,
  ElectronWindowSettings as AppSettings,
  ConnectionStatus,
} from './types/index';

export type {
  SystemInfo,
  ActiveWindowInfo,
  NotificationOptions,
  FileDialogOptions,
  TrayMenuItem,
} from './types/ipc';

export type { IPCMessage, IPCResponse } from './types/ipc';
export type { WebSocketMessage as WSMessage } from './types/websocket';

import type { WebSocketMessage } from './types/websocket';
import type {
  ElectronWindowState,
  ElectronWindowSettings,
  ConnectionStatus
} from './types/index';
import type {
  SystemInfo,
  ActiveWindowInfo,
  NotificationOptions,
  FileDialogOptions,
} from './types/ipc';

// API exposed to renderer via preload script
export interface SmartPilotAPI {
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  restoreWindow: () => Promise<void>;
  getWindowState: () => Promise<ElectronWindowState>;

  // Settings
  getSettings: () => Promise<ElectronWindowSettings>;
  setSetting: <K extends keyof ElectronWindowSettings>(key: K, value: ElectronWindowSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Authentication
  auth?: {
    login: () => Promise<any>;
    logout: () => Promise<void>;
    checkStatus: () => Promise<any>;
    refreshToken: () => Promise<any>;
    getAccessToken: () => Promise<string>;
    getCurrentUser: () => Promise<any>;
    onAuthStateChanged: (callback: (data: any) => void) => () => void;
  };

  // WebSocket
  connectWebSocket: (url: string) => Promise<void>;
  disconnectWebSocket: () => Promise<void>;
  sendWebSocketMessage: (message: WebSocketMessage) => Promise<void>;
  onWebSocketMessage: (callback: (message: WebSocketMessage) => void) => () => void;
  getConnectionStatus: () => Promise<ConnectionStatus>;

  // WebSocket (alternative interface)
  ws?: {
    connect?: (config?: any) => Promise<any>;
    disconnect?: () => Promise<void>;
    sendMessage?: (type: string, payload: any, correlationId?: string) => Promise<void>;
    cancelOperation?: (operationId: string, reason?: string) => Promise<void>;
    sendCustomPayload?: (data: any) => Promise<void>;
    getState?: () => Promise<any>;
    getStats?: () => Promise<any>;
    updateToken?: (token: string) => Promise<void>;
    onConnected?: (callback: (state: any) => void) => () => void;
    onDisconnected?: (callback: (reason: any) => void) => () => void;
    onError?: (callback: (error: any) => void) => () => void;
    onMessage?: (callback: (message: any) => void) => () => void;
    onReconnecting?: (callback: (attempt: any) => void) => () => void;
    onStateChange?: (callback: (state: any) => void) => () => void;
    onProgressUpdate?: (callback: (payload: any) => void) => () => void;
    onTaskAssigned?: (callback: (payload: any) => void) => () => void;
    onNotification?: (callback: (payload: any) => void) => () => void;
    [key: string]: any; // Allow any additional properties
  };

  // System
  getSystemInfo: () => Promise<SystemInfo>;
  getActiveWindow: () => Promise<ActiveWindowInfo | null>;

  // Notifications
  showNotification: (options: NotificationOptions) => Promise<void>;

  // File dialogs
  showOpenDialog: (options: FileDialogOptions) => Promise<string[] | null>;
  showSaveDialog: (options: FileDialogOptions) => Promise<string | null>;

  // Version info
  getVersionInfo: () => Promise<any>;

  // Event listeners
  onSettingsChanged: (callback: (settings: ElectronWindowSettings) => void) => () => void;
  onConnectionStatusChanged: (callback: (status: ConnectionStatus) => void) => () => void;
}

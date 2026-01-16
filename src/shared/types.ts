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
  SystemInfo,
  ActiveWindowInfo,
  NotificationOptions,
  FileDialogOptions,
  TrayMenuItem,
} from './types/index';

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

  // WebSocket
  connectWebSocket: (url: string) => Promise<void>;
  disconnectWebSocket: () => Promise<void>;
  sendWebSocketMessage: (message: WebSocketMessage) => Promise<void>;
  onWebSocketMessage: (callback: (message: WebSocketMessage) => void) => () => void;
  getConnectionStatus: () => Promise<ConnectionStatus>;

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

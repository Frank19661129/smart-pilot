/**
 * Centralized type definitions for Smart Pilot
 *
 * Usage:
 *   import { Auth, WebSocket, Windows, UI, IPC } from '@/shared/types';
 *   const user: Auth.WindowsUser = ...;
 */

// Re-export all types with namespaces
export * as Auth from './auth';
export * as WebSocket from './websocket';
export * as Windows from './windows';
export * as UI from './ui';
export * as IPC from './ipc';
export * as Settings from './settings';

// Export commonly used types directly
export type { WindowsUser, JWTToken, SessionInfo, AuthResult, AuthConfig } from './auth';
export type { WebSocketMessage, MessageType, WebSocketConfig, WebSocketState } from './websocket';
export type { WindowInfo, BrowserTab, SessionContext } from './windows';
export type { GhostWindowState, DetectedWindow, ConnectionStatus, ElectronWindowState } from './ui';
export type { IpcResponse, IpcRequest, SystemInfo, ActiveWindowInfo } from './ipc';
export type { AppSettings, GhostInterfaceSettings, ElectronWindowSettings } from './settings';

// Version types
export interface VersionInfo {
  version: string;
  buildNumber: string;
  buildDate: Date;
  gitCommit?: string;
  environment: 'development' | 'production';
}

// IPC Channel constants
export const IPC_CHANNELS = {
  // Window management
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_RESTORE: 'window:restore',
  WINDOW_GET_STATE: 'window:get-state',
  WINDOW_SET_BOUNDS: 'window:set-bounds',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',

  // System tray
  TRAY_SHOW: 'tray:show',
  TRAY_HIDE: 'tray:hide',
  TRAY_UPDATE_MENU: 'tray:update-menu',

  // WebSocket
  WS_CONNECT: 'ws:connect',
  WS_DISCONNECT: 'ws:disconnect',
  WS_SEND: 'ws:send',
  WS_STATUS: 'ws:status',

  // Notifications
  NOTIFICATION_SHOW: 'notification:show',

  // System integration
  SYSTEM_GET_INFO: 'system:get-info',
  SYSTEM_GET_ACTIVE_WINDOW: 'system:get-active-window',

  // File operations
  FILE_OPEN_DIALOG: 'file:open-dialog',
  FILE_SAVE_DIALOG: 'file:save-dialog',

  // Version info
  VERSION_GET_INFO: 'version:get-info',
} as const;

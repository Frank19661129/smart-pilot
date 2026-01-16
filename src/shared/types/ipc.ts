/**
 * IPC communication type definitions
 */

export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp?: number;
}

export interface IpcRequest<T = unknown> {
  channel: string;
  data?: T;
  requestId?: string;
}

export interface IPCMessage<T = unknown> {
  channel: string;
  data?: T;
  requestId?: string;
}

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

// Notification options
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
}

// File dialog options
export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}

// Tray menu item
export interface TrayMenuItem {
  id: string;
  label: string;
  type?: 'normal' | 'separator' | 'checkbox';
  checked?: boolean;
  enabled?: boolean;
  click?: () => void;
}

// System information
export interface SystemInfo {
  platform: string;
  arch: string;
  osVersion: string;
  hostname: string;
  username: string;
  appVersion: string;
  electronVersion: string;
}

// Active window information (Windows API)
export interface ActiveWindowInfo {
  title: string;
  processName: string;
  processId: number;
  className?: string;
}

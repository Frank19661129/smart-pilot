/**
 * Smart Pilot - Preload Script
 *
 * Secure IPC bridge between main and renderer processes
 * Following iddoc-viewer security patterns with contextBridge
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  IPC_CHANNELS,
  SmartPilotAPI,
  WindowState,
  AppSettings,
  WSMessage,
  ConnectionStatus,
  SystemInfo,
  ActiveWindowInfo,
  NotificationOptions,
  FileDialogOptions,
  VersionInfo,
} from '../shared/types';

/**
 * Secure IPC API implementation
 * Only exposes whitelisted channels to renderer process
 */
const smartPilotAPI: SmartPilotAPI = {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  restoreWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_RESTORE),
  getWindowState: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_STATE),

  // Settings management
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSetting: (key, value) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, { key, value }),
  resetSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET),

  // Authentication
  auth: {
    login: () => ipcRenderer.invoke('windows-auth-login'),
    logout: () => ipcRenderer.invoke('logout'),
    checkStatus: () => ipcRenderer.invoke('check-auth-status'),
    refreshToken: () => ipcRenderer.invoke('refresh-token'),
    getAccessToken: () => ipcRenderer.invoke('get-access-token'),
    getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
    onAuthStateChanged: (callback: (event: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('auth-state-changed', subscription);
      return () => ipcRenderer.removeListener('auth-state-changed', subscription);
    },
  },

  // WebSocket
  ws: {
    connect: (config?: any) => ipcRenderer.invoke('ws-connect', config),
    disconnect: () => ipcRenderer.invoke('ws-disconnect'),
    sendMessage: (type: string, payload: any, correlationId?: string) =>
      ipcRenderer.invoke('ws-send-message', type, payload, correlationId),
    cancelOperation: (operationId: string, reason?: string) =>
      ipcRenderer.invoke('ws-cancel-operation', operationId, reason),
    sendCustomPayload: (data: any) => ipcRenderer.invoke('ws-send-custom-payload', data),
    getState: () => ipcRenderer.invoke('ws-get-state'),
    getStats: () => ipcRenderer.invoke('ws-get-stats'),
    updateToken: (token: string) => ipcRenderer.invoke('ws-update-token', token),
    onConnected: (callback: (state: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-connected', subscription);
      return () => ipcRenderer.removeListener('ws-connected', subscription);
    },
    onDisconnected: (callback: (state: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-disconnected', subscription);
      return () => ipcRenderer.removeListener('ws-disconnected', subscription);
    },
    onReconnecting: (callback: (state: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-reconnecting', subscription);
      return () => ipcRenderer.removeListener('ws-reconnecting', subscription);
    },
    onError: (callback: (error: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-error', subscription);
      return () => ipcRenderer.removeListener('ws-error', subscription);
    },
    onMessage: (callback: (message: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-message-received', subscription);
      return () => ipcRenderer.removeListener('ws-message-received', subscription);
    },
    onProgressUpdate: (callback: (payload: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-progress-update', subscription);
      return () => ipcRenderer.removeListener('ws-progress-update', subscription);
    },
    onTaskAssigned: (callback: (payload: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-task-assigned', subscription);
      return () => ipcRenderer.removeListener('ws-task-assigned', subscription);
    },
    onNotification: (callback: (payload: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('ws-notification', subscription);
      return () => ipcRenderer.removeListener('ws-notification', subscription);
    },
  },

  // Legacy WebSocket (for compatibility)
  connectWebSocket: (url: string) =>
    ipcRenderer.invoke('ws-connect', { url }),
  disconnectWebSocket: () => ipcRenderer.invoke('ws-disconnect'),
  sendWebSocketMessage: (message: WSMessage) =>
    ipcRenderer.invoke('ws-send-message', message.type, message.payload),
  onWebSocketMessage: (callback: (message: WSMessage) => void) => {
    const subscription = (_event: IpcRendererEvent, message: WSMessage) =>
      callback(message);
    ipcRenderer.on('ws-message-received', subscription);
    return () => ipcRenderer.removeListener('ws-message-received', subscription);
  },
  getConnectionStatus: () => ipcRenderer.invoke('ws-get-state'),

  // System information
  getSystemInfo: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_INFO),
  getActiveWindow: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_ACTIVE_WINDOW),

  // Windows detection
  windows: {
    getAll: () => ipcRenderer.invoke('get-all-windows'),
    getBrowserTabs: () => ipcRenderer.invoke('get-browser-tabs'),
    getActive: () => ipcRenderer.invoke('get-active-window'),
    getByProcess: (processName: string) => ipcRenderer.invoke('get-windows-by-process', processName),
    getByClassName: (className: string) => ipcRenderer.invoke('get-windows-by-class', className),
  },

  // Session detection
  session: {
    getContext: () => ipcRenderer.invoke('get-session-context'),
    isRemote: () => ipcRenderer.invoke('is-remote-session'),
  },

  // Notifications
  showNotification: (options: NotificationOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATION_SHOW, options),

  // File dialogs
  showOpenDialog: (options: FileDialogOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN_DIALOG, options),
  showSaveDialog: (options: FileDialogOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_DIALOG, options),

  // Version info
  getVersionInfo: () => ipcRenderer.invoke(IPC_CHANNELS.VERSION_GET_INFO),

  // Event listeners
  onSettingsChanged: (callback: (settings: AppSettings) => void) => {
    const subscription = (_event: IpcRendererEvent, settings: AppSettings) =>
      callback(settings);
    ipcRenderer.on('settings-changed', subscription);
    return () => ipcRenderer.removeListener('settings-changed', subscription);
  },
  onConnectionStatusChanged: (callback: (status: ConnectionStatus) => void) => {
    const subscription = (_event: IpcRendererEvent, status: ConnectionStatus) =>
      callback(status);
    ipcRenderer.on('connection-status-changed', subscription);
    return () => ipcRenderer.removeListener('connection-status-changed', subscription);
  },
};

/**
 * Expose secure API to renderer process
 * Using contextBridge ensures complete context isolation
 */
contextBridge.exposeInMainWorld('smartPilot', smartPilotAPI);

/**
 * Preload script initialized successfully
 * API exposed: auth, ws, window controls, settings, system info
 */

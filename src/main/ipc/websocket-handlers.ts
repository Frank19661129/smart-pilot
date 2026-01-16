/**
 * IPC Handlers for WebSocket
 *
 * Exposes WebSocket functionality to renderer process
 */

import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import log from 'electron-log';
import { WebSocketClient } from '../websocket/ws-client';
import { getAuthService } from './auth-handlers';
import {
  MessageType,
  WebSocketConnectionState,
  WebSocketStats,
  WebSocketMessage,
} from '../../shared/types/websocket';

let wsClient: WebSocketClient | null = null;
let mainWindow: BrowserWindow | null = null;

/**
 * Initialize WebSocket IPC handlers
 */
export function setupWebSocketHandlers(window: BrowserWindow): void {
  log.info('Setting up WebSocket IPC handlers...');

  mainWindow = window;

  /**
   * Handle: ws-connect
   * Connect to WebSocket server
   */
  ipcMain.handle('ws-connect', async (event: IpcMainInvokeEvent, config?: any) => {
    log.info('IPC: ws-connect called');

    try {
      // Get access token from auth service
      const authService = getAuthService();
      const token = authService.getAccessToken();

      if (!token) {
        log.error('Cannot connect to WebSocket: no access token');
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      // Create WebSocket client if not exists
      if (!wsClient) {
        wsClient = new WebSocketClient({
          url: config?.url || 'ws://localhost:8000/ws',
          token,
          ...config,
        });

        setupWebSocketEventHandlers();
      }

      // Connect
      await wsClient.connect(token);

      log.info('WebSocket connected');
      return { success: true };
    } catch (error) {
      log.error('WebSocket connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  });

  /**
   * Handle: ws-disconnect
   * Disconnect from WebSocket server
   */
  ipcMain.handle('ws-disconnect', async (event: IpcMainInvokeEvent) => {
    log.info('IPC: ws-disconnect called');

    try {
      if (wsClient) {
        wsClient.disconnect();
        log.info('WebSocket disconnected');
      }
      return { success: true };
    } catch (error) {
      log.error('WebSocket disconnect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      };
    }
  });

  /**
   * Handle: ws-send-message
   * Send message through WebSocket
   */
  ipcMain.handle(
    'ws-send-message',
    async (event: IpcMainInvokeEvent, type: MessageType, payload: any, correlationId?: string) => {
      log.debug('IPC: ws-send-message called', type);

      try {
        if (!wsClient) {
          return {
            success: false,
            error: 'WebSocket not initialized',
          };
        }

        wsClient.send(type, payload, correlationId);
        return { success: true };
      } catch (error) {
        log.error('Failed to send WebSocket message:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Send failed',
        };
      }
    }
  );

  /**
   * Handle: ws-cancel-operation
   * Cancel an operation
   */
  ipcMain.handle('ws-cancel-operation', async (event: IpcMainInvokeEvent, operationId: string, reason?: string) => {
    log.info('IPC: ws-cancel-operation called', operationId);

    try {
      if (!wsClient) {
        return {
          success: false,
          error: 'WebSocket not initialized',
        };
      }

      wsClient.cancelOperation(operationId, reason);
      return { success: true };
    } catch (error) {
      log.error('Failed to cancel operation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancel failed',
      };
    }
  });

  /**
   * Handle: ws-send-custom-payload
   * Send custom payload
   */
  ipcMain.handle('ws-send-custom-payload', async (event: IpcMainInvokeEvent, data: any) => {
    log.debug('IPC: ws-send-custom-payload called');

    try {
      if (!wsClient) {
        return {
          success: false,
          error: 'WebSocket not initialized',
        };
      }

      wsClient.sendCustomPayload(data);
      return { success: true };
    } catch (error) {
      log.error('Failed to send custom payload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Send failed',
      };
    }
  });

  /**
   * Handle: ws-get-state
   * Get WebSocket connection state
   */
  ipcMain.handle('ws-get-state', async (event: IpcMainInvokeEvent): Promise<WebSocketConnectionState | null> => {
    log.debug('IPC: ws-get-state called');

    try {
      if (!wsClient) {
        return null;
      }
      return wsClient.getConnectionState();
    } catch (error) {
      log.error('Failed to get WebSocket state:', error);
      return null;
    }
  });

  /**
   * Handle: ws-get-stats
   * Get WebSocket statistics
   */
  ipcMain.handle('ws-get-stats', async (event: IpcMainInvokeEvent): Promise<WebSocketStats | null> => {
    log.debug('IPC: ws-get-stats called');

    try {
      if (!wsClient) {
        return null;
      }
      return wsClient.getStats();
    } catch (error) {
      log.error('Failed to get WebSocket stats:', error);
      return null;
    }
  });

  /**
   * Handle: ws-update-token
   * Update authentication token
   */
  ipcMain.handle('ws-update-token', async (event: IpcMainInvokeEvent, token: string) => {
    log.info('IPC: ws-update-token called');

    try {
      if (!wsClient) {
        return {
          success: false,
          error: 'WebSocket not initialized',
        };
      }

      wsClient.updateToken(token);
      return { success: true };
    } catch (error) {
      log.error('Failed to update WebSocket token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  });

  log.info('WebSocket IPC handlers setup complete');
}

/**
 * Setup WebSocket event handlers to forward to renderer
 */
function setupWebSocketEventHandlers(): void {
  if (!wsClient || !mainWindow) return;

  log.info('Setting up WebSocket event forwarding...');

  // Connection events
  wsClient.on('connected', (state: WebSocketConnectionState) => {
    log.info('WebSocket connected, forwarding to renderer');
    mainWindow?.webContents.send('ws-connected', state);
  });

  wsClient.on('disconnected', (state: WebSocketConnectionState) => {
    log.info('WebSocket disconnected, forwarding to renderer');
    mainWindow?.webContents.send('ws-disconnected', state);
  });

  wsClient.on('reconnecting', (state: WebSocketConnectionState) => {
    log.info('WebSocket reconnecting, forwarding to renderer');
    mainWindow?.webContents.send('ws-reconnecting', state);
  });

  wsClient.on('error', (error) => {
    log.error('WebSocket error, forwarding to renderer:', error);
    mainWindow?.webContents.send('ws-error', error);
  });

  // Message events
  wsClient.on('message', (message: WebSocketMessage) => {
    log.debug('WebSocket message received, forwarding to renderer:', message.type);
    mainWindow?.webContents.send('ws-message-received', message);
  });

  // Specific message type events
  wsClient.on('progress_update', (payload) => {
    log.debug('Progress update received');
    mainWindow?.webContents.send('ws-progress-update', payload);
  });

  wsClient.on('task_assigned', (payload) => {
    log.info('Task assigned received');
    mainWindow?.webContents.send('ws-task-assigned', payload);
  });

  wsClient.on('notification', (payload) => {
    log.info('Notification received');
    mainWindow?.webContents.send('ws-notification', payload);
  });

  log.info('WebSocket event forwarding setup complete');
}

/**
 * Get WebSocket client instance (for use by other modules)
 */
export function getWebSocketClient(): WebSocketClient | null {
  return wsClient;
}

/**
 * Auto-connect WebSocket when authenticated
 */
export function enableAutoConnect(): void {
  const authService = getAuthService();

  authService.on('auth-state-change', async (event) => {
    if (event.newState === 'authenticated' && event.reason === 'login') {
      log.info('User authenticated, auto-connecting WebSocket...');

      const token = authService.getAccessToken();
      if (token && !wsClient) {
        wsClient = new WebSocketClient({
          url: process.env.WS_URL || 'ws://localhost:8000/ws',
          token,
        });

        if (mainWindow) {
          setupWebSocketEventHandlers();
        }

        try {
          await wsClient.connect(token);
          log.info('WebSocket auto-connected');
        } catch (error) {
          log.error('WebSocket auto-connect failed:', error);
        }
      }
    } else if (event.newState === 'unauthenticated') {
      log.info('User unauthenticated, disconnecting WebSocket...');
      if (wsClient) {
        wsClient.disconnect();
        wsClient.destroy();
        wsClient = null;
      }
    }
  });
}

/**
 * Cleanup handlers
 */
export function cleanupWebSocketHandlers(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient.destroy();
    wsClient = null;
  }

  ipcMain.removeHandler('ws-connect');
  ipcMain.removeHandler('ws-disconnect');
  ipcMain.removeHandler('ws-send-message');
  ipcMain.removeHandler('ws-cancel-operation');
  ipcMain.removeHandler('ws-send-custom-payload');
  ipcMain.removeHandler('ws-get-state');
  ipcMain.removeHandler('ws-get-stats');
  ipcMain.removeHandler('ws-update-token');

  mainWindow = null;

  log.info('WebSocket IPC handlers cleaned up');
}

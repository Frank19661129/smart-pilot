/**
 * WebSocket Client for Smart Pilot
 *
 * Handles real-time bidirectional communication with IDDI backend
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Ping/pong keep-alive
 * - Message queuing during disconnection
 * - Event emission to renderer process
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import log from 'electron-log';
import {
  WebSocketConfig,
  WebSocketConnectionState,
  WebSocketMessage,
  WebSocketStats,
  WebSocketError,
  WebSocketErrorCode,
  MessageType,
  ProgressUpdatePayload,
  TaskAssignedPayload,
  NotificationPayload,
} from '../../shared/types/websocket';

export class WebSocketClient extends EventEmitter {
  private config: WebSocketConfig;
  private ws: WebSocket | null = null;
  private connectionState: WebSocketConnectionState;
  private stats: WebSocketStats;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private lastPingTime = 0;
  private connectionStartTime = 0;

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();

    this.config = {
      url: config.url || 'ws://localhost:8000/ws',
      token: config.token,
      autoReconnect: config.autoReconnect ?? true,
      reconnectInterval: config.reconnectInterval || 1000,
      maxReconnectInterval: config.maxReconnectInterval || 30000,
      reconnectDecay: config.reconnectDecay || 1.5,
      maxReconnectAttempts: config.maxReconnectAttempts || 0, // 0 = infinite
      pingInterval: config.pingInterval || 30000,
      pongTimeout: config.pongTimeout || 5000,
      connectionTimeout: config.connectionTimeout || 10000,
    };

    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0,
    };

    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      reconnectCount: 0,
      averageLatency: 0,
      uptime: 0,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(token?: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      log.warn('WebSocket already connected');
      return;
    }

    if (token) {
      this.config.token = token;
    }

    this.updateConnectionState('connecting');

    try {
      const url = this.config.token
        ? `${this.config.url}?token=${encodeURIComponent(this.config.token)}`
        : this.config.url;

      log.info('Connecting to WebSocket:', this.config.url);

      this.ws = new WebSocket(url);
      this.setupEventHandlers();

      // Wait for connection or timeout
      await this.waitForConnection();
    } catch (error) {
      log.error('WebSocket connection failed:', error);
      this.handleError(WebSocketErrorCode.CONNECTION_FAILED, 'Connection failed', error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    log.info('Disconnecting WebSocket...');

    this.config.autoReconnect = false;
    this.clearTimers();

    if (this.ws) {
      this.updateConnectionState('disconnecting');
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateConnectionState('disconnected');
  }

  /**
   * Send message to server
   */
  send<T = any>(type: MessageType, payload: T, correlationId?: string): void {
    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
      messageId: this.generateMessageId(),
      correlationId,
    };

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      log.warn('WebSocket not connected, queuing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.ws.send(messageStr);

      this.stats.messagesSent++;
      this.stats.bytesSent += messageStr.length;

      log.debug('Message sent:', type);
    } catch (error) {
      log.error('Failed to send message:', error);
      this.handleError(WebSocketErrorCode.MESSAGE_SEND_FAILED, 'Failed to send message', error as Error);
    }
  }

  /**
   * Send ping message
   */
  ping(): void {
    this.lastPingTime = Date.now();
    this.send(MessageType.PING, { timestamp: this.lastPingTime });
    this.startPongTimeout();
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId: string, reason?: string): void {
    this.send(MessageType.CANCEL_OPERATION, {
      operationId,
      reason,
    });
  }

  /**
   * Send custom payload
   */
  sendCustomPayload(data: any): void {
    this.send(MessageType.CUSTOM_PAYLOAD, data);
  }

  /**
   * Get connection state
   */
  getConnectionState(): WebSocketConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get statistics
   */
  getStats(): WebSocketStats {
    if (this.connectionStartTime > 0) {
      this.stats.uptime = Math.floor((Date.now() - this.connectionStartTime) / 1000);
    }
    return { ...this.stats };
  }

  /**
   * Update authentication token
   */
  updateToken(token: string): void {
    this.config.token = token;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      log.info('Token updated, reconnecting...');
      this.disconnect();
      this.connect(token);
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      log.info('WebSocket connected');
      this.connectionStartTime = Date.now();
      this.reconnectAttempts = 0;
      this.updateConnectionState('connected');
      this.startPingInterval();
      this.processMessageQueue();
      this.emit('connected', this.connectionState);
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const messageStr = data.toString();
        const message: WebSocketMessage = JSON.parse(messageStr);

        this.stats.messagesReceived++;
        this.stats.bytesReceived += messageStr.length;
        this.connectionState.lastActivity = Date.now();

        this.handleMessage(message);
      } catch (error) {
        log.error('Failed to parse message:', error);
        this.handleError(WebSocketErrorCode.INVALID_MESSAGE, 'Invalid message format', error as Error);
      }
    });

    this.ws.on('close', (code: number, reason: string) => {
      log.info('WebSocket closed:', code, reason);
      this.clearTimers();
      this.updateConnectionState('disconnected');
      this.emit('disconnected', this.connectionState);

      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error: Error) => {
      log.error('WebSocket error:', error);
      this.handleError(WebSocketErrorCode.UNKNOWN_ERROR, 'WebSocket error', error);
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    log.debug('Message received:', message.type);

    // Emit generic message event
    this.emit('message', message);

    // Handle specific message types
    switch (message.type) {
      case MessageType.PONG:
        this.handlePong(message);
        break;

      case MessageType.PROGRESS_UPDATE:
        this.emit('progress_update', message.payload as ProgressUpdatePayload);
        break;

      case MessageType.TASK_ASSIGNED:
        this.emit('task_assigned', message.payload as TaskAssignedPayload);
        break;

      case MessageType.NOTIFICATION:
        this.emit('notification', message.payload as NotificationPayload);
        break;

      case MessageType.ERROR:
        this.handleServerError(message.payload);
        break;

      default:
        // Emit type-specific event
        this.emit(message.type, message.payload);
    }
  }

  /**
   * Handle pong response
   */
  private handlePong(message: WebSocketMessage): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }

    const latency = Date.now() - this.lastPingTime;
    this.connectionState.latency = latency;

    // Calculate running average latency
    if (this.stats.averageLatency === 0) {
      this.stats.averageLatency = latency;
    } else {
      this.stats.averageLatency = (this.stats.averageLatency * 0.8) + (latency * 0.2);
    }

    log.debug('Pong received, latency:', latency, 'ms');
  }

  /**
   * Handle server error
   */
  private handleServerError(error: any): void {
    log.error('Server error:', error);
    this.emit('error', {
      code: WebSocketErrorCode.UNKNOWN_ERROR,
      message: error.message || 'Server error',
      timestamp: Date.now(),
    });
  }

  /**
   * Start ping interval
   */
  private startPingInterval(): void {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, this.config.pingInterval);
  }

  /**
   * Start pong timeout
   */
  private startPongTimeout(): void {
    this.clearPongTimeout();
    this.pongTimeout = setTimeout(() => {
      log.error('Pong timeout - server not responding');
      this.handleError(WebSocketErrorCode.PONG_TIMEOUT, 'Server not responding');
      this.ws?.close();
    }, this.config.pongTimeout);
  }

  /**
   * Wait for connection to establish
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      const onOpen = () => {
        clearTimeout(timeout);
        cleanup();
        resolve();
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        this.ws?.removeListener('open', onOpen);
        this.ws?.removeListener('error', onError);
      };

      this.ws?.once('open', onOpen);
      this.ws?.once('error', onError);
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    const maxAttempts = this.config.maxReconnectAttempts;
    if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
      log.error('Max reconnect attempts reached');
      this.handleError(WebSocketErrorCode.MAX_RECONNECT_ATTEMPTS, 'Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.stats.reconnectCount++;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.reconnectDecay, this.reconnectAttempts - 1),
      this.config.maxReconnectInterval
    );

    log.info(`Reconnecting in ${Math.floor(delay / 1000)}s (attempt ${this.reconnectAttempts})`);

    this.updateConnectionState('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    log.info(`Processing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          const messageStr = JSON.stringify(message);
          this.ws?.send(messageStr);
          this.stats.messagesSent++;
          this.stats.bytesSent += messageStr.length;
        } catch (error) {
          log.error('Failed to send queued message:', error);
        }
      }
    }
  }

  /**
   * Update connection state
   */
  private updateConnectionState(status: WebSocketConnectionState['status']): void {
    this.connectionState.status = status;
    this.connectionState.reconnectAttempts = this.reconnectAttempts;
    this.connectionState.lastActivity = Date.now();

    if (status === 'connected') {
      this.connectionState.connectedAt = Date.now();
    }
  }

  /**
   * Handle error
   */
  private handleError(code: WebSocketErrorCode, message: string, originalError?: Error): void {
    const error: WebSocketError = {
      code,
      message,
      originalError,
      timestamp: Date.now(),
    };

    this.connectionState.lastError = message;
    this.emit('error', error);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearPingInterval();
    this.clearPongTimeout();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Clear ping interval
   */
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Clear pong timeout
   */
  private clearPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and destroy client
   */
  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
    this.messageQueue = [];
  }
}

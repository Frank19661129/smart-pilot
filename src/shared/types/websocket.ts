/**
 * WebSocket Types for Smart Pilot
 *
 * Handles real-time communication with IDDI backend
 */

export enum MessageType {
  // Server -> Client messages
  PROGRESS_UPDATE = 'progress_update',
  TASK_ASSIGNED = 'task_assigned',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  PONG = 'pong',

  // Client -> Server messages
  PING = 'ping',
  CANCEL_OPERATION = 'cancel_operation',
  CUSTOM_PAYLOAD = 'custom_payload',
  DOCUMENT_UPLOAD = 'document_upload',
  DOM_SNAPSHOT = 'dom_snapshot',

  // Connection lifecycle
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
}

export interface WebSocketMessage<T = any> {
  /** Message type identifier */
  type: MessageType;

  /** Message payload */
  payload: T;

  /** Unique message identifier */
  messageId?: string;

  /** Timestamp when message was created */
  timestamp: number;

  /** Correlation ID for request-response pattern */
  correlationId?: string;
}

export interface ProgressUpdatePayload {
  /** Operation identifier */
  operationId: string;

  /** Progress percentage (0-100) */
  progress: number;

  /** Current step description */
  step: string;

  /** Total steps */
  totalSteps?: number;

  /** Current step number */
  currentStep?: number;

  /** Estimated time remaining (seconds) */
  estimatedTimeRemaining?: number;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface TaskAssignedPayload {
  /** Task identifier */
  taskId: string;

  /** Task type */
  taskType: string;

  /** Task description */
  description: string;

  /** Task priority */
  priority: 'low' | 'medium' | 'high' | 'critical';

  /** Due date timestamp */
  dueDate?: number;

  /** Task data */
  data?: Record<string, any>;
}

export interface NotificationPayload {
  /** Notification identifier */
  notificationId: string;

  /** Notification title */
  title: string;

  /** Notification message */
  message: string;

  /** Notification level */
  level: 'info' | 'warning' | 'error' | 'success';

  /** Action buttons */
  actions?: NotificationAction[];

  /** Auto-dismiss timeout (ms) */
  timeout?: number;

  /** Additional data */
  data?: Record<string, any>;
}

export interface NotificationAction {
  /** Action identifier */
  actionId: string;

  /** Action label */
  label: string;

  /** Action type */
  type: 'primary' | 'secondary' | 'danger';
}

export interface CancelOperationPayload {
  /** Operation identifier to cancel */
  operationId: string;

  /** Cancellation reason */
  reason?: string;
}

export interface DocumentUploadPayload {
  /** Document identifier */
  documentId: string;

  /** Document name */
  fileName: string;

  /** Document type */
  documentType: string;

  /** Document size in bytes */
  size: number;

  /** Base64 encoded document data */
  data: string;

  /** Document metadata */
  metadata?: Record<string, any>;
}

export interface DOMSnapshotPayload {
  /** URL of the page */
  url: string;

  /** Page title */
  title: string;

  /** HTML content */
  html: string;

  /** Screenshot (base64 encoded image) */
  screenshot?: string;

  /** Timestamp when snapshot was taken */
  timestamp: number;

  /** Browser information */
  browser?: {
    name: string;
    version: string;
  };
}

export interface WebSocketConfig {
  /** WebSocket server URL */
  url: string;

  /** Authentication token */
  token?: string;

  /** Enable auto-reconnect */
  autoReconnect: boolean;

  /** Reconnect interval (ms) */
  reconnectInterval: number;

  /** Maximum reconnect interval (ms) */
  maxReconnectInterval: number;

  /** Reconnect decay factor for exponential backoff */
  reconnectDecay: number;

  /** Maximum reconnect attempts (0 = infinite) */
  maxReconnectAttempts: number;

  /** Ping interval (ms) */
  pingInterval: number;

  /** Pong timeout (ms) */
  pongTimeout: number;

  /** Connection timeout (ms) */
  connectionTimeout: number;
}

export interface WebSocketConnectionState {
  /** Connection status */
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting';

  /** Reconnect attempt count */
  reconnectAttempts: number;

  /** Last error */
  lastError?: string;

  /** Connection established timestamp */
  connectedAt?: number;

  /** Last activity timestamp */
  lastActivity?: number;

  /** Latency in milliseconds */
  latency?: number;
}

export interface WebSocketStats {
  /** Total messages sent */
  messagesSent: number;

  /** Total messages received */
  messagesReceived: number;

  /** Total bytes sent */
  bytesSent: number;

  /** Total bytes received */
  bytesReceived: number;

  /** Total reconnect attempts */
  reconnectCount: number;

  /** Average latency (ms) */
  averageLatency: number;

  /** Connection uptime (seconds) */
  uptime: number;
}

export enum WebSocketErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  MAX_RECONNECT_ATTEMPTS = 'MAX_RECONNECT_ATTEMPTS',
  PONG_TIMEOUT = 'PONG_TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface WebSocketError {
  /** Error code */
  code: WebSocketErrorCode;

  /** Error message */
  message: string;

  /** Original error object */
  originalError?: Error;

  /** Timestamp */
  timestamp: number;
}

/**
 * Event types for WebSocket client
 */
export type WebSocketEventMap = {
  connected: WebSocketConnectionState;
  disconnected: WebSocketConnectionState;
  reconnecting: WebSocketConnectionState;
  message: WebSocketMessage;
  error: WebSocketError;
  progress_update: ProgressUpdatePayload;
  task_assigned: TaskAssignedPayload;
  notification: NotificationPayload;
};

/**
 * Unified error handling utilities for Smart Pilot
 */

import { IPC } from '../types';

/**
 * Custom error class for IPC operations
 */
export class IpcError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'IpcError';
    Object.setPrototypeOf(this, IpcError.prototype);
  }
}

/**
 * Standard IPC error codes
 */
export const IPC_ERROR_CODES = {
  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  OPERATION_FAILED: 'OPERATION_FAILED',

  // Window errors
  WINDOW_NOT_FOUND: 'WINDOW_NOT_FOUND',
  ENUM_WINDOWS_ERROR: 'ENUM_WINDOWS_ERROR',
  GET_ACTIVE_WINDOW_ERROR: 'GET_ACTIVE_WINDOW_ERROR',
  WINDOW_OPERATION_FAILED: 'WINDOW_OPERATION_FAILED',

  // Auth errors
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // WebSocket errors
  WS_NOT_CONNECTED: 'WS_NOT_CONNECTED',
  WS_CONNECTION_FAILED: 'WS_CONNECTION_FAILED',
  WS_SEND_FAILED: 'WS_SEND_FAILED',
  WS_ALREADY_CONNECTED: 'WS_ALREADY_CONNECTED',

  // Settings errors
  SETTINGS_READ_ERROR: 'SETTINGS_READ_ERROR',
  SETTINGS_WRITE_ERROR: 'SETTINGS_WRITE_ERROR',
  INVALID_SETTING_KEY: 'INVALID_SETTING_KEY',

  // System errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * Convert any error to IPC response format
 */
export function handleIpcError<T = never>(error: unknown): IPC.IpcResponse<T> {
  if (error instanceof IpcError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: Date.now(),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: IPC_ERROR_CODES.UNKNOWN_ERROR,
        message: error.message,
        details: {
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      timestamp: Date.now(),
    };
  }

  return {
    success: false,
    error: {
      code: IPC_ERROR_CODES.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      details: error,
    },
    timestamp: Date.now(),
  };
}

/**
 * Create successful IPC response
 */
export function createSuccessResponse<T>(data: T): IPC.IpcResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
  };
}

/**
 * Wrap async IPC handler with error handling
 */
export function wrapIpcHandler<T>(
  handler: () => Promise<T>
): Promise<IPC.IpcResponse<T>> {
  return handler()
    .then(createSuccessResponse)
    .catch(handleIpcError);
}

/**
 * Type guard to check if value is an IpcError
 */
export function isIpcError(error: unknown): error is IpcError {
  return error instanceof IpcError;
}

/**
 * Create a typed IpcError with proper error code
 */
export function createIpcError(
  code: keyof typeof IPC_ERROR_CODES,
  message: string,
  details?: unknown
): IpcError {
  return new IpcError(IPC_ERROR_CODES[code], message, details);
}

"use strict";
/**
 * Unified error handling utilities for Smart Pilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_ERROR_CODES = exports.IpcError = void 0;
exports.handleIpcError = handleIpcError;
exports.createSuccessResponse = createSuccessResponse;
exports.wrapIpcHandler = wrapIpcHandler;
exports.isIpcError = isIpcError;
exports.createIpcError = createIpcError;
/**
 * Custom error class for IPC operations
 */
class IpcError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'IpcError';
        Object.setPrototypeOf(this, IpcError.prototype);
    }
}
exports.IpcError = IpcError;
/**
 * Standard IPC error codes
 */
exports.IPC_ERROR_CODES = {
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
};
/**
 * Convert any error to IPC response format
 */
function handleIpcError(error) {
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
                code: exports.IPC_ERROR_CODES.UNKNOWN_ERROR,
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
            code: exports.IPC_ERROR_CODES.UNKNOWN_ERROR,
            message: 'An unknown error occurred',
            details: error,
        },
        timestamp: Date.now(),
    };
}
/**
 * Create successful IPC response
 */
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: Date.now(),
    };
}
/**
 * Wrap async IPC handler with error handling
 */
function wrapIpcHandler(handler) {
    return handler()
        .then(createSuccessResponse)
        .catch(handleIpcError);
}
/**
 * Type guard to check if value is an IpcError
 */
function isIpcError(error) {
    return error instanceof IpcError;
}
/**
 * Create a typed IpcError with proper error code
 */
function createIpcError(code, message, details) {
    return new IpcError(exports.IPC_ERROR_CODES[code], message, details);
}

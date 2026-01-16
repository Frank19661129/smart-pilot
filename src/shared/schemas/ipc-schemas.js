"use strict";
/**
 * Zod schemas for IPC input validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDialogSchema = exports.NotificationSchema = exports.SetSettingSchema = exports.SetWindowBoundsSchema = exports.GetWindowsByClassSchema = exports.GetWindowsByProcessSchema = exports.WebSocketConfigSchema = exports.CancelOperationSchema = exports.SendMessageSchema = void 0;
const zod_1 = require("zod");
// WebSocket schemas
exports.SendMessageSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, 'Message type is required'),
    payload: zod_1.z.unknown(),
    correlationId: zod_1.z.string().optional(),
});
exports.CancelOperationSchema = zod_1.z.object({
    operationId: zod_1.z.string().min(1, 'Operation ID is required'),
    reason: zod_1.z.string().optional(),
});
exports.WebSocketConfigSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid WebSocket URL'),
    autoReconnect: zod_1.z.boolean().optional(),
    reconnectInterval: zod_1.z.number().positive().optional(),
    maxReconnectInterval: zod_1.z.number().positive().optional(),
    pingInterval: zod_1.z.number().positive().optional(),
    pongTimeout: zod_1.z.number().positive().optional(),
    connectionTimeout: zod_1.z.number().positive().optional(),
}).optional();
// Window schemas
exports.GetWindowsByProcessSchema = zod_1.z.object({
    processName: zod_1.z.string().min(1, 'Process name is required'),
});
exports.GetWindowsByClassSchema = zod_1.z.object({
    className: zod_1.z.string().min(1, 'Class name is required'),
});
exports.SetWindowBoundsSchema = zod_1.z.object({
    x: zod_1.z.number().optional(),
    y: zod_1.z.number().optional(),
    width: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
});
// Settings schemas
exports.SetSettingSchema = zod_1.z.object({
    key: zod_1.z.string().min(1, 'Setting key is required'),
    value: zod_1.z.unknown(),
});
// Notification schemas
exports.NotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    body: zod_1.z.string().min(1, 'Body is required'),
    icon: zod_1.z.string().optional(),
    silent: zod_1.z.boolean().optional(),
    urgency: zod_1.z.enum(['normal', 'critical', 'low']).optional(),
});
// File dialog schemas
exports.FileDialogSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    defaultPath: zod_1.z.string().optional(),
    filters: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        extensions: zod_1.z.array(zod_1.z.string()),
    })).optional(),
    properties: zod_1.z.array(zod_1.z.enum(['openFile', 'openDirectory', 'multiSelections', 'showHiddenFiles'])).optional(),
});

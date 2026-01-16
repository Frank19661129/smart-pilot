/**
 * Zod schemas for IPC input validation
 */

import { z } from 'zod';

// WebSocket schemas
export const SendMessageSchema = z.object({
  type: z.string().min(1, 'Message type is required'),
  payload: z.unknown(),
  correlationId: z.string().optional(),
});

export const CancelOperationSchema = z.object({
  operationId: z.string().min(1, 'Operation ID is required'),
  reason: z.string().optional(),
});

export const WebSocketConfigSchema = z.object({
  url: z.string().url('Invalid WebSocket URL'),
  autoReconnect: z.boolean().optional(),
  reconnectInterval: z.number().positive().optional(),
  maxReconnectInterval: z.number().positive().optional(),
  pingInterval: z.number().positive().optional(),
  pongTimeout: z.number().positive().optional(),
  connectionTimeout: z.number().positive().optional(),
}).optional();

// Window schemas
export const GetWindowsByProcessSchema = z.object({
  processName: z.string().min(1, 'Process name is required'),
});

export const GetWindowsByClassSchema = z.object({
  className: z.string().min(1, 'Class name is required'),
});

export const SetWindowBoundsSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

// Settings schemas
export const SetSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.unknown(),
});

// Notification schemas
export const NotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  icon: z.string().optional(),
  silent: z.boolean().optional(),
  urgency: z.enum(['normal', 'critical', 'low']).optional(),
});

// File dialog schemas
export const FileDialogSchema = z.object({
  title: z.string().optional(),
  defaultPath: z.string().optional(),
  filters: z.array(z.object({
    name: z.string(),
    extensions: z.array(z.string()),
  })).optional(),
  properties: z.array(
    z.enum(['openFile', 'openDirectory', 'multiSelections', 'showHiddenFiles'])
  ).optional(),
});

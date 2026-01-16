"use strict";
/**
 * Centralized type definitions for Smart Pilot
 *
 * Usage:
 *   import { Auth, WebSocket, Windows, UI, IPC } from '@/shared/types';
 *   const user: Auth.WindowsUser = ...;
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.Settings = exports.IPC = exports.UI = exports.Windows = exports.WebSocket = exports.Auth = void 0;
// Re-export all types with namespaces
exports.Auth = __importStar(require("./auth"));
exports.WebSocket = __importStar(require("./websocket"));
exports.Windows = __importStar(require("./windows"));
exports.UI = __importStar(require("./ui"));
exports.IPC = __importStar(require("./ipc"));
exports.Settings = __importStar(require("./settings"));
// IPC Channel constants
exports.IPC_CHANNELS = {
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
};

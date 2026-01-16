"use strict";
/**
 * WebSocket Types for Smart Pilot
 *
 * Handles real-time communication with IDDI backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketErrorCode = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    // Server -> Client messages
    MessageType["PROGRESS_UPDATE"] = "progress_update";
    MessageType["TASK_ASSIGNED"] = "task_assigned";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["ERROR"] = "error";
    MessageType["PONG"] = "pong";
    // Client -> Server messages
    MessageType["PING"] = "ping";
    MessageType["CANCEL_OPERATION"] = "cancel_operation";
    MessageType["CUSTOM_PAYLOAD"] = "custom_payload";
    MessageType["DOCUMENT_UPLOAD"] = "document_upload";
    MessageType["DOM_SNAPSHOT"] = "dom_snapshot";
    // Connection lifecycle
    MessageType["CONNECTED"] = "connected";
    MessageType["DISCONNECTED"] = "disconnected";
    MessageType["RECONNECTING"] = "reconnecting";
})(MessageType || (exports.MessageType = MessageType = {}));
var WebSocketErrorCode;
(function (WebSocketErrorCode) {
    WebSocketErrorCode["CONNECTION_FAILED"] = "CONNECTION_FAILED";
    WebSocketErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    WebSocketErrorCode["CONNECTION_TIMEOUT"] = "CONNECTION_TIMEOUT";
    WebSocketErrorCode["MESSAGE_SEND_FAILED"] = "MESSAGE_SEND_FAILED";
    WebSocketErrorCode["INVALID_MESSAGE"] = "INVALID_MESSAGE";
    WebSocketErrorCode["MAX_RECONNECT_ATTEMPTS"] = "MAX_RECONNECT_ATTEMPTS";
    WebSocketErrorCode["PONG_TIMEOUT"] = "PONG_TIMEOUT";
    WebSocketErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(WebSocketErrorCode || (exports.WebSocketErrorCode = WebSocketErrorCode = {}));

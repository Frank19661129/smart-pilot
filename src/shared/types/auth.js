"use strict";
/**
 * Authentication Types for Smart Pilot
 *
 * Handles Windows Integrated Authentication and JWT token management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthErrorCode = void 0;
var AuthErrorCode;
(function (AuthErrorCode) {
    AuthErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    AuthErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    AuthErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    AuthErrorCode["WINDOWS_AUTH_FAILED"] = "WINDOWS_AUTH_FAILED";
    AuthErrorCode["BACKEND_UNAVAILABLE"] = "BACKEND_UNAVAILABLE";
    AuthErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    AuthErrorCode["TOKEN_REFRESH_FAILED"] = "TOKEN_REFRESH_FAILED";
    AuthErrorCode["KERBEROS_ERROR"] = "KERBEROS_ERROR";
    AuthErrorCode["NTLM_ERROR"] = "NTLM_ERROR";
})(AuthErrorCode || (exports.AuthErrorCode = AuthErrorCode = {}));

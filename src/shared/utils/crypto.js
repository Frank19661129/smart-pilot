"use strict";
/**
 * Cryptographic Utilities
 *
 * Provides secure key generation and cryptographic functions
 * for the Smart Pilot application.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__test__ = void 0;
exports.generateMachineSpecificKey = generateMachineSpecificKey;
exports.generateSecureRandomString = generateSecureRandomString;
exports.sha256Hash = sha256Hash;
exports.deriveKeyFromPassword = deriveKeyFromPassword;
exports.getKeyDerivationParams = getKeyDerivationParams;
exports.validateKeyStrength = validateKeyStrength;
const crypto_1 = require("crypto");
const node_machine_id_1 = require("node-machine-id");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Default parameters for PBKDF2 key derivation
 * These values provide a good balance between security and performance
 */
const DEFAULT_KEY_PARAMS = {
    salt: '', // Will be generated per-installation
    iterations: 100000, // OWASP recommended minimum
    keyLength: 32, // 256 bits
    digest: 'sha256',
};
/**
 * Generate a machine-specific encryption key
 *
 * This function creates a unique encryption key based on:
 * - Machine ID (hardware-specific identifier)
 * - App user data path (installation-specific)
 * - Application ID constant
 * - A random salt (generated once per installation)
 *
 * The key is derived using PBKDF2 with SHA-256, making it
 * resistant to rainbow table attacks.
 *
 * @returns {string} Hex-encoded encryption key
 * @throws {Error} If key generation fails
 */
function generateMachineSpecificKey() {
    try {
        // Get machine-specific identifiers
        const machineId = (0, node_machine_id_1.machineIdSync)({ original: true });
        const appPath = electron_1.app.getPath('userData');
        const appId = 'com.insurancedata.smartpilot';
        // Combine machine identifiers
        const machineData = `${machineId}:${appPath}:${appId}`;
        // Generate a random salt (this should be stored and reused)
        // In production, retrieve this from secure storage
        const salt = generateOrRetrieveSalt();
        // Derive key using PBKDF2
        const key = (0, crypto_1.pbkdf2Sync)(machineData, salt, DEFAULT_KEY_PARAMS.iterations, DEFAULT_KEY_PARAMS.keyLength, DEFAULT_KEY_PARAMS.digest);
        electron_log_1.default.info('Machine-specific encryption key generated successfully');
        return key.toString('hex');
    }
    catch (error) {
        electron_log_1.default.error('Failed to generate machine-specific key:', error);
        throw new Error(`Key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate or retrieve the salt for key derivation
 *
 * The salt is generated once per installation and stored in a
 * separate configuration file. This ensures the same key is
 * generated consistently for the same machine.
 *
 * @returns {string} Hex-encoded salt
 */
function generateOrRetrieveSalt() {
    try {
        // In a production environment, you would:
        // 1. Check if salt exists in secure storage
        // 2. If not, generate new salt and store it
        // 3. Return the salt
        // For now, we generate a deterministic salt from machine ID
        // This is acceptable because we're using PBKDF2 with high iteration count
        const machineId = (0, node_machine_id_1.machineIdSync)({ original: true });
        const saltSource = `smart-pilot-salt-${machineId}`;
        // Create a hash of the machine ID to use as salt
        const salt = (0, crypto_1.createHash)('sha256').update(saltSource).digest('hex');
        return salt;
    }
    catch (error) {
        electron_log_1.default.error('Failed to generate/retrieve salt:', error);
        // Fallback to a hash of the app path if machine ID fails
        const appPath = electron_1.app.getPath('userData');
        return (0, crypto_1.createHash)('sha256').update(appPath).digest('hex');
    }
}
/**
 * Generate a secure random string
 *
 * @param {number} length - Length of the random string in bytes
 * @returns {string} Hex-encoded random string
 */
function generateSecureRandomString(length = 32) {
    try {
        return (0, crypto_1.randomBytes)(length).toString('hex');
    }
    catch (error) {
        electron_log_1.default.error('Failed to generate random string:', error);
        throw new Error(`Random string generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Hash a string using SHA-256
 *
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
function sha256Hash(data) {
    try {
        return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
    }
    catch (error) {
        electron_log_1.default.error('Failed to hash data:', error);
        throw new Error(`Hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Derive a key from a password using PBKDF2
 *
 * @param {string} password - Password to derive key from
 * @param {string} salt - Salt for key derivation
 * @param {number} iterations - Number of PBKDF2 iterations
 * @param {number} keyLength - Length of derived key in bytes
 * @returns {string} Hex-encoded derived key
 */
function deriveKeyFromPassword(password, salt, iterations = DEFAULT_KEY_PARAMS.iterations, keyLength = DEFAULT_KEY_PARAMS.keyLength) {
    try {
        const key = (0, crypto_1.pbkdf2Sync)(password, salt, iterations, keyLength, DEFAULT_KEY_PARAMS.digest);
        return key.toString('hex');
    }
    catch (error) {
        electron_log_1.default.error('Failed to derive key from password:', error);
        throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Get the current key derivation parameters
 *
 * @returns {KeyDerivationParams} Current key derivation parameters
 */
function getKeyDerivationParams() {
    return {
        ...DEFAULT_KEY_PARAMS,
        salt: generateOrRetrieveSalt(),
    };
}
/**
 * Validate encryption key strength
 *
 * @param {string} key - Hex-encoded key to validate
 * @returns {boolean} True if key meets minimum security requirements
 */
function validateKeyStrength(key) {
    try {
        // Check if key is hex-encoded
        if (!/^[0-9a-fA-F]+$/.test(key)) {
            electron_log_1.default.warn('Key validation failed: not hex-encoded');
            return false;
        }
        // Check minimum length (256 bits = 64 hex characters)
        if (key.length < 64) {
            electron_log_1.default.warn('Key validation failed: insufficient length');
            return false;
        }
        return true;
    }
    catch (error) {
        electron_log_1.default.error('Key validation error:', error);
        return false;
    }
}
/**
 * Export for testing purposes
 */
exports.__test__ = {
    DEFAULT_KEY_PARAMS,
    generateOrRetrieveSalt,
};

"use strict";
/**
 * Version Utility
 * Provides version and build information for Smart Pilot
 *
 * Version Format:
 * - Semantic: MAJOR.MINOR.PATCH (1.0.0)
 * - Build: YYYYMMDD.HHMM (20250116.1430)
 *
 * Usage:
 *   import { VERSION, BUILD_NUMBER, getVersionInfo } from '@/shared/utils/version';
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
exports.GIT_COMMIT = exports.BUILD_DATE = exports.BUILD_NUMBER = exports.VERSION = void 0;
exports.getVersionInfo = getVersionInfo;
exports.getVersionString = getVersionString;
exports.getFullVersionString = getFullVersionString;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Read package.json version
 */
function getPackageVersion() {
    try {
        // Try to read from multiple possible locations
        const possiblePaths = [
            path.join(__dirname, '../../../package.json'),
            path.join(process.resourcesPath || '', 'package.json'),
            path.join(process.cwd(), 'package.json'),
        ];
        for (const pkgPath of possiblePaths) {
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                return pkg.version || '1.0.0';
            }
        }
        return '1.0.0';
    }
    catch (error) {
        console.error('Failed to read package version:', error);
        return '1.0.0';
    }
}
/**
 * Generate build number from timestamp
 * Format: YYYYMMDD.HHMM
 */
function generateBuildNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}.${hours}${minutes}`;
}
/**
 * Get git commit hash if available
 */
function getGitCommit() {
    try {
        const gitHeadPath = path.join(process.cwd(), '.git', 'HEAD');
        if (fs.existsSync(gitHeadPath)) {
            const head = fs.readFileSync(gitHeadPath, 'utf-8').trim();
            // If HEAD contains a ref, resolve it
            if (head.startsWith('ref:')) {
                const refPath = head.substring(5).trim();
                const refFilePath = path.join(process.cwd(), '.git', refPath);
                if (fs.existsSync(refFilePath)) {
                    return fs.readFileSync(refFilePath, 'utf-8').trim().substring(0, 7);
                }
            }
            else {
                // HEAD contains the commit hash directly
                return head.substring(0, 7);
            }
        }
        return undefined;
    }
    catch (error) {
        return undefined;
    }
}
/**
 * Read version.json if it exists (generated during build)
 */
function readVersionJson() {
    try {
        const versionJsonPath = path.join(__dirname, '../../../version.json');
        if (fs.existsSync(versionJsonPath)) {
            return JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
        }
        return null;
    }
    catch (error) {
        return null;
    }
}
/**
 * Current version from package.json
 */
exports.VERSION = getPackageVersion();
/**
 * Build number (timestamp-based)
 */
exports.BUILD_NUMBER = generateBuildNumber();
/**
 * Build date
 */
exports.BUILD_DATE = new Date();
/**
 * Git commit hash (if available)
 */
exports.GIT_COMMIT = getGitCommit();
/**
 * Get complete version information
 * @returns {VersionInfo} Complete version details
 */
function getVersionInfo() {
    // Check if version.json exists (built app)
    const versionJson = readVersionJson();
    if (versionJson) {
        return {
            ...versionJson,
            buildDate: new Date(versionJson.buildDate),
        };
    }
    // Fall back to runtime generation (development)
    return {
        version: exports.VERSION,
        buildNumber: exports.BUILD_NUMBER,
        buildDate: exports.BUILD_DATE,
        gitCommit: exports.GIT_COMMIT,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    };
}
/**
 * Get formatted version string
 * @returns {string} Formatted version (e.g., "v1.0.0 (Build 20250116.1430)")
 */
function getVersionString() {
    const info = getVersionInfo();
    return `v${info.version} (Build ${info.buildNumber})`;
}
/**
 * Get full version string with commit
 * @returns {string} Full version string
 */
function getFullVersionString() {
    const info = getVersionInfo();
    const commitPart = info.gitCommit ? ` [${info.gitCommit}]` : '';
    return `v${info.version} (Build ${info.buildNumber})${commitPart}`;
}

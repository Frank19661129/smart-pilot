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

import * as fs from 'fs';
import * as path from 'path';

/**
 * Read package.json version
 */
function getPackageVersion(): string {
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
  } catch (error) {
    console.error('Failed to read package version:', error);
    return '1.0.0';
  }
}

/**
 * Generate build number from timestamp
 * Format: YYYYMMDD.HHMM
 */
function generateBuildNumber(): string {
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
function getGitCommit(): string | undefined {
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
      } else {
        // HEAD contains the commit hash directly
        return head.substring(0, 7);
      }
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Read version.json if it exists (generated during build)
 */
function readVersionJson(): VersionInfo | null {
  try {
    const versionJsonPath = path.join(__dirname, '../../../version.json');
    if (fs.existsSync(versionJsonPath)) {
      return JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Version information interface
 */
export interface VersionInfo {
  version: string;
  buildNumber: string;
  buildDate: Date;
  gitCommit?: string;
  environment: 'development' | 'production';
}

/**
 * Current version from package.json
 */
export const VERSION = getPackageVersion();

/**
 * Build number (timestamp-based)
 */
export const BUILD_NUMBER = generateBuildNumber();

/**
 * Build date
 */
export const BUILD_DATE = new Date();

/**
 * Git commit hash (if available)
 */
export const GIT_COMMIT = getGitCommit();

/**
 * Get complete version information
 * @returns {VersionInfo} Complete version details
 */
export function getVersionInfo(): VersionInfo {
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
    version: VERSION,
    buildNumber: BUILD_NUMBER,
    buildDate: BUILD_DATE,
    gitCommit: GIT_COMMIT,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  };
}

/**
 * Get formatted version string
 * @returns {string} Formatted version (e.g., "v1.0.0 (Build 20250116.1430)")
 */
export function getVersionString(): string {
  const info = getVersionInfo();
  return `v${info.version} (Build ${info.buildNumber})`;
}

/**
 * Get full version string with commit
 * @returns {string} Full version string
 */
export function getFullVersionString(): string {
  const info = getVersionInfo();
  const commitPart = info.gitCommit ? ` [${info.gitCommit}]` : '';
  return `v${info.version} (Build ${info.buildNumber})${commitPart}`;
}

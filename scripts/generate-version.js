/**
 * Generate version.json for production builds
 *
 * This script creates a version.json file containing:
 * - Version from package.json
 * - Build number (timestamp-based)
 * - Build date
 * - Git commit hash (if available)
 * - Environment
 *
 * Usage:
 *   node scripts/generate-version.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Get package.json version
 */
function getPackageVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    console.error('Failed to read package.json:', error.message);
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
 * Get git commit hash
 */
function getGitCommit() {
  try {
    const commit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return commit || undefined;
  } catch (error) {
    console.warn('Could not get git commit hash:', error.message);
    return undefined;
  }
}

/**
 * Generate version info
 */
function generateVersionInfo() {
  const version = getPackageVersion();
  const buildNumber = generateBuildNumber();
  const buildDate = new Date().toISOString();
  const gitCommit = getGitCommit();
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

  return {
    version,
    buildNumber,
    buildDate,
    gitCommit,
    environment
  };
}

/**
 * Write version.json file
 */
function writeVersionFile(versionInfo) {
  const outputPath = path.join(__dirname, '..', 'version.json');

  try {
    fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2), 'utf-8');
    console.log('✓ version.json generated successfully');
    console.log('  Version:', versionInfo.version);
    console.log('  Build:', versionInfo.buildNumber);
    console.log('  Environment:', versionInfo.environment);
    if (versionInfo.gitCommit) {
      console.log('  Git Commit:', versionInfo.gitCommit);
    }
    return true;
  } catch (error) {
    console.error('✗ Failed to write version.json:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Generating version.json...');
  console.log('');

  const versionInfo = generateVersionInfo();
  const success = writeVersionFile(versionInfo);

  console.log('');

  if (!success) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateVersionInfo,
  writeVersionFile
};

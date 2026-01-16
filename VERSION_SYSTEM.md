# Smart Pilot Version System

## Overview

Smart Pilot implements a comprehensive version and build number system that provides:
- Semantic versioning (MAJOR.MINOR.PATCH)
- Auto-generated build numbers (timestamp-based)
- Git commit tracking
- Display across all UI components
- IPC API for renderer access

## Version Format

### Semantic Version
- Format: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)
- Managed in `package.json`
- Follows [Semantic Versioning 2.0.0](https://semver.org/)

### Build Number
- Format: `YYYYMMDD.HHMM` (e.g., `20250116.1430`)
- Auto-generated during build process
- Based on build timestamp

### Full Version String
- Display Format: `Smart Pilot v1.0.0 (Build 20250116.1430)`
- With Git: `v1.0.0 (Build 20250116.1430) [cd4cc27]`

## Architecture

### 1. Version Utility (`src/shared/utils/version.ts`)

Core utility providing version information:

```typescript
import { getVersionInfo, VERSION, BUILD_NUMBER } from '@/shared/utils/version';

// Get complete version info
const info = getVersionInfo();
console.log(info.version);        // "1.0.0"
console.log(info.buildNumber);    // "20250116.1430"
console.log(info.buildDate);      // Date object
console.log(info.gitCommit);      // "cd4cc27" (optional)
console.log(info.environment);    // "production" | "development"
```

### 2. IPC Handler (`src/main/ipc/version-handlers.ts`)

Exposes version information to renderer process:
- Channel: `version:get-info`
- Response includes full version details
- Initialized on app startup

### 3. Preload Bridge (`src/preload/preload.ts`)

Secure bridge to renderer:

```typescript
// Exposed via window.smartPilot.getVersionInfo()
const response = await window.smartPilot.getVersionInfo();
if (response.success) {
  const { version, buildNumber, buildDate } = response.data;
}
```

### 4. Build Script (`scripts/generate-version.js`)

Generates `version.json` during build:
- Reads version from `package.json`
- Generates timestamp-based build number
- Captures git commit hash (if available)
- Creates `version.json` in root directory

## UI Integration

### 1. Window Title
- Format: `Smart Pilot v1.0.0`
- Set in main process on window creation
- File: `src/main/index.ts`

### 2. Title Bar Component
- Displays version next to app name
- Format: `Smart Pilot v1.0.0`
- File: `src/renderer/components/TitleBar.tsx`

### 3. Splash Screen
- Shows version during app initialization
- Format: `v1.0.0`
- File: `src/renderer/components/SplashScreen.tsx`

### 4. Settings Panel - About Section
- Comprehensive version display
- Shows:
  - Version number
  - Build number
  - Build date and time
  - Environment (Development/Production)
  - Git commit hash (if available)
- "Check for Updates" button (placeholder)
- Copyright notice
- File: `src/renderer/components/SettingsPanel.tsx`

### 5. Console Logging
- Logs version info on app startup
- Formatted banner display
- File: `src/main/index.ts`

```
============================================================
Smart Pilot v1.0.0 (Build 20250116.1430)
============================================================
Platform: win32
Electron version: 28.2.0
Node version: 18.17.1
Environment: development
Git commit: cd4cc27
Build date: 2025-01-16T14:30:00.000Z
============================================================
```

## Build Process

### Development
Version is read from `package.json` at runtime:
```bash
npm run dev
# Version info generated dynamically
```

### Production Build
Version is baked into `version.json`:
```bash
npm run build
# Runs: node scripts/generate-version.js
# Creates: version.json
```

### Package for Distribution
```bash
npm run package
# or
npm run package:portable

# Pre-build hook generates version.json
# Electron-builder includes version.json in build
```

### Manual Version Generation
```bash
npm run version:generate
# Generates version.json manually
```

## Updating Version

### 1. Update package.json
```json
{
  "version": "1.1.0"
}
```

### 2. Commit Changes
```bash
git add package.json
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
```

### 3. Build
```bash
npm run build
# version.json will be generated with new version
```

## Files Modified/Created

### Created
- `src/shared/utils/version.ts` - Version utility
- `src/main/ipc/version-handlers.ts` - IPC handlers
- `scripts/generate-version.js` - Build script
- `version.json` - Generated version file (git-ignored)
- `VERSION_SYSTEM.md` - This documentation

### Modified
- `package.json` - Updated version to 1.0.0, added build scripts
- `src/shared/types/index.ts` - Added VersionInfo type and IPC channel
- `src/shared/types.ts` - Added getVersionInfo to SmartPilotAPI
- `src/main/index.ts` - Added version logging and window title
- `src/preload/preload.ts` - Exposed getVersionInfo to renderer
- `src/renderer/components/TitleBar.tsx` - Display version
- `src/renderer/components/SettingsPanel.tsx` - About section with full details
- `src/renderer/components/SplashScreen.tsx` - Version on splash

## Git Ignore

Add to `.gitignore`:
```
version.json
```

This prevents the generated build file from being committed.

## Best Practices

### Version Numbering
- **MAJOR**: Breaking changes, incompatible API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Build Numbers
- Auto-generated, don't manually edit
- Unique per build
- Timestamp-based for traceability

### Git Commits
- Tag releases: `git tag v1.0.0`
- Use semantic commit messages
- Keep package.json version in sync

## Future Enhancements

1. **Auto-Update Integration**
   - Implement actual update checking
   - Compare versions with remote server
   - Download and install updates

2. **Release Notes**
   - Link to CHANGELOG.md
   - Display what's new after updates

3. **Beta/Alpha Channels**
   - Support pre-release versions (1.0.0-beta.1)
   - Different channels for testing

4. **Crash Reporting Integration**
   - Include version in crash reports
   - Track issues by version/build

## Testing

### Test Version Display
1. Run app: `npm run dev`
2. Check splash screen for version
3. Open app, check title bar
4. Open settings, verify About section
5. Check console logs for version banner

### Test Build Generation
```bash
npm run version:generate
cat version.json
```

### Test Production Build
```bash
npm run build
# Verify version.json is created
# Check dist folder includes version.json
```

## Troubleshooting

### Version Not Showing in UI
1. Check console for errors
2. Verify IPC handler is registered
3. Check preload exposes getVersionInfo
4. Verify window.smartPilot is available

### Build Number Not Updating
1. Delete version.json
2. Run `npm run version:generate`
3. Verify new build number

### Git Commit Not Captured
1. Ensure git is installed
2. Check you're in a git repository
3. Verify commits exist: `git log`

## Support

For issues or questions about the version system:
- Check logs in console
- Verify all files are properly imported
- Ensure build scripts run successfully
- Review IPC communication in DevTools

---

**Version System Implementation**: Complete
**Status**: Production Ready
**Last Updated**: January 16, 2026

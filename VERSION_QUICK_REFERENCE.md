# Version Display Quick Reference

## Smart Pilot v1.0.0 - Version Locations

### 1. Window Title
```
┌─────────────────────────────┐
│ Smart Pilot v1.0.0      □ × │
└─────────────────────────────┘
```

### 2. Title Bar (In-App)
```
┌──────────────────────────────────────────┐
│ ⚫ Smart Pilot v1.0.0 [APP]   ⚙️ − ×    │
└──────────────────────────────────────────┘
```

### 3. Splash Screen
```
        ╔═══╗
        ║ ID ║
        ╚═══╝

    Smart Pilot
      v1.0.0

AI Assistant for Insurance Data
```

### 4. Settings - About Section
```
ℹ️  About Smart Pilot

Version:      1.0.0
Build:        20250116.1430
Build Date:   1/16/2025 2:30 PM
Environment:  Development
Git Commit:   cd4cc27

[ Check for Updates ]
```

### 5. Console Log
```
============================================================
Smart Pilot v1.0.0 (Build 20250116.1430)
============================================================
Platform: win32
Electron version: 28.2.0
Environment: development
Git commit: cd4cc27
============================================================
```

## Access Version Info

### From Renderer
```typescript
const response = await window.smartPilot.getVersionInfo();
console.log(response.data.version); // "1.0.0"
```

### From Main Process
```typescript
import { getVersionInfo } from '../shared/utils/version';
const info = getVersionInfo();
```

## Build Commands
```bash
# Generate version file
npm run version:generate

# Build with version
npm run build

# Package for distribution
npm run package
```

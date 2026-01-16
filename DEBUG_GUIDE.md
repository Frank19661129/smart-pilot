# Smart Pilot - Debug Guide

## Lokaal Draaien voor Debugging

### Quick Start

```bash
cd D:\dev\insurance-data\id-smartpilot

# Install dependencies (als nog niet gedaan)
npm install

# Start in development mode
npm run dev
```

Dit opent de app met:
- ✅ Developer Tools automatisch open
- ✅ Hot reload enabled
- ✅ Uitgebreide console logging
- ✅ Source maps voor debugging

---

## Log Bestanden Locaties

### Windows Log Locaties

**Development**:
```
%APPDATA%\smart-pilot\logs\smart-pilot.log
```

**Production (Installed)**:
```
%LOCALAPPDATA%\Programs\smart-pilot\logs\smart-pilot.log
```

**Portable**:
```
[APP_FOLDER]\logs\smart-pilot.log
```

### Snel Log Bestand Openen

```powershell
# Development logs
notepad "%APPDATA%\smart-pilot\logs\smart-pilot.log"

# Of gebruik Explorer
explorer "%APPDATA%\smart-pilot\logs"
```

---

## Logging Levels

De app logt op meerdere niveaus:

- **DEBUG**: Zeer gedetailleerd (alle events)
- **INFO**: Normale operaties
- **WARN**: Waarschuwingen
- **ERROR**: Fouten en crashes

### Log Formaat

```
[2026-01-16 21:30:45.123] [info] Smart Pilot v1.0.0 starting...
[2026-01-16 21:30:45.456] [debug] Loading window...
[2026-01-16 21:30:45.789] [error] Failed to connect: ECONNREFUSED
```

---

## Wat wordt Gelogd

### Startup Sequence

1. **App Initialization**
   ```
   ============================================================
   Smart Pilot v1.0.0 (Build 20260116.2118)
   ============================================================
   Platform: win32
   Electron version: 28.2.0
   Node version: 18.17.1
   App path: D:\dev\insurance-data\id-smartpilot
   User data: C:\Users\...\AppData\Roaming\smart-pilot
   ```

2. **Window Creation**
   ```
   Creating main window...
   Preload path: D:\...\dist\main\preload\preload.js
   BrowserWindow created successfully
   Loading file: D:\...\dist\renderer\index.html
   ```

3. **IPC Handlers**
   ```
   Initializing IPC handlers...
   Window handlers initialized
   Auth handlers initialized
   Version handlers initialized
   ```

4. **Page Loading**
   ```
   Page started loading...
   Page finished loading successfully
   Window ready to show
   ```

### Runtime Logging

- **WebSocket**: Connection, disconnection, messages
- **Authentication**: Login attempts, token refresh
- **Window Detection**: Browser/app window detection
- **IPC Calls**: All communication between main/renderer
- **Errors**: All exceptions met stack traces

---

## Development Mode

### Start Dev Server

```bash
npm run dev
```

Dit start:
1. Vite dev server voor renderer (poort 3000)
2. TypeScript compiler voor main process
3. Electron met DevTools open

### Dev Tools Shortcuts

- `Ctrl+Shift+I` - Toggle DevTools
- `Ctrl+R` - Reload window
- `Ctrl+Shift+R` - Hard reload (clear cache)
- `F5` - Reload
- `F12` - Toggle DevTools

---

## Common Issues & Debugging

### Issue 1: "Failed to load index.html"

**Log Check**:
```
Loading file: D:\...\dist\renderer\index.html
Failed to load index.html: Error: ENOENT
```

**Solution**:
```bash
# Build missing files
npm run build
```

### Issue 2: "Preload script failed"

**Log Check**:
```
Error: Unable to load preload script
```

**Solution**:
```bash
# Check preload exists
dir dist\main\preload\preload.js

# Rebuild if missing
npm run build:main
```

### Issue 3: "WebSocket connection failed"

**Log Check**:
```
WebSocket error: connect ECONNREFUSED 192.168.2.5:443
```

**Solution**:
```bash
# Test backend connectivity
curl -k https://192.168.2.5/health

# Check nginx is running
docker ps | grep nginx
```

### Issue 4: "JavaScript Error"

**Log Check**:
```
[Renderer Console] Uncaught ReferenceError: ... is not defined
```

**Solution**:
- Open DevTools (Ctrl+Shift+I)
- Check Console tab for full error
- Check Sources tab for line number
- Check if all modules are built

---

## Debugging Renderer Process

### Enable Source Maps

Source maps zijn enabled in development mode.

### React DevTools

Install React DevTools extension voor Electron:

```bash
npm install --save-dev electron-devtools-installer react-devtools
```

### Console Logging

Renderer logs verschijnen in:
1. **DevTools Console** (in app)
2. **electron-log** (in log file)
3. **Terminal** (where you ran `npm run dev`)

---

## Debugging Main Process

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Electron Main",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "program": "${workspaceFolder}/dist/main/index.js",
      "protocol": "inspector",
      "preLaunchTask": "npm: build:main"
    }
  ]
}
```

### Attach Debugger

In dev mode, main process runs with `--inspect=5858`:

```bash
# Start app
npm run dev

# In Chrome
chrome://inspect
> Configure > Add localhost:5858
> Click "inspect" under target
```

---

## Network Debugging

### Monitor WebSocket

1. Open DevTools
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. Watch connections and messages

### Monitor HTTP Requests

1. Open DevTools
2. Go to **Network** tab
3. Watch all API calls
4. Check:
   - Request headers
   - Response status
   - Response body

---

## Performance Debugging

### Check Memory Usage

```javascript
// In DevTools Console
window.performance.memory
```

### Check Render Performance

1. Open DevTools
2. Go to **Performance** tab
3. Click Record
4. Interact with app
5. Stop recording
6. Analyze timeline

---

## Build Debugging

### Check Build Output

```bash
npm run build

# Check files were created
dir dist\renderer
dir dist\main
```

### Build with Verbose Output

```bash
# Renderer
npm run build:renderer -- --debug

# Main
npm run build:main -- --verbose
```

---

## Crash Reporting

### Where Crashes are Logged

All crashes zijn gelogd in `smart-pilot.log`:

```
[ERROR] UNCAUGHT EXCEPTION: TypeError: Cannot read property 'x' of undefined
Stack: Error
    at Object.<anonymous> (D:\...\dist\main\index.js:123:45)
```

### Send Crash Reports

For production, overweeg integratie met:
- **Sentry** - Real-time error tracking
- **Bugsnag** - Crash reporting
- **LogRocket** - Session replay

---

## Testing Checklist

### Before Reporting an Issue

- [ ] Check log file for errors
- [ ] Try running with `npm run dev`
- [ ] Check if backend is accessible (`curl -k https://192.168.2.5/health`)
- [ ] Rebuild app (`npm run build`)
- [ ] Clear user data folder
- [ ] Try portable version vs installed
- [ ] Check Windows Event Viewer

### Information to Provide

When reporting an issue, include:

1. **Log file** (`smart-pilot.log`)
2. **Error message** (from DevTools console)
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **System info**:
   - Windows version
   - Node version (`node --version`)
   - npm version (`npm --version`)

---

## Quick Debugging Commands

```bash
# View logs in real-time
Get-Content "%APPDATA%\smart-pilot\logs\smart-pilot.log" -Wait -Tail 50

# Clear logs
del "%APPDATA%\smart-pilot\logs\*.log"

# Clear user data
rmdir /s "%APPDATA%\smart-pilot"

# Rebuild everything
npm run build && npm start

# Dev mode with verbose
$env:DEBUG="*"; npm run dev
```

---

## Electron-Log API

### In Main Process

```typescript
import log from 'electron-log';

log.info('Info message');
log.warn('Warning');
log.error('Error');
log.debug('Debug details');
```

### In Renderer Process

Gebruik window.electronAPI (via preload):

```typescript
window.console.log('Automatically logged to file');
```

---

## Remote Debugging

### Access from Another Machine

1. Start app with remote debugging:
   ```bash
   electron . --remote-debugging-port=9222
   ```

2. Open in Chrome on same network:
   ```
   http://[YOUR-IP]:9222
   ```

---

## Summary

**Voor snelle debug**:
```bash
npm run dev
```

**Voor logs**:
```
%APPDATA%\smart-pilot\logs\smart-pilot.log
```

**Voor crashes**:
Check log file en DevTools console

**Voor network issues**:
Check DevTools Network tab + backend connectivity

Good luck! 🐛🔍

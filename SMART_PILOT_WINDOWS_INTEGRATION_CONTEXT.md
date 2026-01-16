# Smart Pilot - Windows Integration Context

## Overview

Smart Pilot is an Electron application that integrates with Windows APIs to detect and monitor:
1. All visible application windows on the system
2. Browser windows and tabs (Chrome, Edge, Firefox, etc.)
3. Session context (physical machine vs virtual environments like AVD, Citrix, RDS)

This document provides comprehensive context for developers working with the Windows integration codebase.

---

## Architecture

### Technology Stack

- **Electron 28+**: Cross-platform desktop framework
- **TypeScript 5.3+**: Type-safe development
- **ffi-napi**: Foreign Function Interface for calling Windows API functions
- **ref-napi**: C pointer and type management for FFI
- **Node.js Native Addons**: Low-level system integration

### Project Structure

```
id-smartpilot/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # Application entry point
│   │   ├── ipc/
│   │   │   └── window-handlers.ts     # IPC handlers for window detection
│   │   └── windows-integration/
│   │       ├── window-detector.ts     # Core window enumeration logic
│   │       └── session-detector.ts    # Session context detection
│   ├── preload/
│   │   └── preload.ts                 # Secure IPC bridge (contextBridge)
│   ├── renderer/
│   │   └── index.html                 # Demo UI
│   └── shared/
│       └── types/
│           └── windows.ts             # Shared TypeScript types
├── package.json
└── tsconfig.json
```

---

## Windows APIs Used

### User32.dll

Used for window enumeration and information retrieval.

| Function | Purpose | Documentation |
|----------|---------|---------------|
| `EnumWindows` | Enumerate all top-level windows | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows) |
| `GetWindowTextW` | Get window title (Unicode) | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowtextw) |
| `GetClassNameW` | Get window class name | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclassnamew) |
| `IsWindowVisible` | Check if window is visible | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswindowvisible) |
| `GetWindowThreadProcessId` | Get process ID from window | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid) |
| `GetWindowRect` | Get window position and size | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowrect) |
| `GetForegroundWindow` | Get currently focused window | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow) |

### Kernel32.dll

Used for process information and handle management.

| Function | Purpose | Documentation |
|----------|---------|---------------|
| `OpenProcess` | Open handle to process | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocess) |
| `CloseHandle` | Close handle | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle) |
| `QueryFullProcessImageNameW` | Get full process executable path | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryfullprocessimagenamew) |
| `GetCurrentProcessId` | Get current process ID | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentprocessid) |
| `ProcessIdToSessionId` | Get session ID from process | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-processidtosessionid) |
| `GetSystemMetrics` | Get system metrics (including remote session detection) | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics) |

### Wtsapi32.dll

Used for Terminal Services and session information.

| Function | Purpose | Documentation |
|----------|---------|---------------|
| `WTSQuerySessionInformationW` | Query session information | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsquerysessioninformationw) |
| `WTSFreeMemory` | Free memory allocated by WTS functions | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsfreememory) |
| `WTSGetActiveConsoleSessionId` | Get active console session ID | [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-wtsgetactiveconsolesessionid) |

---

## Core Components

### 1. WindowDetector Class

**File**: `src/main/windows-integration/window-detector.ts`

Handles enumeration and detection of all Windows applications and browser tabs.

#### Key Methods

```typescript
class WindowDetector {
  // Get all visible windows on the system
  async getAllWindows(): Promise<WindowsDetectionResult>

  // Get all browser windows and extract tab information
  async getBrowserTabs(): Promise<BrowserDetectionResult>

  // Get the currently active/focused window
  async getActiveWindow(): Promise<WindowInfo | null>

  // Filter windows by process name
  async getWindowsByProcess(processName: string): Promise<WindowInfo[]>

  // Filter windows by window class name
  async getWindowsByClassName(className: string): Promise<WindowInfo[]>
}
```

#### Browser Detection Strategy

**Supported Browsers**:
- Google Chrome (`chrome.exe`)
- Microsoft Edge (`msedge.exe`)
- Mozilla Firefox (`firefox.exe`)
- Brave Browser (`brave.exe`)
- Opera (`opera.exe`)

**Detection Methods**:

1. **Window Title Parsing** (Fallback)
   - Parses window titles to extract tab information
   - Most reliable for all browsers
   - Format: `"Page Title - Browser Name"`

2. **Chrome DevTools Protocol** (Advanced - Future Enhancement)
   - For Chrome/Edge when started with `--remote-debugging-port`
   - Provides actual tab URLs, favicons, and detailed metadata
   - Requires browser to be launched with debugging enabled

#### Example Usage

```typescript
const detector = new WindowDetector();

// Get all windows
const { windows, totalCount, errors } = await detector.getAllWindows();
console.log(`Found ${totalCount} windows`);

// Get browser tabs
const { tabs } = await detector.getBrowserTabs();
tabs.forEach(tab => {
  console.log(`${tab.browser}: ${tab.title}`);
});

// Get active window
const activeWindow = await detector.getActiveWindow();
console.log(`Active: ${activeWindow?.title}`);
```

---

### 2. SessionDetector Class

**File**: `src/main/windows-integration/session-detector.ts`

Detects the type of Windows session and virtual environment.

#### Key Methods

```typescript
class SessionDetector {
  // Get complete session context
  async getSessionContext(): Promise<SessionContext>

  // Quick check if session is remote
  isCurrentSessionRemote(): boolean

  // Get session type description
  static getSessionTypeDescription(type: SessionType): string
}
```

#### Session Type Detection

The detector identifies the following session types:

| Session Type | Description | Detection Method |
|--------------|-------------|------------------|
| `physical` | Physical Windows machine | `GetSystemMetrics(SM_REMOTESESSION)` returns 0 |
| `avd` | Azure Virtual Desktop | Registry keys under `HKLM\SOFTWARE\Microsoft\RDInfraAgent` |
| `citrix` | Citrix Virtual Apps/Desktops | Registry keys or processes like `wfshell.exe` |
| `terminal-server` | Windows Terminal Server/RDS | Registry `TSEnabled` flag or `SESSIONNAME` env var |
| `rdp` | Generic RDP session | `WTSClientProtocolType` = RDP |
| `unknown` | Cannot determine | Error or unsupported environment |

#### Detection Workflow

```
1. Check GetSystemMetrics(SM_REMOTESESSION)
   ├─ 0 → Physical machine
   └─ Non-zero → Remote session
       ├─ Check AVD registry keys
       ├─ Check Citrix registry keys/processes
       ├─ Check Terminal Server flags
       └─ Check WTS protocol type
```

#### Registry Keys Checked

**Azure Virtual Desktop (AVD)**:
```
HKLM\SOFTWARE\Microsoft\RDInfraAgent
HKLM\SOFTWARE\Microsoft\Terminal Server Client\Default\AddIns\WebRTC Redirector
HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server\AddIns\Azure Virtual Desktop
```

**Citrix**:
```
HKLM\SOFTWARE\Citrix\ICA Client
HKLM\SOFTWARE\Wow6432Node\Citrix\ICA Client
HKLM\SYSTEM\CurrentControlSet\Services\CtxSbx
```

**Terminal Server**:
```
HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server
  Value: TSEnabled = 0x1
```

#### Example Usage

```typescript
const detector = new SessionDetector();

// Get full session context
const context = await detector.getSessionContext();
console.log(`Session Type: ${context.type}`);
console.log(`Is Remote: ${context.isRemote}`);
console.log(`Session ID: ${context.sessionId}`);

if (context.type === 'avd') {
  console.log('Running in Azure Virtual Desktop');
} else if (context.type === 'citrix') {
  console.log('Running in Citrix');
}

// Quick remote check
if (detector.isCurrentSessionRemote()) {
  console.log('This is a remote session');
}
```

---

### 3. IPC Handlers

**File**: `src/main/ipc/window-handlers.ts`

Provides secure IPC communication between Electron main and renderer processes.

#### Registered Handlers

| IPC Channel | Parameters | Returns | Description |
|-------------|------------|---------|-------------|
| `get-all-windows` | None | `WindowsDetectionResult` | Get all visible windows |
| `get-browser-tabs` | None | `BrowserDetectionResult` | Get browser windows and tabs |
| `get-active-window` | None | `WindowInfo \| null` | Get currently focused window |
| `get-windows-by-process` | `processName: string` | `WindowInfo[]` | Filter windows by process |
| `get-windows-by-class` | `className: string` | `WindowInfo[]` | Filter windows by class |
| `get-session-context` | None | `SessionContext` | Get session context |
| `is-remote-session` | None | `boolean` | Quick remote session check |
| `get-window-details` | `windowHandle: number` | `WindowInfo \| null` | Get details for specific window |

#### Response Format

All handlers return a consistent response format:

```typescript
// Success
{
  success: true,
  data: T,
  timestamp: number
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

#### Security Considerations

1. **Input Validation**: All user inputs are validated before processing
2. **Error Handling**: Errors are caught and returned safely
3. **No Direct API Exposure**: Renderer cannot directly call Windows APIs
4. **Context Isolation**: Uses Electron's `contextBridge` for security

---

### 4. Preload Script

**File**: `src/preload/preload.ts`

Bridges the main and renderer processes securely using Electron's context isolation.

#### Exposed API

```typescript
interface WindowsAPI {
  // Window detection
  getAllWindows: () => Promise<WindowsDetectionResult>;
  getBrowserTabs: () => Promise<BrowserDetectionResult>;
  getActiveWindow: () => Promise<WindowInfo | null>;
  getWindowsByProcess: (processName: string) => Promise<WindowInfo[]>;
  getWindowsByClassName: (className: string) => Promise<WindowInfo[]>;
  getWindowDetails: (windowHandle: number) => Promise<WindowInfo | null>;

  // Session detection
  getSessionContext: () => Promise<SessionContext>;
  isRemoteSession: () => Promise<boolean>;
}
```

#### Usage in Renderer

```typescript
// The API is available on window.windowsAPI
const windows = await window.windowsAPI.getAllWindows();
const session = await window.windowsAPI.getSessionContext();
```

---

## Type Definitions

**File**: `src/shared/types/windows.ts`

### WindowInfo

```typescript
interface WindowInfo {
  title: string;              // Window title text
  className: string;          // Windows class name
  processName: string;        // Process name (e.g., "chrome.exe")
  processId: number;          // Process ID
  windowHandle: number;       // Window handle (HWND)
  icon?: string;              // Window icon (base64) - future
  isVisible: boolean;         // Whether window is visible
  bounds?: {                  // Window position and size
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### BrowserTab

```typescript
interface BrowserTab {
  browser: 'chrome' | 'edge' | 'firefox' | 'brave' | 'opera' | 'unknown';
  title: string;              // Tab title
  url?: string;               // Tab URL (if accessible)
  favicon?: string;           // Favicon (if accessible)
  tabIndex?: number;          // Tab index within browser
  processId: number;          // Parent browser process ID
  isActive: boolean;          // Whether tab is focused
}
```

### SessionContext

```typescript
type SessionType = 'physical' | 'avd' | 'citrix' | 'terminal-server' | 'rdp' | 'unknown';

interface SessionContext {
  type: SessionType;          // Type of session
  sessionId: number;          // Windows session ID
  hostName?: string;          // Host name
  isRemote: boolean;          // Whether session is remote
  clientName?: string;        // Client name (for remote)
  protocol?: 'RDP' | 'ICA' | 'PCoIP' | 'Unknown';
  metadata?: Record<string, unknown>;  // Additional metadata
}
```

---

## Security Considerations

### 1. Permissions and Access Rights

**Process Access**:
- Requires `PROCESS_QUERY_INFORMATION | PROCESS_VM_READ` rights
- Some processes may be protected (e.g., SYSTEM processes)
- Graceful handling of access denied errors

**Admin Rights**:
- Most functionality works without admin rights
- Some system processes may require elevation
- Registry access for session detection usually works for current user

### 2. Data Exposure

**What is Exposed**:
- Window titles (may contain sensitive information)
- Process names and paths
- Window positions and sizes
- Session information

**Mitigations**:
- Data stays local (no network transmission by default)
- Renderer process cannot directly access Windows APIs
- Input validation on all IPC handlers

### 3. Context Isolation

**Security Model**:
```
Renderer Process (Untrusted)
    ↓ (contextBridge)
Preload Script (Bridge)
    ↓ (IPC)
Main Process (Trusted)
    ↓ (FFI)
Windows APIs
```

**Key Points**:
- `nodeIntegration: false` in renderer
- `contextIsolation: true` enforced
- Only specific APIs exposed via `contextBridge`
- No direct Windows API access from renderer

### 4. Error Handling

**Strategy**:
- Catch all errors at API boundaries
- Return safe error objects (no stack traces to renderer in production)
- Log errors securely in main process
- Continue operation on non-critical errors

---

## Limitations and Known Issues

### Current Limitations

1. **Browser Tab URLs**
   - Only accessible when Chrome/Edge started with `--remote-debugging-port`
   - Default behavior: Parse from window title (no URL)
   - Future enhancement: Implement Chrome DevTools Protocol integration

2. **Window Icons**
   - Not currently implemented
   - Would require additional Windows APIs (`GetClassLongPtr`, icon extraction)

3. **Process Access**
   - Some system processes cannot be accessed without admin rights
   - Protected processes (SYSTEM, TrustedInstaller) may fail gracefully
   - UWP apps may have different window characteristics

4. **Performance**
   - Window enumeration is synchronous in Windows API
   - Large number of windows (100+) may take longer
   - Consider caching or throttling for real-time monitoring

5. **Virtual Environment Detection**
   - VMware Horizon detected as generic Terminal Server
   - Some VDI solutions may not have distinct registry markers
   - Detection relies on registry keys that may vary by version

### Known Issues

1. **Unicode Handling**
   - Using `GetWindowTextW` (Unicode version) for proper internationalization
   - Some special characters may not display correctly in all contexts

2. **Memory Management**
   - FFI callbacks must be careful with garbage collection
   - `WTSFreeMemory` must be called to prevent leaks
   - Process handles must be closed after use

3. **Timing Issues**
   - Window enumeration is a snapshot in time
   - Windows may close during enumeration
   - Active window may change between calls

---

## Testing Approach

### Unit Testing

**Test Files** (to be created):
```
tests/
├── unit/
│   ├── window-detector.test.ts
│   ├── session-detector.test.ts
│   └── window-handlers.test.ts
```

**Test Scenarios**:

1. **WindowDetector**
   - Mock Windows API responses
   - Test error handling for inaccessible windows
   - Test browser process detection
   - Test window filtering

2. **SessionDetector**
   - Mock registry queries
   - Test each session type detection
   - Test error handling
   - Test metadata collection

3. **IPC Handlers**
   - Test request/response format
   - Test input validation
   - Test error responses
   - Test concurrent requests

### Integration Testing

**Manual Testing Checklist**:

- [ ] Run on physical Windows machine
- [ ] Run in Azure Virtual Desktop
- [ ] Run in Citrix environment
- [ ] Run in RDP session
- [ ] Test with multiple browsers open
- [ ] Test with various applications open
- [ ] Test with admin rights
- [ ] Test without admin rights
- [ ] Test error scenarios (access denied, etc.)

### Performance Testing

**Metrics to Monitor**:
- Time to enumerate windows (target: <100ms for 50 windows)
- Memory usage during enumeration
- IPC round-trip time (target: <50ms)
- CPU usage during continuous monitoring

---

## Code Examples

### Example 1: Monitor Active Window Changes

```typescript
import { WindowDetector } from './windows-integration/window-detector';

const detector = new WindowDetector();

// Poll active window every 500ms
setInterval(async () => {
  const activeWindow = await detector.getActiveWindow();
  if (activeWindow) {
    console.log(`Active: ${activeWindow.processName} - ${activeWindow.title}`);
  }
}, 500);
```

### Example 2: Track Browser Activity

```typescript
import { WindowDetector } from './windows-integration/window-detector';

const detector = new WindowDetector();

async function trackBrowsers() {
  const { tabs } = await detector.getBrowserTabs();

  const grouped = tabs.reduce((acc, tab) => {
    if (!acc[tab.browser]) acc[tab.browser] = [];
    acc[tab.browser].push(tab);
    return acc;
  }, {} as Record<string, typeof tabs>);

  console.log('Browser Activity:');
  for (const [browser, browserTabs] of Object.entries(grouped)) {
    console.log(`  ${browser}: ${browserTabs.length} tabs`);
    browserTabs.forEach(tab => {
      console.log(`    - ${tab.title} ${tab.isActive ? '(active)' : ''}`);
    });
  }
}

setInterval(trackBrowsers, 5000);
```

### Example 3: Session Context Alert

```typescript
import { SessionDetector } from './windows-integration/session-detector';

const detector = new SessionDetector();

async function checkSessionContext() {
  const context = await detector.getSessionContext();

  if (context.isRemote) {
    console.warn(`WARNING: Running in remote session (${context.type})`);
    console.log(`  Session ID: ${context.sessionId}`);
    console.log(`  Protocol: ${context.protocol}`);
    console.log(`  Client: ${context.clientName || 'Unknown'}`);

    // Take appropriate action
    if (context.type === 'avd') {
      console.log('Azure Virtual Desktop detected - enabling optimizations');
    }
  } else {
    console.log('Running on physical machine');
  }
}

checkSessionContext();
```

### Example 4: Application Window Filter

```typescript
import { WindowDetector } from './windows-integration/window-detector';

const detector = new WindowDetector();

async function findOfficeWindows() {
  const officeProcesses = ['WINWORD.EXE', 'EXCEL.EXE', 'POWERPNT.EXE', 'OUTLOOK.EXE'];
  const officeWindows = [];

  for (const process of officeProcesses) {
    const windows = await detector.getWindowsByProcess(process);
    officeWindows.push(...windows);
  }

  console.log(`Found ${officeWindows.length} Microsoft Office windows:`);
  officeWindows.forEach(win => {
    console.log(`  ${win.processName}: ${win.title}`);
  });

  return officeWindows;
}

findOfficeWindows();
```

### Example 5: Renderer Usage (HTML/JavaScript)

```html
<script>
  async function displayWindowInfo() {
    try {
      // Get all windows
      const result = await window.windowsAPI.getAllWindows();
      console.log(`Total windows: ${result.totalCount}`);

      // Get session context
      const session = await window.windowsAPI.getSessionContext();
      console.log(`Session type: ${session.type}`);

      // Get browser tabs
      const browsers = await window.windowsAPI.getBrowserTabs();
      console.log(`Browser tabs: ${browsers.tabs.length}`);

      // Display results
      document.getElementById('window-count').textContent = result.totalCount;
      document.getElementById('session-type').textContent = session.type;

    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  displayWindowInfo();
</script>
```

---

## Future Enhancements

### Phase 1 (Current Implementation)
- [x] Basic window enumeration
- [x] Browser detection via window titles
- [x] Session context detection (AVD, Citrix, RDS)
- [x] IPC handlers with secure communication
- [x] Demo UI

### Phase 2 (Planned)
- [ ] Chrome DevTools Protocol integration for real tab URLs
- [ ] Window icon extraction
- [ ] Window change notifications (hooks)
- [ ] Performance optimizations (caching, debouncing)
- [ ] Accessibility API integration for deeper tab info

### Phase 3 (Future)
- [ ] Real-time window monitoring with events
- [ ] Screenshot capabilities per window
- [ ] Window focus/activation control
- [ ] Application launch detection
- [ ] Browser history integration
- [ ] Cross-platform support (macOS, Linux)

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module 'ffi-napi'`
```bash
# Solution: Install native dependencies
npm install --save ffi-napi ref-napi ref-struct-napi ref-array-napi
npm rebuild
```

**Issue**: "Access Denied" errors when accessing certain processes
```typescript
// Solution: Check process access rights and handle gracefully
try {
  const processName = this.getProcessName(processId);
} catch (error) {
  // Fallback to 'unknown' for inaccessible processes
  return 'unknown';
}
```

**Issue**: Window enumeration returns empty results
```typescript
// Solution: Ensure callback is properly bound and continues enumeration
const callback = ffi.Callback(BOOL, [HWND, LPARAM], (hwnd, lParam) => {
  this.processWindow(hwnd);
  return 1; // MUST return 1 to continue enumeration
});
```

**Issue**: Session detection always returns 'physical'
```bash
# Solution: Check registry access permissions
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server"
# If access denied, run with elevated privileges
```

### Debug Mode

Enable verbose logging:

```typescript
// In window-detector.ts
private processWindow(hwnd: Buffer): boolean {
  console.log(`Processing window: handle=${ref.address(hwnd)}`);
  // ... rest of code
}

// In session-detector.ts
async getSessionContext(): Promise<SessionContext> {
  console.log('Detecting session context...');
  console.log(`Session ID: ${this.sessionId}`);
  console.log(`Is Remote: ${this.isRemote}`);
  // ... rest of code
}
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | ^28.0.0 | Desktop application framework |
| `ffi-napi` | ^4.0.3 | Foreign function interface for Windows API |
| `ref-napi` | ^3.0.3 | C pointer management |
| `ref-struct-napi` | ^1.1.1 | C struct definitions |
| `ref-array-napi` | ^1.2.2 | C array handling |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.0 | Type-safe development |
| `@types/node` | ^20.10.0 | Node.js type definitions |
| `@types/ffi-napi` | ^4.0.9 | FFI type definitions |
| `jest` | ^29.7.0 | Testing framework |

---

## Build and Deployment

### Development Build

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

### Production Build

```bash
# Clean build
rm -rf dist/
npm run build

# Package for Windows
npm install -g electron-builder
electron-builder --windows
```

### Distribution

```bash
# Create installer
electron-builder --windows --x64

# Output: dist/Smart Pilot Setup 1.0.0.exe
```

---

## Additional Resources

### Official Documentation

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Windows API Documentation](https://docs.microsoft.com/en-us/windows/win32/api/)
- [ffi-napi Documentation](https://github.com/node-ffi-napi/node-ffi-napi)

### Related Projects

- [active-win](https://github.com/sindresorhus/active-win) - Similar active window detection
- [windows-window-manager](https://github.com/evanshortiss/windows-window-manager) - Window management utilities

### Community

- [Electron Discord](https://discord.com/invite/electron)
- [Stack Overflow - Electron](https://stackoverflow.com/questions/tagged/electron)
- [Stack Overflow - Windows API](https://stackoverflow.com/questions/tagged/winapi)

---

## License

MIT License - See LICENSE file for details

---

## Contributors

- Smart Pilot Development Team

---

## Changelog

### Version 1.0.0 (2026-01-16)
- Initial implementation
- Window enumeration via Windows API
- Browser tab detection
- Session context detection (AVD, Citrix, RDS)
- Secure IPC handlers
- Demo UI

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-16
**Maintained By**: Smart Pilot Team

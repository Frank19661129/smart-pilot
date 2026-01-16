/**
 * WindowDetector - Detects and enumerates Windows applications and browser tabs
 *
 * Uses Windows API via ffi-napi to enumerate windows and detect browser tabs
 * Supports Chrome, Edge, Firefox, and other browsers
 */

import ffi from 'ffi-napi';
import ref from 'ref-napi';
import StructType from 'ref-struct-napi';
import {
  WindowInfo,
  BrowserTab,
  WindowsDetectionResult,
  BrowserDetectionResult,
  WindowDetectorError
} from '../../shared/types/windows';

// Windows API types
const HWND = ref.refType('void');
const LPARAM = ref.types.int64;
const BOOL = ref.types.bool;
const DWORD = ref.types.uint32;
const LONG = ref.types.long;

// RECT structure for window bounds
const RECT = StructType({
  left: LONG,
  top: LONG,
  right: LONG,
  bottom: LONG
});

// EnumWindowsProc callback type
const EnumWindowsProc = ffi.Function(BOOL, [HWND, LPARAM]);

/**
 * Windows User32.dll bindings
 */
const user32 = ffi.Library('user32.dll', {
  'EnumWindows': [BOOL, [EnumWindowsProc, LPARAM]],
  'GetWindowTextW': [ref.types.int, [HWND, ref.types.CString, ref.types.int]],
  'GetWindowTextLengthW': [ref.types.int, [HWND]],
  'GetClassNameW': [ref.types.int, [HWND, ref.types.CString, ref.types.int]],
  'IsWindowVisible': [BOOL, [HWND]],
  'GetWindowThreadProcessId': [DWORD, [HWND, ref.refType(DWORD)]],
  'GetWindowRect': [BOOL, [HWND, ref.refType(RECT)]],
  'GetForegroundWindow': [HWND, []],
});

/**
 * Windows Kernel32.dll bindings
 */
const kernel32 = ffi.Library('kernel32.dll', {
  'OpenProcess': [HWND, [DWORD, BOOL, DWORD]],
  'CloseHandle': [BOOL, [HWND]],
  'QueryFullProcessImageNameW': [BOOL, [HWND, DWORD, ref.types.CString, ref.refType(DWORD)]],
  'GetCurrentProcessId': [DWORD, []],
});

// Process access rights
const PROCESS_QUERY_INFORMATION = 0x0400;
const PROCESS_VM_READ = 0x0010;

/**
 * Browser process names mapping
 */
const BROWSER_PROCESSES: Record<string, BrowserTab['browser']> = {
  'chrome.exe': 'chrome',
  'msedge.exe': 'edge',
  'firefox.exe': 'firefox',
  'brave.exe': 'brave',
  'opera.exe': 'opera',
};

export class WindowDetector {
  private windows: WindowInfo[] = [];
  private errors: WindowDetectorError[] = [];

  /**
   * Get all visible windows on the system
   */
  async getAllWindows(): Promise<WindowsDetectionResult> {
    this.windows = [];
    this.errors = [];

    return new Promise((resolve) => {
      try {
        const callback = ffi.Callback(BOOL, [HWND, LPARAM], (hwnd: Buffer, lParam: number) => {
          try {
            return this.processWindow(hwnd) ? 1 : 1; // Continue enumeration
          } catch (error) {
            this.errors.push({
              code: 'WINDOW_PROCESS_ERROR',
              message: 'Failed to process window',
              details: error
            });
            return 1; // Continue enumeration
          }
        });

        user32.EnumWindows(callback, 0);

        resolve({
          windows: this.windows,
          totalCount: this.windows.length,
          errors: this.errors
        });
      } catch (error) {
        this.errors.push({
          code: 'ENUM_WINDOWS_ERROR',
          message: 'Failed to enumerate windows',
          details: error
        });
        resolve({
          windows: [],
          totalCount: 0,
          errors: this.errors
        });
      }
    });
  }

  /**
   * Get all browser windows and tabs
   */
  async getBrowserTabs(): Promise<BrowserDetectionResult> {
    const allWindows = await this.getAllWindows();
    const browserWindows = allWindows.windows.filter(w =>
      this.isBrowserProcess(w.processName)
    );

    const tabs: BrowserTab[] = [];
    const errors: WindowDetectorError[] = [...this.errors];

    for (const window of browserWindows) {
      try {
        const browserTabs = await this.extractBrowserTabs(window);
        tabs.push(...browserTabs);
      } catch (error) {
        errors.push({
          code: 'BROWSER_TAB_EXTRACTION_ERROR',
          message: `Failed to extract tabs from ${window.processName}`,
          details: error
        });
      }
    }

    return {
      windows: browserWindows,
      tabs,
      errors
    };
  }

  /**
   * Process individual window and add to collection
   */
  private processWindow(hwnd: Buffer): boolean {
    try {
      // Check if window is visible
      if (!user32.IsWindowVisible(hwnd)) {
        return true;
      }

      // Get window title
      const titleLength = user32.GetWindowTextLengthW(hwnd);
      if (titleLength === 0) {
        return true; // Skip windows without titles
      }

      const titleBuffer = Buffer.alloc((titleLength + 1) * 2);
      user32.GetWindowTextW(hwnd, titleBuffer, titleLength + 1);
      const title = titleBuffer.toString('ucs2').replace(/\0/g, '');

      if (!title.trim()) {
        return true;
      }

      // Get class name
      const classBuffer = Buffer.alloc(256);
      user32.GetClassNameW(hwnd, classBuffer, 256);
      const className = classBuffer.toString('ucs2').replace(/\0/g, '');

      // Get process ID
      const processIdBuffer = ref.alloc(DWORD);
      user32.GetWindowThreadProcessId(hwnd, processIdBuffer);
      const processId = processIdBuffer.readUInt32LE(0);

      // Get process name
      const processName = this.getProcessName(processId);

      // Get window bounds
      const bounds = this.getWindowBounds(hwnd);

      const windowInfo: WindowInfo = {
        title,
        className,
        processName,
        processId,
        windowHandle: ref.address(hwnd),
        isVisible: true,
        bounds
      };

      this.windows.push(windowInfo);
      return true;
    } catch (error) {
      // Log error but continue enumeration
      return true;
    }
  }

  /**
   * Get process name from process ID
   */
  private getProcessName(processId: number): string {
    try {
      const hProcess = kernel32.OpenProcess(
        PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
        false,
        processId
      );

      if (!hProcess || ref.isNull(hProcess)) {
        return 'unknown';
      }

      const pathBuffer = Buffer.alloc(1024);
      const sizeBuffer = ref.alloc(DWORD, 512);

      const result = kernel32.QueryFullProcessImageNameW(
        hProcess,
        0,
        pathBuffer,
        sizeBuffer
      );

      kernel32.CloseHandle(hProcess);

      if (result) {
        const fullPath = pathBuffer.toString('ucs2').replace(/\0/g, '');
        const parts = fullPath.split('\\');
        return parts[parts.length - 1] || 'unknown';
      }

      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get window bounds (position and size)
   */
  private getWindowBounds(hwnd: Buffer): WindowInfo['bounds'] {
    try {
      const rect = new RECT();
      const result = user32.GetWindowRect(hwnd, rect.ref());

      if (result) {
        return {
          x: rect.left,
          y: rect.top,
          width: rect.right - rect.left,
          height: rect.bottom - rect.top
        };
      }
    } catch (error) {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Check if process name is a browser
   */
  private isBrowserProcess(processName: string): boolean {
    return processName.toLowerCase() in BROWSER_PROCESSES;
  }

  /**
   * Extract browser tabs from a browser window
   * Uses browser-specific automation APIs
   */
  private async extractBrowserTabs(window: WindowInfo): Promise<BrowserTab[]> {
    const browserType = BROWSER_PROCESSES[window.processName.toLowerCase()] || 'unknown';
    const tabs: BrowserTab[] = [];

    // For Chrome/Edge: Use Chrome DevTools Protocol via WebSocket
    if (browserType === 'chrome' || browserType === 'edge') {
      try {
        const chromeTabs = await this.getChromeTabsViaCDP(window.processId);
        tabs.push(...chromeTabs.map(tab => ({
          ...tab,
          browser: browserType,
          processId: window.processId
        })));
      } catch (error) {
        // Fallback: Create single tab from window title
        tabs.push(this.createFallbackTab(window, browserType));
      }
    } else if (browserType === 'firefox') {
      // Firefox: Use window title parsing (Firefox includes tab info in title)
      tabs.push(this.createFallbackTab(window, browserType));
    } else {
      tabs.push(this.createFallbackTab(window, browserType));
    }

    return tabs;
  }

  /**
   * Get Chrome/Edge tabs via Chrome DevTools Protocol
   * Requires browser to be started with --remote-debugging-port flag
   */
  private async getChromeTabsViaCDP(processId: number): Promise<Array<{
    title: string;
    url?: string;
    favicon?: string;
    tabIndex?: number;
    isActive: boolean;
  }>> {
    // Note: This requires the browser to be started with debugging enabled
    // Default Chrome debugging port is 9222
    // This is a simplified version - full implementation would need:
    // 1. Port detection from process command line
    // 2. WebSocket connection to CDP
    // 3. Protocol message exchange

    // For now, throw to trigger fallback
    throw new Error('CDP not available - requires --remote-debugging-port');
  }

  /**
   * Create fallback tab from window title
   */
  private createFallbackTab(window: WindowInfo, browserType: BrowserTab['browser']): BrowserTab {
    // Extract tab title from window title
    // Most browsers format: "Page Title - Browser Name"
    let tabTitle = window.title;

    // Remove browser name suffix
    const browserNames = ['Google Chrome', 'Microsoft Edge', 'Mozilla Firefox', 'Brave', 'Opera'];
    for (const name of browserNames) {
      const index = tabTitle.lastIndexOf(` - ${name}`);
      if (index > 0) {
        tabTitle = tabTitle.substring(0, index);
        break;
      }
    }

    // Check if this is the active window
    const foregroundWindow = user32.GetForegroundWindow();
    const isActive = !ref.isNull(foregroundWindow) &&
                     ref.address(foregroundWindow) === window.windowHandle;

    return {
      browser: browserType,
      title: tabTitle.trim(),
      url: undefined,
      favicon: undefined,
      tabIndex: 0,
      processId: window.processId,
      isActive
    };
  }

  /**
   * Get currently focused/active window
   */
  async getActiveWindow(): Promise<WindowInfo | null> {
    try {
      const hwnd = user32.GetForegroundWindow();
      if (ref.isNull(hwnd)) {
        return null;
      }

      this.windows = [];
      this.processWindow(hwnd);
      return this.windows[0] || null;
    } catch (error) {
      this.errors.push({
        code: 'GET_ACTIVE_WINDOW_ERROR',
        message: 'Failed to get active window',
        details: error
      });
      return null;
    }
  }

  /**
   * Get windows by process name
   */
  async getWindowsByProcess(processName: string): Promise<WindowInfo[]> {
    const result = await this.getAllWindows();
    return result.windows.filter(w =>
      w.processName.toLowerCase() === processName.toLowerCase()
    );
  }

  /**
   * Get windows by class name
   */
  async getWindowsByClassName(className: string): Promise<WindowInfo[]> {
    const result = await this.getAllWindows();
    return result.windows.filter(w =>
      w.className.toLowerCase().includes(className.toLowerCase())
    );
  }
}

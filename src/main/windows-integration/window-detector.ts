/**
 * WindowDetector - Detects and enumerates Windows applications and browser tabs
 *
 * MOCK VERSION - Native Windows API requires Visual Studio Build Tools
 * Returns mock data until native dependencies are installed
 */

import log from 'electron-log';
import {
  WindowInfo,
  BrowserTab,
  WindowsDetectionResult,
  BrowserDetectionResult,
  WindowDetectorError
} from '../../shared/types/windows';

/**
 * Mock window data for demonstration
 */
const MOCK_WINDOWS: WindowInfo[] = [
  {
    title: 'Insurance Data Portal - Chrome',
    className: 'Chrome_WidgetWin_1',
    processName: 'chrome.exe',
    processId: 12345,
    windowHandle: 0x001A0B2C,
    isVisible: true,
    bounds: { x: 100, y: 100, width: 1200, height: 800 }
  },
  {
    title: 'Document1.docx - Word',
    className: 'OpusApp',
    processName: 'WINWORD.EXE',
    processId: 23456,
    windowHandle: 0x002B1C3D,
    isVisible: true,
    bounds: { x: 200, y: 200, width: 1000, height: 600 }
  },
  {
    title: 'Budget 2026.xlsx - Excel',
    className: 'XLMAIN',
    processName: 'EXCEL.EXE',
    processId: 34567,
    windowHandle: 0x003C2D4E,
    isVisible: true,
    bounds: { x: 300, y: 150, width: 1100, height: 700 }
  },
  {
    title: 'Email - Outlook',
    className: 'rctrl_renwnd32',
    processName: 'OUTLOOK.EXE',
    processId: 45678,
    windowHandle: 0x004D3E5F,
    isVisible: true,
    bounds: { x: 400, y: 100, width: 900, height: 650 }
  }
];

const MOCK_BROWSER_TABS: BrowserTab[] = [
  {
    browser: 'chrome',
    title: 'Insurance Data Portal',
    url: 'https://192.168.2.5/dashboard',
    processId: 12345,
    isActive: true,
    tabIndex: 0
  },
  {
    browser: 'chrome',
    title: 'Smart Flow Documentation',
    url: 'https://192.168.2.5/docs',
    processId: 12345,
    isActive: false,
    tabIndex: 1
  },
  {
    browser: 'edge',
    title: 'Microsoft 365',
    url: 'https://office.com',
    processId: 56789,
    isActive: false,
    tabIndex: 0
  }
];

/**
 * WindowDetector Class - Mock Implementation
 */
export class WindowDetector {
  private static instance: WindowDetector | null = null;

  private constructor() {
    log.info('[WindowDetector] Initialized (MOCK MODE - Native APIs not available)');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WindowDetector {
    if (!WindowDetector.instance) {
      WindowDetector.instance = new WindowDetector();
    }
    return WindowDetector.instance;
  }

  /**
   * Get all visible windows
   * MOCK: Returns predefined window list
   */
  public async getAllWindows(): Promise<WindowsDetectionResult> {
    log.info('[WindowDetector] getAllWindows() called (returning mock data)');

    return {
      windows: MOCK_WINDOWS,
      totalCount: MOCK_WINDOWS.length,
      errors: [{
        code: 'MOCK_MODE',
        message: 'Mock data - Install native dependencies for real Windows detection'
      }]
    };
  }

  /**
   * Get browser tabs from all running browsers
   * MOCK: Returns predefined browser tabs
   */
  public async getBrowserTabs(): Promise<BrowserDetectionResult> {
    log.info('[WindowDetector] getBrowserTabs() called (returning mock data)');

    // Get browser windows
    const browserWindows = MOCK_WINDOWS.filter(w =>
      ['chrome.exe', 'msedge.exe', 'firefox.exe'].includes(w.processName.toLowerCase())
    );

    return {
      windows: browserWindows,
      tabs: MOCK_BROWSER_TABS,
      errors: [{
        code: 'MOCK_MODE',
        message: 'Mock data - Install native dependencies for real browser detection'
      }]
    };
  }

  /**
   * Get currently active window
   * MOCK: Returns first window as active
   */
  public async getActiveWindow(): Promise<WindowInfo | null> {
    log.info('[WindowDetector] getActiveWindow() called (returning mock data)');
    return MOCK_WINDOWS[0] || null;
  }

  /**
   * Get windows by process name
   * MOCK: Filters mock data
   */
  public async getWindowsByProcess(processName: string): Promise<WindowInfo[]> {
    log.info(`[WindowDetector] getWindowsByProcess('${processName}') called (returning mock data)`);

    return MOCK_WINDOWS.filter(w =>
      w.processName.toLowerCase().includes(processName.toLowerCase())
    );
  }

  /**
   * Get windows by class name
   * MOCK: Filters mock data
   */
  public async getWindowsByClassName(className: string): Promise<WindowInfo[]> {
    log.info(`[WindowDetector] getWindowsByClassName('${className}') called (returning mock data)`);

    return MOCK_WINDOWS.filter(w =>
      w.className.toLowerCase().includes(className.toLowerCase())
    );
  }

  /**
   * Cleanup
   */
  public static destroyInstance(): void {
    log.info('[WindowDetector] Destroying instance');
    WindowDetector.instance = null;
  }
}

export default WindowDetector;

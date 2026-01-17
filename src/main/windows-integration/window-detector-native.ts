/**
 * WindowDetector - Native C# Executable Implementation
 * Uses bundled GetAllWindows.exe for real Windows detection
 *
 * No PowerShell, no build dependencies, just a pre-compiled .exe
 */

import log from 'electron-log';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { app } from 'electron';
import {
  WindowInfo,
  BrowserTab,
  WindowsDetectionResult,
  BrowserDetectionResult,
} from '../../shared/types/windows';

const execAsync = promisify(exec);

/**
 * WindowDetector Class - Native Executable Implementation
 */
export class WindowDetectorNative {
  private static instance: WindowDetectorNative | null = null;
  private exePath: string;

  private constructor() {
    // Path to bundled GetAllWindows.exe
    // Use app.isPackaged for reliable dev/prod detection
    const isDev = !app.isPackaged;

    if (isDev) {
      // Development: project_root/resources/bin/GetAllWindows.exe
      this.exePath = path.join(process.cwd(), 'resources', 'bin', 'GetAllWindows.exe');
    } else {
      // Production: bundled in resources folder
      this.exePath = path.join(process.resourcesPath, 'bin', 'GetAllWindows.exe');
    }

    log.info('[WindowDetectorNative] Initialized');
    log.info('[WindowDetectorNative] isDev:', isDev);
    log.info('[WindowDetectorNative] process.cwd():', process.cwd());
    log.info('[WindowDetectorNative] Executable path:', this.exePath);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WindowDetectorNative {
    if (!WindowDetectorNative.instance) {
      WindowDetectorNative.instance = new WindowDetectorNative();
    }
    return WindowDetectorNative.instance;
  }

  /**
   * Get all visible windows using native executable
   */
  public async getAllWindows(): Promise<WindowsDetectionResult> {
    log.info('[WindowDetectorNative] getAllWindows() called');

    try {
      log.debug('[WindowDetectorNative] Executing:', this.exePath);

      const { stdout, stderr } = await execAsync(`"${this.exePath}"`, {
        timeout: 5000,
        maxBuffer: 2 * 1024 * 1024, // 2MB buffer
      });

      if (stderr) {
        log.warn('[WindowDetectorNative] stderr:', stderr);
      }

      log.debug('[WindowDetectorNative] stdout length:', stdout.length);

      // Parse JSON output
      let windowsData: any[] = [];
      try {
        const trimmed = stdout.trim();
        if (!trimmed) {
          log.warn('[WindowDetectorNative] Empty output');
          windowsData = [];
        } else {
          const parsed = JSON.parse(trimmed);
          windowsData = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (parseError) {
        log.error('[WindowDetectorNative] JSON parse error:', parseError);
        log.error('[WindowDetectorNative] Raw output:', stdout.substring(0, 500));
        windowsData = [];
      }

      log.info('[WindowDetectorNative] Found', windowsData.length, 'windows');

      // Map to WindowInfo format
      const windows: WindowInfo[] = windowsData
        .filter(w => w && w.Title && w.ProcessName)
        .map(w => ({
          title: w.Title,
          className: '', // Not provided by simple enum
          processName: w.ProcessName,
          processId: w.ProcessId,
          windowHandle: w.WindowHandle,
          isVisible: true,
          bounds: undefined,
        }));

      return {
        windows,
        totalCount: windows.length,
        errors: [],
      };
    } catch (error) {
      log.error('[WindowDetectorNative] Error getting windows:', error);
      return {
        windows: [],
        totalCount: 0,
        errors: [{
          code: 'NATIVE_EXEC_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        }],
      };
    }
  }

  /**
   * Get browser tabs from all running browsers
   */
  public async getBrowserTabs(): Promise<BrowserDetectionResult> {
    log.info('[WindowDetectorNative] getBrowserTabs() called');

    try {
      const allWindows = await this.getAllWindows();

      // Filter for browser processes
      const browserProcesses = ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi'];
      const browserWindows = allWindows.windows.filter(w =>
        browserProcesses.some(b => w.processName.toLowerCase().includes(b))
      );

      log.info('[WindowDetectorNative] Found', browserWindows.length, 'browser windows');

      // Map to BrowserTab format
      const tabs: BrowserTab[] = browserWindows.map((w, index) => ({
        browser: this.detectBrowserType(w.processName),
        title: w.title,
        url: undefined,
        favicon: undefined,
        tabIndex: index,
        processId: w.processId,
        isActive: index === 0,
      }));

      return {
        windows: browserWindows,
        tabs,
        errors: [],
      };
    } catch (error) {
      log.error('[WindowDetectorNative] Error getting browser tabs:', error);
      return {
        windows: [],
        tabs: [],
        errors: [{
          code: 'BROWSER_DETECTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        }],
      };
    }
  }

  /**
   * Get currently active window (use active-win for this)
   */
  public async getActiveWindow(): Promise<WindowInfo | null> {
    log.info('[WindowDetectorNative] getActiveWindow() - using first window as fallback');

    const allWindows = await this.getAllWindows();
    return allWindows.windows[0] || null;
  }

  /**
   * Get windows by process name
   */
  public async getWindowsByProcess(processName: string): Promise<WindowInfo[]> {
    log.info(`[WindowDetectorNative] getWindowsByProcess('${processName}') called`);

    const allWindows = await this.getAllWindows();
    return allWindows.windows.filter(w =>
      w.processName.toLowerCase().includes(processName.toLowerCase())
    );
  }

  /**
   * Get windows by class name (not supported by simple enum)
   */
  public async getWindowsByClassName(className: string): Promise<WindowInfo[]> {
    log.warn('[WindowDetectorNative] getWindowsByClassName not supported');
    return [];
  }

  /**
   * Detect browser type from process name
   */
  private detectBrowserType(processName: string): BrowserTab['browser'] {
    const lower = processName.toLowerCase();
    if (lower.includes('chrome')) return 'chrome';
    if (lower.includes('msedge') || lower.includes('edge')) return 'edge';
    if (lower.includes('firefox')) return 'firefox';
    if (lower.includes('brave')) return 'brave';
    if (lower.includes('opera')) return 'opera';
    return 'unknown';
  }

  /**
   * Cleanup
   */
  public static destroyInstance(): void {
    log.info('[WindowDetectorNative] Instance destroyed');
    WindowDetectorNative.instance = null;
  }
}

export default WindowDetectorNative;

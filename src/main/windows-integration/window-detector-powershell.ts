/**
 * WindowDetector - PowerShell/WMI Implementation
 * Detects Windows applications and browser tabs using PowerShell
 *
 * No native dependencies required - uses child_process + PowerShell
 */

import log from 'electron-log';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  WindowInfo,
  BrowserTab,
  WindowsDetectionResult,
  BrowserDetectionResult,
} from '../../shared/types/windows';

const execAsync = promisify(exec);

/**
 * PowerShell script to get all visible windows
 */
const GET_WINDOWS_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
}
"@

Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | ForEach-Object {
    $handle = $_.MainWindowHandle
    $length = [Win32]::GetWindowTextLength($handle)
    if ($length -gt 0) {
        $text = New-Object System.Text.StringBuilder -ArgumentList ($length + 1)
        [Win32]::GetWindowText($handle, $text, $text.Capacity) | Out-Null
        $title = $text.ToString()

        if ($title -and [Win32]::IsWindowVisible($handle)) {
            [PSCustomObject]@{
                Title = $title
                ProcessName = $_.ProcessName
                ProcessId = $_.Id
                WindowHandle = $handle.ToInt64()
                Path = $_.Path
            }
        }
    }
} | ConvertTo-Json
`;

/**
 * WindowDetector Class - PowerShell Implementation
 */
export class WindowDetectorPowerShell {
  private static instance: WindowDetectorPowerShell | null = null;

  private constructor() {
    log.info('[WindowDetectorPS] Initialized (PowerShell/WMI mode)');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WindowDetectorPowerShell {
    if (!WindowDetectorPowerShell.instance) {
      WindowDetectorPowerShell.instance = new WindowDetectorPowerShell();
    }
    return WindowDetectorPowerShell.instance;
  }

  /**
   * Get all visible windows using PowerShell
   */
  public async getAllWindows(): Promise<WindowsDetectionResult> {
    log.info('[WindowDetectorPS] getAllWindows() called');

    try {
      log.info('[WindowDetectorPS] Executing PowerShell script...');

      const { stdout, stderr } = await execAsync(
        `powershell -NoProfile -Command "${GET_WINDOWS_SCRIPT.replace(/"/g, '\\"')}"`,
        { timeout: 10000, maxBuffer: 1024 * 1024 }
      );

      log.info('[WindowDetectorPS] PowerShell output length:', stdout.length);
      log.info('[WindowDetectorPS] PowerShell stderr:', stderr || 'none');
      log.info('[WindowDetectorPS] PowerShell stdout (first 500 chars):', stdout.substring(0, 500));

      // Parse JSON output
      let windowsData: any[] = [];
      try {
        const trimmed = stdout.trim();
        if (!trimmed) {
          log.warn('[WindowDetectorPS] PowerShell returned empty output');
          windowsData = [];
        } else {
          const parsed = JSON.parse(trimmed);
          windowsData = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (parseError) {
        log.error('[WindowDetectorPS] Failed to parse PowerShell output as JSON:', parseError);
        log.error('[WindowDetectorPS] Raw output:', stdout);
        windowsData = [];
      }

      log.info('[WindowDetectorPS] Found', windowsData.length, 'windows');

      // Map to WindowInfo format
      const windows: WindowInfo[] = windowsData
        .filter(w => w && w.Title && w.ProcessName)
        .map(w => ({
          title: w.Title,
          className: '', // Not available via PowerShell easily
          processName: `${w.ProcessName}.exe`,
          processId: w.ProcessId,
          windowHandle: w.WindowHandle,
          isVisible: true,
          bounds: undefined, // Can be added later if needed
        }));

      return {
        windows,
        totalCount: windows.length,
        errors: [],
      };
    } catch (error) {
      log.error('[WindowDetectorPS] Error getting windows:', error);
      return {
        windows: [],
        totalCount: 0,
        errors: [{
          code: 'POWERSHELL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        }],
      };
    }
  }

  /**
   * Get browser tabs from all running browsers
   * Currently returns browser windows, not individual tabs
   */
  public async getBrowserTabs(): Promise<BrowserDetectionResult> {
    log.info('[WindowDetectorPS] getBrowserTabs() called');

    try {
      const allWindows = await this.getAllWindows();

      // Filter for browser processes
      const browserProcesses = ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi'];
      const browserWindows = allWindows.windows.filter(w =>
        browserProcesses.some(b => w.processName.toLowerCase().includes(b))
      );

      log.info('[WindowDetectorPS] Found', browserWindows.length, 'browser windows');

      // Map to BrowserTab format (simplified - actual tab detection requires browser extensions)
      const tabs: BrowserTab[] = browserWindows.map((w, index) => ({
        browser: this.detectBrowserType(w.processName),
        title: w.title,
        url: undefined, // Not available without browser extensions
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
      log.error('[WindowDetectorPS] Error getting browser tabs:', error);
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
   * Get currently active window
   */
  public async getActiveWindow(): Promise<WindowInfo | null> {
    log.info('[WindowDetectorPS] getActiveWindow() called');

    try {
      // Get foreground window using PowerShell
      const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@

$hwnd = [Win32]::GetForegroundWindow()
$text = New-Object System.Text.StringBuilder -ArgumentList 256
[Win32]::GetWindowText($hwnd, $text, $text.Capacity) | Out-Null

$processId = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null

$process = Get-Process -Id $processId -ErrorAction SilentlyContinue

[PSCustomObject]@{
    Title = $text.ToString()
    ProcessName = if ($process) { $process.ProcessName } else { "Unknown" }
    ProcessId = $processId
    WindowHandle = $hwnd.ToInt64()
} | ConvertTo-Json
`;

      const { stdout } = await execAsync(
        `powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`,
        { timeout: 2000 }
      );

      const data = JSON.parse(stdout.trim());

      if (data && data.Title) {
        return {
          title: data.Title,
          className: '',
          processName: `${data.ProcessName}.exe`,
          processId: data.ProcessId,
          windowHandle: data.WindowHandle,
          isVisible: true,
        };
      }

      return null;
    } catch (error) {
      log.error('[WindowDetectorPS] Error getting active window:', error);
      return null;
    }
  }

  /**
   * Get windows by process name
   */
  public async getWindowsByProcess(processName: string): Promise<WindowInfo[]> {
    log.info(`[WindowDetectorPS] getWindowsByProcess('${processName}') called`);

    const allWindows = await this.getAllWindows();
    return allWindows.windows.filter(w =>
      w.processName.toLowerCase().includes(processName.toLowerCase())
    );
  }

  /**
   * Get windows by class name (not easily available via PowerShell)
   */
  public async getWindowsByClassName(className: string): Promise<WindowInfo[]> {
    log.warn('[WindowDetectorPS] getWindowsByClassName not fully supported in PowerShell mode');
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
    log.info('[WindowDetectorPS] Destroying instance');
    WindowDetectorPowerShell.instance = null;
  }
}

export default WindowDetectorPowerShell;

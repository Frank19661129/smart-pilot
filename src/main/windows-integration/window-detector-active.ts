/**
 * WindowDetector - active-win Implementation
 * Tracks recent active windows using active-win package
 *
 * Strategy: Poll active window every 2 seconds and build a history
 * This gives us "recently used windows" which is often more useful than ALL windows
 */

import log from 'electron-log';
import activeWin from 'active-win';
import {
  WindowInfo,
  BrowserTab,
  WindowsDetectionResult,
  BrowserDetectionResult,
} from '../../shared/types/windows';

interface TrackedWindow {
  info: WindowInfo;
  lastActive: Date;
  activationCount: number;
}

/**
 * WindowDetector Class - active-win Implementation
 */
export class WindowDetectorActive {
  private static instance: WindowDetectorActive | null = null;
  private windowHistory: Map<number, TrackedWindow> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;

  private constructor() {
    log.info('[WindowDetectorActive] Initialized (active-win tracking mode)');
    this.startTracking();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WindowDetectorActive {
    if (!WindowDetectorActive.instance) {
      WindowDetectorActive.instance = new WindowDetectorActive();
    }
    return WindowDetectorActive.instance;
  }

  /**
   * Start tracking active window changes
   */
  private startTracking(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    log.info('[WindowDetectorActive] Starting window tracking (2s interval)');

    // Poll immediately
    this.trackActiveWindow();

    // Then poll every 2 seconds
    this.pollInterval = setInterval(() => {
      this.trackActiveWindow();
    }, 2000);
  }

  /**
   * Stop tracking
   */
  private stopTracking(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    log.info('[WindowDetectorActive] Stopped window tracking');
  }

  /**
   * Track current active window
   */
  private async trackActiveWindow(): Promise<void> {
    try {
      const result = await activeWin();

      if (!result) {
        return;
      }

      const windowInfo: WindowInfo = {
        title: result.title,
        className: '', // Not provided by active-win
        processName: result.owner.name,
        processId: result.owner.processId,
        windowHandle: result.id || 0,
        isVisible: true,
        bounds: result.bounds ? {
          x: result.bounds.x,
          y: result.bounds.y,
          width: result.bounds.width,
          height: result.bounds.height,
        } : undefined,
      };

      const processId = result.owner.processId;

      if (this.windowHistory.has(processId)) {
        const tracked = this.windowHistory.get(processId)!;
        tracked.lastActive = new Date();
        tracked.activationCount++;
        tracked.info = windowInfo; // Update info (title might change)
      } else {
        this.windowHistory.set(processId, {
          info: windowInfo,
          lastActive: new Date(),
          activationCount: 1,
        });
        log.info('[WindowDetectorActive] New window tracked:', windowInfo.title);
      }

      // Clean up old entries (not active in last 10 minutes)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      for (const [pid, tracked] of this.windowHistory.entries()) {
        if (tracked.lastActive.getTime() < tenMinutesAgo) {
          this.windowHistory.delete(pid);
        }
      }
    } catch (error) {
      log.error('[WindowDetectorActive] Error tracking active window:', error);
    }
  }

  /**
   * Get all tracked windows (recently active)
   */
  public async getAllWindows(): Promise<WindowsDetectionResult> {
    log.info('[WindowDetectorActive] getAllWindows() called');

    // Make sure we have recent data
    await this.trackActiveWindow();

    // Sort by last active time (most recent first)
    const windows = Array.from(this.windowHistory.values())
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
      .map(tracked => tracked.info);

    log.info('[WindowDetectorActive] Returning', windows.length, 'tracked windows');

    return {
      windows,
      totalCount: windows.length,
      errors: [],
    };
  }

  /**
   * Get browser tabs from tracked windows
   */
  public async getBrowserTabs(): Promise<BrowserDetectionResult> {
    log.info('[WindowDetectorActive] getBrowserTabs() called');

    const allWindows = await this.getAllWindows();

    // Filter for browser processes
    const browserProcesses = ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi'];
    const browserWindows = allWindows.windows.filter(w =>
      browserProcesses.some(b => w.processName.toLowerCase().includes(b))
    );

    log.info('[WindowDetectorActive] Found', browserWindows.length, 'browser windows');

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
  }

  /**
   * Get currently active window
   */
  public async getActiveWindow(): Promise<WindowInfo | null> {
    log.info('[WindowDetectorActive] getActiveWindow() called');

    try {
      const result = await activeWin();

      if (!result) {
        return null;
      }

      return {
        title: result.title,
        className: '',
        processName: result.owner.name,
        processId: result.owner.processId,
        windowHandle: result.id || 0,
        isVisible: true,
        bounds: result.bounds ? {
          x: result.bounds.x,
          y: result.bounds.y,
          width: result.bounds.width,
          height: result.bounds.height,
        } : undefined,
      };
    } catch (error) {
      log.error('[WindowDetectorActive] Error getting active window:', error);
      return null;
    }
  }

  /**
   * Get windows by process name
   */
  public async getWindowsByProcess(processName: string): Promise<WindowInfo[]> {
    log.info(`[WindowDetectorActive] getWindowsByProcess('${processName}') called`);

    const allWindows = await this.getAllWindows();
    return allWindows.windows.filter(w =>
      w.processName.toLowerCase().includes(processName.toLowerCase())
    );
  }

  /**
   * Get windows by class name (not supported by active-win)
   */
  public async getWindowsByClassName(className: string): Promise<WindowInfo[]> {
    log.warn('[WindowDetectorActive] getWindowsByClassName not supported in active-win mode');
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
   * Get tracking stats
   */
  public getStats(): { totalTracked: number; isPolling: boolean } {
    return {
      totalTracked: this.windowHistory.size,
      isPolling: this.isPolling,
    };
  }

  /**
   * Cleanup
   */
  public static destroyInstance(): void {
    if (WindowDetectorActive.instance) {
      WindowDetectorActive.instance.stopTracking();
      WindowDetectorActive.instance = null;
    }
    log.info('[WindowDetectorActive] Instance destroyed');
  }
}

export default WindowDetectorActive;

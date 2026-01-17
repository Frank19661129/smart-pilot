/**
 * Overlay Window Service
 * Creates transparent, click-through overlay windows over ANVA windows
 * to intercept drag & drop events for file import automation
 */

import { BrowserWindow, screen } from 'electron';
import log from 'electron-log';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Window rectangle from GetWindowRect
 */
interface WindowRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Overlay configuration for a specific window
 */
interface OverlayConfig {
  windowHandle: number;
  relatienummer?: string;
}

/**
 * Active overlay instance
 */
interface ActiveOverlay {
  window: BrowserWindow;
  config: OverlayConfig;
  positionCheckInterval?: NodeJS.Timeout;
}

/**
 * Overlay Window Service
 * Manages transparent overlay windows for drag & drop interception
 */
export class OverlayWindowService {
  private static instance: OverlayWindowService | null = null;
  private overlays: Map<number, ActiveOverlay> = new Map();
  private getWindowRectExePath: string;

  private constructor() {
    const isDev = process.env.NODE_ENV === 'development';
    this.getWindowRectExePath = isDev
      ? path.join(process.cwd(), 'resources', 'bin', 'GetWindowRect.exe')
      : path.join(process.resourcesPath, 'bin', 'GetWindowRect.exe');

    log.info('[OverlayWindowService] Initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): OverlayWindowService {
    if (!OverlayWindowService.instance) {
      OverlayWindowService.instance = new OverlayWindowService();
    }
    return OverlayWindowService.instance;
  }

  /**
   * Get window rectangle using GetWindowRect.exe
   */
  private async getWindowRect(windowHandle: number): Promise<WindowRect | null> {
    try {
      const { stdout } = await execAsync(`"${this.getWindowRectExePath}" ${windowHandle}`);
      const result = JSON.parse(stdout.trim());

      if (result.success) {
        return {
          left: result.left,
          top: result.top,
          right: result.right,
          bottom: result.bottom,
          width: result.right - result.left,
          height: result.bottom - result.top,
        };
      }
      return null;
    } catch (error) {
      log.error(`[OverlayWindowService] Failed to get window rect for ${windowHandle}:`, error);
      return null;
    }
  }

  /**
   * Create transparent overlay window
   */
  private createOverlayWindow(rect: WindowRect, config: OverlayConfig): BrowserWindow {
    log.info(`[OverlayWindowService] Creating overlay for window ${config.windowHandle}`);

    const overlay = new BrowserWindow({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    });

    // Set click-through (important!)
    overlay.setIgnoreMouseEvents(true, { forward: true });

    // Load drop zone HTML
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      overlay.loadURL('http://localhost:5173/dropzone.html');
    } else {
      overlay.loadFile(path.join(__dirname, '../../renderer/dropzone.html'));
    }

    // Don't show in taskbar
    overlay.setSkipTaskbar(true);

    log.info(`[OverlayWindowService] Overlay created at (${rect.left}, ${rect.top}) ${rect.width}x${rect.height}`);

    return overlay;
  }

  /**
   * Update overlay position if ANVA window moved/resized
   */
  private async updateOverlayPosition(overlay: ActiveOverlay): Promise<void> {
    const rect = await this.getWindowRect(overlay.config.windowHandle);
    if (rect) {
      overlay.window.setBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }

  /**
   * Create overlay for ANVA window
   */
  public async createOverlay(config: OverlayConfig): Promise<boolean> {
    try {
      // Check if overlay already exists
      if (this.overlays.has(config.windowHandle)) {
        log.warn(`[OverlayWindowService] Overlay already exists for window ${config.windowHandle}`);
        return true;
      }

      // Get window position
      const rect = await this.getWindowRect(config.windowHandle);
      if (!rect) {
        log.error(`[OverlayWindowService] Could not get window rect for ${config.windowHandle}`);
        return false;
      }

      // Create overlay window
      const overlay = this.createOverlayWindow(rect, config);

      // Track position changes every 500ms
      const positionCheckInterval = setInterval(() => {
        this.updateOverlayPosition({ window: overlay, config });
      }, 500);

      // Store overlay
      this.overlays.set(config.windowHandle, {
        window: overlay,
        config,
        positionCheckInterval,
      });

      log.info(`[OverlayWindowService] Overlay active for window ${config.windowHandle}`);
      return true;
    } catch (error) {
      log.error(`[OverlayWindowService] Error creating overlay:`, error);
      return false;
    }
  }

  /**
   * Destroy overlay for window
   */
  public destroyOverlay(windowHandle: number): void {
    const overlay = this.overlays.get(windowHandle);
    if (overlay) {
      log.info(`[OverlayWindowService] Destroying overlay for window ${windowHandle}`);

      // Clear position check interval
      if (overlay.positionCheckInterval) {
        clearInterval(overlay.positionCheckInterval);
      }

      // Close window
      overlay.window.close();

      // Remove from map
      this.overlays.delete(windowHandle);
    }
  }

  /**
   * Destroy all overlays
   */
  public destroyAllOverlays(): void {
    log.info(`[OverlayWindowService] Destroying all overlays (${this.overlays.size})`);
    for (const [windowHandle] of this.overlays) {
      this.destroyOverlay(windowHandle);
    }
  }

  /**
   * Get active overlay count
   */
  public getOverlayCount(): number {
    return this.overlays.size;
  }

  /**
   * Cleanup
   */
  public async cleanup(): Promise<void> {
    this.destroyAllOverlays();
    log.info('[OverlayWindowService] Cleanup complete');
  }

  /**
   * Destroy singleton
   */
  public static async destroyInstance(): Promise<void> {
    if (OverlayWindowService.instance) {
      await OverlayWindowService.instance.cleanup();
      OverlayWindowService.instance = null;
      log.info('[OverlayWindowService] Instance destroyed');
    }
  }
}

export default OverlayWindowService;

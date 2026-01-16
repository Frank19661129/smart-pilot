/**
 * Window Manager
 *
 * Manages the main application window, including state persistence,
 * bounds management, and window styling.
 */

import { BrowserWindow, screen } from 'electron';
import windowStateKeeper from 'electron-window-state';
import Store from 'electron-store';
import * as path from 'path';
import {
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  APP_NAME,
  IS_WINDOWS,
} from '../shared/constants';
import { WindowState } from '../shared/types';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  /**
   * Create the main application window
   */
  public createMainWindow(): BrowserWindow {
    // Load previous window state
    const mainWindowState = windowStateKeeper({
      defaultWidth: DEFAULT_WINDOW_WIDTH,
      defaultHeight: DEFAULT_WINDOW_HEIGHT,
    });

    // Create the browser window with saved state
    this.mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: MIN_WINDOW_WIDTH,
      minHeight: MIN_WINDOW_HEIGHT,
      title: APP_NAME,
      icon: path.join(__dirname, '../../assets/icons/icon.png'),

      // Window styling
      frame: false, // Custom title bar
      transparent: true, // Enable transparency for acrylic/mica effects
      backgroundColor: '#00000000', // Transparent background

      // Web preferences for security
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },

      // Show window when ready
      show: false,
    });

    // Apply Windows-specific styling
    if (IS_WINDOWS) {
      this.applyWindowsEffects();
    }

    // Let the window state keeper track the window
    mainWindowState.manage(this.mainWindow);

    // Show window when ready to prevent flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    return this.mainWindow;
  }

  /**
   * Apply Windows-specific visual effects (Acrylic/Mica)
   */
  private applyWindowsEffects(): void {
    if (!this.mainWindow || !IS_WINDOWS) return;

    try {
      // Try to apply Mica effect (Windows 11)
      // @ts-ignore - Using @pyke/vibe package
      const { effect } = require('@pyke/vibe');

      if (effect) {
        effect(this.mainWindow, {
          theme: 'auto', // 'dark', 'light', or 'auto'
          effect: 'mica', // 'acrylic', 'mica', or 'tabbed'
        });
      }
    } catch (error) {
      console.warn('Could not apply Windows visual effects:', error);
      // Fallback to default styling
    }
  }

  /**
   * Get the main window instance
   */
  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * Get current window state
   */
  public getWindowState(): WindowState {
    if (!this.mainWindow) {
      throw new Error('Window not initialized');
    }

    const bounds = this.mainWindow.getBounds();

    return {
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      isMaximized: this.mainWindow.isMaximized(),
      isMinimized: this.mainWindow.isMinimized(),
      isFullScreen: this.mainWindow.isFullScreen(),
    };
  }

  /**
   * Center window on screen
   */
  public centerWindow(): void {
    if (!this.mainWindow) return;

    const { width, height } = this.mainWindow.getBounds();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    const x = Math.floor((screenWidth - width) / 2);
    const y = Math.floor((screenHeight - height) / 2);

    this.mainWindow.setPosition(x, y);
  }

  /**
   * Toggle fullscreen mode
   */
  public toggleFullScreen(): void {
    if (!this.mainWindow) return;
    this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
  }

  /**
   * Set window opacity (0.0 - 1.0)
   */
  public setOpacity(opacity: number): void {
    if (!this.mainWindow) return;
    this.mainWindow.setOpacity(Math.max(0, Math.min(1, opacity)));
  }

  /**
   * Flash window to get user attention
   */
  public flashWindow(): void {
    if (!this.mainWindow) return;
    this.mainWindow.flashFrame(true);
  }

  /**
   * Set window always on top
   */
  public setAlwaysOnTop(flag: boolean): void {
    if (!this.mainWindow) return;
    this.mainWindow.setAlwaysOnTop(flag);
  }
}

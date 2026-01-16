/**
 * System Tray Manager
 *
 * Manages the system tray icon and context menu
 */

import { Tray, Menu, app, nativeImage } from 'electron';
import * as path from 'path';
import { WindowManager } from './window-manager';
import { APP_NAME, TRAY_TOOLTIP } from '../shared/constants';

export class TrayManager {
  private tray: Tray | null = null;
  private windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  /**
   * Create system tray icon
   */
  public createTray(): void {
    // Load tray icon
    const iconPath = this.getTrayIconPath();
    const icon = nativeImage.createFromPath(iconPath);

    // Create tray
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip(TRAY_TOOLTIP);

    // Set context menu
    this.updateContextMenu();

    // Handle tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });

    // Handle double-click
    this.tray.on('double-click', () => {
      this.toggleWindow();
    });
  }

  /**
   * Get platform-specific tray icon path
   */
  private getTrayIconPath(): string {
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    return path.join(__dirname, '../../assets/icons', iconName);
  }

  /**
   * Update tray context menu
   */
  public updateContextMenu(): void {
    if (!this.tray) return;

    const mainWindow = this.windowManager.getMainWindow();
    const isVisible = mainWindow?.isVisible() || false;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: APP_NAME,
        enabled: false,
      },
      {
        type: 'separator',
      },
      {
        label: isVisible ? 'Hide Window' : 'Show Window',
        click: () => this.toggleWindow(),
      },
      {
        label: 'Settings',
        click: () => {
          this.showWindow();
          // Send message to renderer to open settings
          mainWindow?.webContents.send('open-settings');
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'About',
        click: () => {
          this.showWindow();
          // Send message to renderer to open about dialog
          mainWindow?.webContents.send('open-about');
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Quit',
        click: () => {
          (app as any).isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Toggle window visibility
   */
  private toggleWindow(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) return;

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      this.showWindow();
    }

    this.updateContextMenu();
  }

  /**
   * Show and focus window
   */
  private showWindow(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (!mainWindow) return;

    mainWindow.show();
    mainWindow.focus();

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    this.updateContextMenu();
  }

  /**
   * Update tray icon
   */
  public updateIcon(iconPath: string): void {
    if (!this.tray) return;

    const icon = nativeImage.createFromPath(iconPath);
    this.tray.setImage(icon.resize({ width: 16, height: 16 }));
  }

  /**
   * Update tooltip
   */
  public updateTooltip(tooltip: string): void {
    if (!this.tray) return;
    this.tray.setToolTip(tooltip);
  }

  /**
   * Display balloon notification (Windows only)
   */
  public displayBalloon(title: string, content: string): void {
    if (!this.tray || process.platform !== 'win32') return;

    this.tray.displayBalloon({
      title,
      content,
      icon: nativeImage.createFromPath(this.getTrayIconPath()),
    });
  }

  /**
   * Destroy tray
   */
  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

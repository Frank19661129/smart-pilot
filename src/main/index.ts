/**
 * Smart Pilot - Main Process Entry Point
 *
 * Electron main process that initializes Windows integration
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import { createLogger } from '../shared/utils/logger';
import { initializeWindowHandlers, cleanupWindowHandlers } from './ipc/window-handlers';
import { initializeSettingsHandlers, cleanupSettingsHandlers } from './ipc/settings-handlers';
import { setupAuthHandlers, cleanupAuthHandlers } from './ipc/auth-handlers';
import { setupWebSocketHandlers, cleanupWebSocketHandlers } from './ipc/websocket-handlers';
import { initializeVersionHandlers, cleanupVersionHandlers } from './ipc/version-handlers';
import { AuthService } from './auth/auth-service';
import { ContextDetectionService } from './services/context-detection-service';
import { getVersionInfo } from '../shared/utils/version';

// Configure electron-log FIRST
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
log.info('============================================================');
log.info('ELECTRON-LOG INITIALIZED');
log.info('Log file:', log.transports.file.getFile().path);
log.info('============================================================');

const logger = createLogger('Main');

let mainWindow: BrowserWindow | null = null;

/**
 * Create main application window
 */
function createWindow(): void {
  log.info('Creating main window...');

  try {
    const versionInfo = getVersionInfo();
    const windowTitle = `Smart Pilot v${versionInfo.version}`;

    log.info('Version info:', versionInfo);
    log.info('Window title:', windowTitle);

    const preloadPath = path.join(__dirname, '../preload/preload.js');
    log.info('Preload path:', preloadPath);
    log.info('__dirname:', __dirname);

    // Get screen dimensions
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
      width: 400,
      height: height,
      x: 0, // Position at left edge of screen
      y: 0,
      frame: false, // Remove window frame and menu
      transparent: false,
      backgroundColor: '#4A4645',
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: false,
      alwaysOnTop: false, // Can be toggled later
      skipTaskbar: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath
      },
      title: windowTitle,
      show: false
    });

    log.info('BrowserWindow created successfully');

    // Remove menu bar
    mainWindow.setMenu(null);

    // ALWAYS open DevTools for debugging (temporary)
    mainWindow.webContents.openDevTools();

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';
    log.info('Environment:', isDev ? 'development' : 'production');

    if (isDev) {
      const devUrl = 'http://localhost:3000';
      log.info('Loading dev URL:', devUrl);
      mainWindow.loadURL(devUrl);
    } else {
      // __dirname is dist/main/main, renderer is at dist/renderer
      const indexPath = path.join(__dirname, '../../renderer/index.html');
      log.info('Loading file:', indexPath);
      log.info('Resolved path:', path.resolve(indexPath));
      log.info('File exists check - attempting to load...');
      mainWindow.loadFile(indexPath).catch((err) => {
        log.error('Failed to load index.html:', err);
        log.error('Attempted path:', indexPath);
      });
    }

    // Log when page starts loading
    mainWindow.webContents.on('did-start-loading', () => {
      log.info('Page started loading...');
    });

    // Log when page finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
      log.info('Page finished loading successfully');
    });

    // Log any navigation errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log.error('Failed to load page:', { errorCode, errorDescription });
    });

    mainWindow.once('ready-to-show', () => {
      log.info('Window ready to show');
      mainWindow?.show();
    });

    mainWindow.on('closed', () => {
      log.info('Window closed');
      mainWindow = null;
    });

    // Log all console messages from renderer
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      log.info(`[Renderer Console] ${message} (${sourceId}:${line})`);
    });

  } catch (error) {
    log.error('Error creating window:', error);
    throw error;
  }
}

/**
 * App ready event
 */
app.on('ready', () => {
  log.info('App ready event fired');

  try {
    const versionInfo = getVersionInfo();

    log.info('='.repeat(60));
    log.info(`Smart Pilot v${versionInfo.version} (Build ${versionInfo.buildNumber})`);
    log.info('='.repeat(60));
    log.info('Platform:', process.platform);
    log.info('Arch:', process.arch);
    log.info('Electron version:', process.versions.electron);
    log.info('Node version:', process.versions.node);
    log.info('Chrome version:', process.versions.chrome);
    log.info('Environment:', versionInfo.environment);
    log.info('App path:', app.getAppPath());
    log.info('User data:', app.getPath('userData'));
    log.info('Logs path:', app.getPath('logs'));
    log.info('Temp path:', app.getPath('temp'));
    if (versionInfo.gitCommit) {
      log.info('Git commit:', versionInfo.gitCommit);
    }
    log.info('Build date:', versionInfo.buildDate.toISOString());
    log.info('='.repeat(60));

    // Initialize all IPC handlers
    log.info('Initializing IPC handlers...');
    initializeWindowHandlers();
    log.info('Window handlers initialized');

    initializeSettingsHandlers();
    log.info('Settings handlers initialized');

    setupAuthHandlers();
    log.info('Auth handlers initialized');

    initializeVersionHandlers();
    log.info('Version handlers initialized');

    // Create window
    log.info('Creating main window...');
    createWindow();

    // Setup WebSocket handlers with window reference
    if (mainWindow) {
      log.info('Setting up WebSocket handlers...');
      setupWebSocketHandlers(mainWindow);
      log.info('WebSocket handlers initialized');
    } else {
      log.warn('Main window is null, skipping WebSocket setup');
    }

    log.info('App initialization complete');
  } catch (error) {
    log.error('Error during app initialization:', error);
    throw error;
  }
});

/**
 * All windows closed event
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Activate event (macOS)
 */
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Track if app is quitting
 */
let isQuitting = false;

/**
 * Before quit event - prevent quit until cleanup is done
 */
app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;

    logger.info('Smart Pilot shutting down...');

    // Force quit after 3 seconds regardless of cleanup status
    const forceQuitTimeout = setTimeout(() => {
      logger.warn('Force quitting after timeout');
      process.exit(0);
    }, 3000);

    try {
      // Cleanup all handlers and services
      cleanupWindowHandlers();
      cleanupSettingsHandlers();
      cleanupAuthHandlers();
      cleanupWebSocketHandlers();
      cleanupVersionHandlers();

      // Destroy singleton instances
      AuthService.destroyInstance();
      await ContextDetectionService.destroyInstance();

      logger.info('Cleanup complete');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }

    clearTimeout(forceQuitTimeout);

    // Quit after cleanup
    process.exit(0);
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  log.error('UNCAUGHT EXCEPTION:', error);
  log.error('Stack:', error.stack);
  console.error('UNCAUGHT EXCEPTION:', error);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  log.error('UNHANDLED REJECTION:', { promise, reason });
  console.error('UNHANDLED REJECTION:', { promise, reason });
});

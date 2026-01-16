/**
 * Smart Pilot - Main Process Entry Point
 *
 * Electron main process that initializes Windows integration
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { createLogger } from '../shared/utils/logger';
import { initializeWindowHandlers, cleanupWindowHandlers } from './ipc/window-handlers';
import { setupAuthHandlers, cleanupAuthHandlers } from './ipc/auth-handlers';
import { setupWebSocketHandlers, cleanupWebSocketHandlers } from './ipc/websocket-handlers';
import { initializeVersionHandlers, cleanupVersionHandlers } from './ipc/version-handlers';
import { AuthService } from './auth/auth-service';
import { getVersionInfo } from '../shared/utils/version';

const logger = createLogger('Main');

let mainWindow: BrowserWindow | null = null;

/**
 * Create main application window
 */
function createWindow(): void {
  const versionInfo = getVersionInfo();
  const windowTitle = `Smart Pilot v${versionInfo.version}`;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    title: windowTitle,
    show: false
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App ready event
 */
app.on('ready', () => {
  const versionInfo = getVersionInfo();

  logger.info('='.repeat(60));
  logger.info(`Smart Pilot v${versionInfo.version} (Build ${versionInfo.buildNumber})`);
  logger.info('='.repeat(60));
  logger.info('Platform:', process.platform);
  logger.info('Electron version:', process.versions.electron);
  logger.info('Node version:', process.versions.node);
  logger.info('Environment:', versionInfo.environment);
  if (versionInfo.gitCommit) {
    logger.info('Git commit:', versionInfo.gitCommit);
  }
  logger.info('Build date:', versionInfo.buildDate.toISOString());
  logger.info('='.repeat(60));

  // Initialize all IPC handlers
  initializeWindowHandlers();
  setupAuthHandlers();
  initializeVersionHandlers();

  // Create window
  createWindow();

  // Setup WebSocket handlers with window reference
  if (mainWindow) {
    setupWebSocketHandlers(mainWindow);
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
 * Before quit event
 */
app.on('before-quit', () => {
  logger.info('Smart Pilot shutting down...');

  // Cleanup all handlers and services
  cleanupWindowHandlers();
  cleanupAuthHandlers();
  cleanupWebSocketHandlers();
  cleanupVersionHandlers();

  // Destroy singleton instances
  AuthService.destroyInstance();

  logger.info('Cleanup complete');
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { promise, reason });
});

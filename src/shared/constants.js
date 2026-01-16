"use strict";
/**
 * Shared constants for Smart Pilot application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEME_TOKENS = exports.COLORS = exports.Z_INDEX = exports.ANIMATION_DURATION = exports.LOG_LEVELS = exports.IS_LINUX = exports.IS_MAC = exports.IS_WINDOWS = exports.IS_PROD = exports.IS_DEV = exports.API_ENDPOINTS = exports.API_BASE_URL = exports.STORAGE_KEYS = exports.KEYBOARD_SHORTCUTS = exports.TRAY_TOOLTIP = exports.WS_PING_INTERVAL = exports.WS_MAX_RECONNECT_ATTEMPTS = exports.WS_RECONNECT_INTERVAL = exports.DEFAULT_SETTINGS = exports.UI_DIMENSIONS = exports.TITLE_BAR = exports.SETTINGS_PANEL = exports.WINDOW_STATE_DIMENSIONS = exports.MIN_WINDOW_HEIGHT = exports.MIN_WINDOW_WIDTH = exports.DEFAULT_WINDOW_HEIGHT = exports.DEFAULT_WINDOW_WIDTH = exports.APP_VERSION = exports.APP_ID = exports.APP_NAME = void 0;
// Application metadata
exports.APP_NAME = 'Smart Pilot';
exports.APP_ID = 'com.insurancedata.smartpilot';
exports.APP_VERSION = '0.1.0';
// Window configuration
exports.DEFAULT_WINDOW_WIDTH = 1200;
exports.DEFAULT_WINDOW_HEIGHT = 800;
exports.MIN_WINDOW_WIDTH = 800;
exports.MIN_WINDOW_HEIGHT = 600;
// Window state dimensions (Ghost Interface)
exports.WINDOW_STATE_DIMENSIONS = {
    HIDDEN: { width: 0, height: 0 },
    HANDLE: { width: 8, heightPercent: 100 },
    WIDGET: { width: 200, height: 200 },
    APP: { width: 400, height: 800 },
    FULLSCREEN: { widthPercent: 100, heightPercent: 100 },
};
// Settings panel dimensions
exports.SETTINGS_PANEL = {
    MIN_HEIGHT: 400,
    MAX_HEIGHT: 1200,
    DEFAULT_HEIGHT: 800,
    HEIGHT_STEP: 50,
};
// Title bar dimensions
exports.TITLE_BAR = {
    HEIGHT: 40,
    PADDING: 12,
    BUTTON_SIZE: 32,
    LOGO_SIZE: 24,
};
// Magic numbers for UI components
exports.UI_DIMENSIONS = {
    CARD_MARGIN: 8,
    CARD_PADDING: 12,
    LIST_ITEM_HEIGHT: 100,
    LIST_HEIGHT: 600,
    BORDER_WIDTH: 1,
    BORDER_WIDTH_ACTIVE: 2,
};
// Default settings
exports.DEFAULT_SETTINGS = {
    theme: 'system',
    accentColor: '#0078D4', // Windows blue
    fontSize: 'medium',
    startOnBoot: false,
    minimizeToTray: true,
    enableNotifications: true,
    enableAnimations: true,
    windowOpacity: 0.95,
    backdropEffect: 'acrylic',
};
// WebSocket configuration
exports.WS_RECONNECT_INTERVAL = 5000; // 5 seconds
exports.WS_MAX_RECONNECT_ATTEMPTS = 10;
exports.WS_PING_INTERVAL = 30000; // 30 seconds
// Tray icon tooltips
exports.TRAY_TOOLTIP = 'Smart Pilot - Intelligent Windows Companion';
// Keyboard shortcuts
exports.KEYBOARD_SHORTCUTS = {
    TOGGLE_WINDOW: 'CommandOrControl+Shift+P',
    QUIT_APP: 'CommandOrControl+Q',
    TOGGLE_DEVTOOLS: 'CommandOrControl+Shift+I',
    RELOAD: 'CommandOrControl+R',
    FORCE_RELOAD: 'CommandOrControl+Shift+R',
};
// Storage keys (for electron-store)
exports.STORAGE_KEYS = {
    SETTINGS: 'app-settings',
    WINDOW_STATE: 'window-state',
    WS_URL: 'websocket-url',
    LAST_CONNECTION: 'last-connection',
};
// API endpoints (if connecting to backend)
exports.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
exports.API_ENDPOINTS = {
    HEALTH: '/api/health',
    STATUS: '/api/status',
};
// Environment detection
exports.IS_DEV = process.env.NODE_ENV === 'development';
exports.IS_PROD = process.env.NODE_ENV === 'production';
exports.IS_WINDOWS = process.platform === 'win32';
exports.IS_MAC = process.platform === 'darwin';
exports.IS_LINUX = process.platform === 'linux';
// Logging levels
exports.LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};
// Animation durations (ms)
exports.ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
};
// Z-index layers
exports.Z_INDEX = {
    BACKDROP: 0,
    CONTENT: 1,
    OVERLAY: 10,
    MODAL: 100,
    TOOLTIP: 1000,
    NOTIFICATION: 10000,
};
// Color palette (Insurance Data branding)
exports.COLORS = {
    PRIMARY: '#0078D4',
    SECONDARY: '#005A9E',
    SUCCESS: '#107C10',
    WARNING: '#FF8C00',
    ERROR: '#D83B01',
    INFO: '#0078D4',
    // Neutral colors
    GRAY_10: '#FAF9F8',
    GRAY_20: '#F3F2F1',
    GRAY_30: '#EDEBE9',
    GRAY_40: '#E1DFDD',
    GRAY_50: '#D2D0CE',
    GRAY_60: '#C8C6C4',
    GRAY_70: '#A19F9D',
    GRAY_80: '#605E5C',
    GRAY_90: '#323130',
    GRAY_100: '#201F1E',
};
// Fluent UI theme tokens
exports.THEME_TOKENS = {
    borderRadius: {
        small: '2px',
        medium: '4px',
        large: '8px',
        xlarge: '12px',
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px',
    },
    fontSize: {
        small: '12px',
        medium: '14px',
        large: '16px',
        xlarge: '20px',
        xxlarge: '24px',
    },
};

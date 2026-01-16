/**
 * Shared constants for Smart Pilot application
 */

// Application metadata
export const APP_NAME = 'Smart Pilot';
export const APP_ID = 'com.insurancedata.smartpilot';
export const APP_VERSION = '0.1.0';

// Window configuration
export const DEFAULT_WINDOW_WIDTH = 1200;
export const DEFAULT_WINDOW_HEIGHT = 800;
export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;

// Window state dimensions (Ghost Interface)
export const WINDOW_STATE_DIMENSIONS = {
  HIDDEN: { width: 0, height: 0 },
  HANDLE: { width: 8, heightPercent: 100 },
  WIDGET: { width: 200, height: 200 },
  APP: { width: 400, height: 800 },
  FULLSCREEN: { widthPercent: 100, heightPercent: 100 },
} as const;

// Settings panel dimensions
export const SETTINGS_PANEL = {
  MIN_HEIGHT: 400,
  MAX_HEIGHT: 1200,
  DEFAULT_HEIGHT: 800,
  HEIGHT_STEP: 50,
} as const;

// Title bar dimensions
export const TITLE_BAR = {
  HEIGHT: 40,
  PADDING: 12,
  BUTTON_SIZE: 32,
  LOGO_SIZE: 24,
} as const;

// Magic numbers for UI components
export const UI_DIMENSIONS = {
  CARD_MARGIN: 8,
  CARD_PADDING: 12,
  LIST_ITEM_HEIGHT: 100,
  LIST_HEIGHT: 600,
  BORDER_WIDTH: 1,
  BORDER_WIDTH_ACTIVE: 2,
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  accentColor: '#0078D4', // Windows blue
  fontSize: 'medium' as const,
  startOnBoot: false,
  minimizeToTray: true,
  enableNotifications: true,
  enableAnimations: true,
  windowOpacity: 0.95,
  backdropEffect: 'acrylic' as const,
};

// WebSocket configuration
export const WS_RECONNECT_INTERVAL = 5000; // 5 seconds
export const WS_MAX_RECONNECT_ATTEMPTS = 10;
export const WS_PING_INTERVAL = 30000; // 30 seconds

// Tray icon tooltips
export const TRAY_TOOLTIP = 'Smart Pilot - Intelligent Windows Companion';

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_WINDOW: 'CommandOrControl+Shift+P',
  QUIT_APP: 'CommandOrControl+Q',
  TOGGLE_DEVTOOLS: 'CommandOrControl+Shift+I',
  RELOAD: 'CommandOrControl+R',
  FORCE_RELOAD: 'CommandOrControl+Shift+R',
};

// Storage keys (for electron-store)
export const STORAGE_KEYS = {
  SETTINGS: 'app-settings',
  WINDOW_STATE: 'window-state',
  WS_URL: 'websocket-url',
  LAST_CONNECTION: 'last-connection',
};

// API endpoints (if connecting to backend)
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  STATUS: '/api/status',
};

// Environment detection
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_PROD = process.env.NODE_ENV === 'production';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_MAC = process.platform === 'darwin';
export const IS_LINUX = process.platform === 'linux';

// Logging levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Z-index layers
export const Z_INDEX = {
  BACKDROP: 0,
  CONTENT: 1,
  OVERLAY: 10,
  MODAL: 100,
  TOOLTIP: 1000,
  NOTIFICATION: 10000,
};

// Color palette (Insurance Data branding)
export const COLORS = {
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
export const THEME_TOKENS = {
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

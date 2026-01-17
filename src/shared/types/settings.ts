/**
 * Application settings type definitions
 */

import { PanelPosition, GhostWindowState } from './ui';

export interface GhostInterfaceSettings {
  panelPosition: PanelPosition;
  autoStart: boolean;
  panelHeight: number;
  theme: 'light' | 'dark';
  lastWindowState: GhostWindowState;
}

export interface ElectronWindowSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  startOnBoot: boolean;
  minimizeToTray: boolean;
  enableNotifications: boolean;
  enableAnimations: boolean;
  windowOpacity: number;
  backdropEffect: 'acrylic' | 'mica' | 'none';
}

export interface WindowDetectionSettings {
  windowFilter: string; // Comma-separated keywords to filter windows
  refreshInterval: number; // Refresh interval in seconds (default: 5)
  enableAutoRefresh: boolean; // Enable/disable auto-refresh
}

// Union type for all settings
export type AppSettings = GhostInterfaceSettings | ElectronWindowSettings | WindowDetectionSettings;

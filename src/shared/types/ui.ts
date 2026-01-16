/**
 * UI-specific type definitions for Smart Pilot
 */

export type GhostWindowState = 'hidden' | 'handle' | 'widget' | 'app' | 'fullscreen';

export type PanelPosition = 'left' | 'right';

export interface GhostWindowDimensions {
  width: number | string;
  height: number | string;
}

export interface DetectedWindow {
  id: string;
  title: string;
  processName: string;
  icon?: string;
  applicationType: 'browser' | 'desktop' | 'other';
  url?: string;
  isActive: boolean;
}

export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message: string;
  lastConnected?: Date;
}

export interface UserInfo {
  name: string;
  email?: string;
  avatar?: string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElectronWindowState {
  bounds: WindowBounds;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
}

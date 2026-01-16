/**
 * Type definitions for Smart Pilot Ghost Interface
 */

export type WindowState = 'hidden' | 'handle' | 'widget' | 'app' | 'fullscreen';

export type PanelPosition = 'left' | 'right';

export interface AppSettings {
  panelPosition: PanelPosition;
  autoStart: boolean;
  panelHeight: number;
  theme: 'light' | 'dark';
  lastWindowState: WindowState;
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

/**
 * Global type definitions for Smart Pilot
 * Augments window and global interfaces
 */

import type { SmartPilotAPI } from './shared/types';

declare global {
  /**
   * Window interface augmentation for Electron renderer process
   */
  interface Window {
    /**
     * Smart Pilot API exposed via contextBridge
     */
    smartPilot: SmartPilotAPI;

    /**
     * Electron Store API (optional, may not be available in browser mode)
     */
    electronStore?: {
      get<T>(key: string, defaultValue: T): T;
      set(key: string, value: unknown): void;
      delete(key: string): void;
      has(key: string): boolean;
      clear(): void;
    };
  }

  /**
   * NodeJS global augmentation
   */
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      ELECTRON_RENDERER_URL?: string;
      ELECTRON_PUBLIC?: string;
    }
  }
}

export {};

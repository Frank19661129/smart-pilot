/**
 * Settings Service
 * Manages application settings using electron-store
 */

import Store from 'electron-store';
import log from 'electron-log';
import { WindowDetectionSettings } from '../../shared/types/settings';

interface AppSettingsSchema {
  windowDetection: WindowDetectionSettings;
}

const schema = {
  windowDetection: {
    type: 'object',
    properties: {
      windowFilter: {
        type: 'string',
        default: ''
      },
      refreshInterval: {
        type: 'number',
        default: 5,
        minimum: 1,
        maximum: 60
      },
      enableAutoRefresh: {
        type: 'boolean',
        default: true
      }
    }
  }
};

/**
 * Settings Service Class
 */
export class SettingsService {
  private static instance: SettingsService | null = null;
  private store: Store<AppSettingsSchema>;

  private constructor() {
    this.store = new Store<AppSettingsSchema>({
      schema: schema as any,
      name: 'smart-pilot-settings',
    });

    log.info('[SettingsService] Initialized');
    log.info('[SettingsService] Settings path:', this.store.path);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Get window detection settings
   */
  public getWindowDetectionSettings(): WindowDetectionSettings {
    const settings = this.store.get('windowDetection', {
      windowFilter: '',
      refreshInterval: 5,
      enableAutoRefresh: true,
    });

    log.debug('[SettingsService] getWindowDetectionSettings:', settings);
    return settings;
  }

  /**
   * Update window detection settings
   */
  public setWindowDetectionSettings(settings: Partial<WindowDetectionSettings>): void {
    const current = this.getWindowDetectionSettings();
    const updated = { ...current, ...settings };

    this.store.set('windowDetection', updated);
    log.info('[SettingsService] setWindowDetectionSettings:', updated);
  }

  /**
   * Get window filter
   */
  public getWindowFilter(): string {
    return this.store.get('windowDetection.windowFilter', '');
  }

  /**
   * Set window filter
   */
  public setWindowFilter(filter: string): void {
    this.store.set('windowDetection.windowFilter', filter);
    log.info('[SettingsService] setWindowFilter:', filter);
  }

  /**
   * Get refresh interval
   */
  public getRefreshInterval(): number {
    return this.store.get('windowDetection.refreshInterval', 5);
  }

  /**
   * Set refresh interval
   */
  public setRefreshInterval(interval: number): void {
    // Clamp between 1 and 60 seconds
    const clamped = Math.max(1, Math.min(60, interval));
    this.store.set('windowDetection.refreshInterval', clamped);
    log.info('[SettingsService] setRefreshInterval:', clamped);
  }

  /**
   * Get auto-refresh enabled
   */
  public getEnableAutoRefresh(): boolean {
    return this.store.get('windowDetection.enableAutoRefresh', true);
  }

  /**
   * Set auto-refresh enabled
   */
  public setEnableAutoRefresh(enabled: boolean): void {
    this.store.set('windowDetection.enableAutoRefresh', enabled);
    log.info('[SettingsService] setEnableAutoRefresh:', enabled);
  }

  /**
   * Reset all settings to defaults
   */
  public resetToDefaults(): void {
    this.store.clear();
    log.info('[SettingsService] Settings reset to defaults');
  }

  /**
   * Get all settings
   */
  public getAllSettings(): AppSettingsSchema {
    return this.store.store;
  }
}

export default SettingsService;

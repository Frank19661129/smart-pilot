/**
 * Settings Panel Component
 * User preferences and configuration interface
 *
 * Features:
 * - Panel position configuration (left/right)
 * - Auto-start on Windows boot
 * - Configurable panel height with slider
 * - Persistent settings via electron-store
 * - About section with version information
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Button,
  Switch,
  Radio,
  RadioGroup,
  Slider,
  Label,
  Input,
} from '@fluentui/react-components';
import { Dismiss24Regular, Info24Regular } from '@fluentui/react-icons';
import { motion } from 'framer-motion';
import { themeTokens } from '../styles/theme';
import { AppSettings, PanelPosition } from '../types';
import { createStore } from '../utils/store';
import { WindowDetectionSettings } from '../../shared/types/settings';

// Hardcoded constants to avoid Vite module resolution issues
const SETTINGS_PANEL = {
  MIN_HEIGHT: 400,
  MAX_HEIGHT: 1200,
  DEFAULT_HEIGHT: 800,
  HEIGHT_STEP: 50,
} as const;

/**
 * Props for SettingsPanel component
 */
interface SettingsPanelProps {
  /** Callback function when close button is clicked */
  onClose: () => void;
}

/**
 * SettingsPanel Component
 * Renders application settings with persistent storage
 *
 * @param {SettingsPanelProps} props - Component props
 * @returns {JSX.Element} Rendered settings panel
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const store = createStore();
  const [settings, setSettings] = useState<AppSettings>(
    store.get('appSettings', {
      panelPosition: 'left' as PanelPosition,
      autoStart: false,
      panelHeight: SETTINGS_PANEL.DEFAULT_HEIGHT,
      theme: 'dark',
      lastWindowState: 'handle',
    })
  );
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [windowDetectionSettings, setWindowDetectionSettings] = useState<WindowDetectionSettings>({
    windowFilter: '',
    refreshInterval: 5,
    enableAutoRefresh: true,
  });

  // Save settings to store whenever they change
  useEffect(() => {
    store.set('appSettings', settings);
  }, [settings, store]);

  // Load window detection settings
  useEffect(() => {
    window.smartPilot?.settings?.getWindowDetection?.().then((response: any) => {
      if (response?.success && response?.data) {
        setWindowDetectionSettings(response.data);
      }
    }).catch((error: any) => {
      console.error('Failed to get window detection settings:', error);
    });
  }, []);

  // Save window detection settings when they change
  useEffect(() => {
    window.smartPilot?.settings?.setWindowDetection?.(windowDetectionSettings).catch((error: any) => {
      console.error('Failed to save window detection settings:', error);
    });
  }, [windowDetectionSettings]);

  // Load version info
  useEffect(() => {
    window.smartPilot?.getVersionInfo?.().then((response: any) => {
      if (response?.success && response?.data) {
        setVersionInfo(response.data);
      }
    }).catch((error: any) => {
      console.error('Failed to get version info:', error);
    });
  }, []);

  /**
   * Handle panel position change
   * @param {string} value - New panel position
   */
  const handlePanelPositionChange = useCallback((value: string): void => {
    setSettings((prev) => ({ ...prev, panelPosition: value as PanelPosition }));
  }, []);

  /**
   * Handle auto-start toggle
   * @param {boolean} checked - Auto-start enabled state
   */
  const handleAutoStartChange = useCallback((checked: boolean): void => {
    setSettings((prev) => ({ ...prev, autoStart: checked }));

    // Notify Electron to update auto-start setting
    if (typeof window !== 'undefined' && window.electron?.setAutoStart) {
      window.electron.setAutoStart(checked);
    }
  }, []);

  /**
   * Handle panel height change
   * @param {number} value - New panel height in pixels
   */
  const handlePanelHeightChange = useCallback((value: number): void => {
    setSettings((prev) => ({ ...prev, panelHeight: value }));
  }, []);

  /**
   * Handle window filter change
   */
  const handleWindowFilterChange = useCallback((value: string): void => {
    setWindowDetectionSettings((prev) => ({ ...prev, windowFilter: value }));
  }, []);

  /**
   * Handle refresh interval change
   */
  const handleRefreshIntervalChange = useCallback((value: number): void => {
    setWindowDetectionSettings((prev) => ({ ...prev, refreshInterval: value }));
  }, []);

  /**
   * Handle auto-refresh toggle
   */
  const handleAutoRefreshChange = useCallback((checked: boolean): void => {
    setWindowDetectionSettings((prev) => ({ ...prev, enableAutoRefresh: checked }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: themeTokens.spacing.md,
        height: '100%',
        overflow: 'auto',
        background: themeTokens.colors.grayDark,
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: themeTokens.spacing.lg,
      }}>
        <h2 style={{ 
          color: 'white', 
          fontSize: '24px', 
          margin: 0,
        }}>
          Settings
        </h2>
        <Button
          appearance="subtle"
          icon={<Dismiss24Regular />}
          onClick={onClose}
          aria-label="Close settings panel"
          title="Close settings (Esc)"
          style={{
            color: 'white',
          }}
        />
      </div>

      {/* Panel Position */}
      <div style={{ marginBottom: themeTokens.spacing.lg }} role="group" aria-labelledby="panel-position-label">
        <Label
          id="panel-position-label"
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: themeTokens.spacing.sm,
            display: 'block',
          }}
        >
          Panel Position
        </Label>
        <RadioGroup
          value={settings.panelPosition}
          onChange={(_, data) => handlePanelPositionChange(data.value)}
          aria-label="Select panel position"
        >
          <Radio
            value="left"
            label="Left Side"
            aria-label="Position panel on left side of screen"
            style={{ color: 'white' }}
          />
          <Radio
            value="right"
            label="Right Side"
            aria-label="Position panel on right side of screen"
            style={{ color: 'white' }}
          />
        </RadioGroup>
      </div>

      {/* Auto Start */}
      <div
        style={{
          marginBottom: themeTokens.spacing.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        role="group"
        aria-labelledby="auto-start-label"
      >
        <Label
          id="auto-start-label"
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Auto-start on Windows boot
        </Label>
        <Switch
          checked={settings.autoStart}
          onChange={(_, data) => handleAutoStartChange(data.checked)}
          aria-label="Enable auto-start on Windows boot"
        />
      </div>

      {/* Panel Height */}
      <div style={{ marginBottom: themeTokens.spacing.lg }} role="group" aria-labelledby="panel-height-label">
        <Label
          id="panel-height-label"
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: themeTokens.spacing.sm,
            display: 'block',
          }}
        >
          Panel Height: {settings.panelHeight}px
        </Label>
        <Slider
          value={settings.panelHeight}
          min={SETTINGS_PANEL.MIN_HEIGHT}
          max={SETTINGS_PANEL.MAX_HEIGHT}
          step={SETTINGS_PANEL.HEIGHT_STEP}
          onChange={(_, data) => handlePanelHeightChange(data.value)}
          aria-label={`Panel height: ${settings.panelHeight} pixels`}
          aria-valuemin={SETTINGS_PANEL.MIN_HEIGHT}
          aria-valuemax={SETTINGS_PANEL.MAX_HEIGHT}
          aria-valuenow={settings.panelHeight}
          style={{ width: '100%' }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: themeTokens.colors.grayLight,
          fontSize: '12px',
          marginTop: '8px',
        }}>
          <span>{SETTINGS_PANEL.MIN_HEIGHT}px</span>
          <span>{SETTINGS_PANEL.MAX_HEIGHT}px</span>
        </div>
      </div>

      {/* Window Detection Settings */}
      <div style={{
        marginBottom: themeTokens.spacing.lg,
        padding: themeTokens.spacing.lg,
        background: 'rgba(255, 138, 0, 0.1)',
        borderRadius: themeTokens.borderRadius.md,
        borderLeft: `3px solid ${themeTokens.colors.orange}`,
      }}>
        <h3 style={{
          color: 'white',
          fontSize: '18px',
          margin: '0 0 16px 0',
          fontWeight: 600,
        }}>
          Window Detection
        </h3>

        {/* Window Filter */}
        <div style={{ marginBottom: themeTokens.spacing.md }}>
          <Label
            style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '8px',
              display: 'block',
            }}
          >
            Window Filter
          </Label>
          <Input
            value={windowDetectionSettings.windowFilter}
            onChange={(_, data) => handleWindowFilterChange(data.value)}
            placeholder="chrome, excel, word (comma separated)"
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
            }}
          />
          <p style={{
            color: themeTokens.colors.grayLight,
            fontSize: '11px',
            margin: '4px 0 0 0',
            fontStyle: 'italic',
          }}>
            Filter windows by keywords. Leave empty to show all windows.
          </p>
        </div>

        {/* Auto Refresh Toggle */}
        <div style={{
          marginBottom: themeTokens.spacing.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Label
            style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Auto-refresh window list
          </Label>
          <Switch
            checked={windowDetectionSettings.enableAutoRefresh}
            onChange={(_, data) => handleAutoRefreshChange(data.checked)}
          />
        </div>

        {/* Refresh Interval */}
        {windowDetectionSettings.enableAutoRefresh && (
          <div>
            <Label
              style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                display: 'block',
              }}
            >
              Refresh Interval: {windowDetectionSettings.refreshInterval} seconds
            </Label>
            <Slider
              value={windowDetectionSettings.refreshInterval}
              min={1}
              max={60}
              step={1}
              onChange={(_, data) => handleRefreshIntervalChange(data.value)}
              style={{ width: '100%' }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: themeTokens.colors.grayLight,
              fontSize: '11px',
              marginTop: '4px',
            }}>
              <span>1 sec</span>
              <span>60 sec</span>
            </div>
          </div>
        )}
      </div>

      {/* About Section */}
      <div style={{
        marginTop: themeTokens.spacing.xl,
        padding: themeTokens.spacing.lg,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: themeTokens.borderRadius.md,
        borderLeft: `3px solid ${themeTokens.colors.orange}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Info24Regular style={{ color: themeTokens.colors.orange }} />
          <h3 style={{
            color: 'white',
            fontSize: '16px',
            margin: 0,
            fontWeight: 600,
          }}>
            About Smart Pilot
          </h3>
        </div>
        <p style={{
          color: themeTokens.colors.grayLight,
          fontSize: '12px',
          margin: '0 0 16px 0',
          lineHeight: 1.6,
        }}>
          Smart Pilot is your AI assistant for Insurance Data workflows.
          It intelligently detects your context and provides relevant assistance.
        </p>

        {/* Version Information */}
        {versionInfo && (
          <div style={{
            padding: themeTokens.spacing.md,
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: themeTokens.borderRadius.sm,
            marginBottom: themeTokens.spacing.md,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px' }}>
              <span style={{ color: themeTokens.colors.grayLight, fontSize: '12px' }}>Version:</span>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>
                {versionInfo.version}
              </span>

              <span style={{ color: themeTokens.colors.grayLight, fontSize: '12px' }}>Build:</span>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>
                {versionInfo.buildNumber}
              </span>

              <span style={{ color: themeTokens.colors.grayLight, fontSize: '12px' }}>Build Date:</span>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>
                {new Date(versionInfo.buildDate).toLocaleDateString()} {new Date(versionInfo.buildDate).toLocaleTimeString()}
              </span>

              <span style={{ color: themeTokens.colors.grayLight, fontSize: '12px' }}>Environment:</span>
              <span style={{
                color: versionInfo.environment === 'production' ? themeTokens.colors.orange : themeTokens.colors.orangeLight,
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}>
                {versionInfo.environment}
              </span>

              {versionInfo.gitCommit && (
                <>
                  <span style={{ color: themeTokens.colors.grayLight, fontSize: '12px' }}>Git Commit:</span>
                  <span style={{
                    color: 'white',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                  }}>
                    {versionInfo.gitCommit}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Check for Updates Button */}
        <Button
          appearance="outline"
          style={{
            width: '100%',
            color: 'white',
            borderColor: themeTokens.colors.orange,
          }}
          onClick={() => {
            // Placeholder for future update check functionality
            window.smartPilot?.showNotification?.({
              title: 'Check for Updates',
              body: 'Update checking functionality coming soon!',
            });
          }}
        >
          Check for Updates
        </Button>

        {/* Copyright */}
        <p style={{
          color: themeTokens.colors.grayLight,
          fontSize: '11px',
          margin: '12px 0 0 0',
          textAlign: 'center',
        }}>
          &copy; 2025 Insurance Data. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Export memoized component to prevent unnecessary re-renders
 * Component only re-renders when onClose prop changes
 */
export default memo(SettingsPanel);

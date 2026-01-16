/**
 * Custom Title Bar Component
 * Draggable window controls with Insurance Data branding
 *
 * Features:
 * - Draggable window area (WebkitAppRegion: drag)
 * - Non-draggable button controls
 * - Current state indicator
 * - Insurance Data logo and branding
 * - Accessibility support with ARIA labels
 * - Version display
 */

import React, { memo, useState, useEffect } from 'react';
import { Button } from '@fluentui/react-components';
import {
  Subtract24Regular,
  Dismiss24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { themeTokens } from '../styles/theme';
import { WindowState } from '../types';

// Hardcoded constants to avoid Vite module resolution issues
const TITLE_BAR = {
  HEIGHT: 40,
  PADDING: 12,
  BUTTON_SIZE: 32,
  LOGO_SIZE: 24,
} as const;

/**
 * Props for TitleBar component
 */
interface TitleBarProps {
  /** Callback when minimize button is clicked */
  onMinimize: () => void;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Callback when settings button is clicked */
  onSettings: () => void;
  /** Current window state for display */
  currentState: WindowState;
}

/**
 * TitleBar Component
 * Renders custom window controls with draggable region
 *
 * @param {TitleBarProps} props - Component props
 * @returns {JSX.Element} Rendered title bar
 */
const TitleBar: React.FC<TitleBarProps> = ({
  onMinimize,
  onClose,
  onSettings,
  currentState,
}) => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    // Get version info from IPC
    window.smartPilot?.getVersionInfo?.().then((response: any) => {
      if (response?.success && response?.data) {
        setVersion(`v${response.data.version}`);
      }
    }).catch((error: any) => {
      console.error('Failed to get version info:', error);
    });
  }, []);

  return (
    <div
      className="title-bar"
      role="banner"
      aria-label="Application title bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: `${TITLE_BAR.HEIGHT}px`,
        padding: `0 ${TITLE_BAR.PADDING}px`,
        background: themeTokens.colors.grayMedium,
        borderBottom: `1px solid ${themeTokens.colors.grayLight}`,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left: Logo and Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
        aria-label="Application branding"
      >
        <div
          style={{
            width: `${TITLE_BAR.LOGO_SIZE}px`,
            height: `${TITLE_BAR.LOGO_SIZE}px`,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${themeTokens.colors.orange} 0%, ${themeTokens.colors.orangeLight} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
          }}
          aria-label="Smart Pilot logo"
        >
          SP
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
            }}
            aria-label="Application name"
          >
            Smart Pilot
          </span>
          {version && (
            <span
              style={{
                color: themeTokens.colors.orangeLight,
                fontSize: '11px',
                fontWeight: 500,
              }}
              title={`Version ${version}`}
              aria-label={`Version ${version}`}
            >
              {version}
            </span>
          )}
        </div>
        <span
          style={{
            color: themeTokens.colors.grayLight,
            fontSize: '10px',
            padding: '2px 6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
          aria-label={`Current state: ${currentState}`}
          role="status"
        >
          {currentState}
        </span>
      </div>

      {/* Right: Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
        role="group"
        aria-label="Window controls"
      >
        <Button
          appearance="subtle"
          icon={<Settings24Regular />}
          onClick={onSettings}
          aria-label="Open settings"
          title="Settings (Ctrl+,)"
          style={{
            color: 'white',
            minWidth: `${TITLE_BAR.BUTTON_SIZE}px`,
            padding: 0,
          }}
        />
        <Button
          appearance="subtle"
          icon={<Subtract24Regular />}
          onClick={onMinimize}
          aria-label="Minimize window"
          title="Minimize"
          style={{
            color: 'white',
            minWidth: `${TITLE_BAR.BUTTON_SIZE}px`,
            padding: 0,
          }}
        />
        <Button
          appearance="subtle"
          icon={<Dismiss24Regular />}
          onClick={onClose}
          aria-label="Close window"
          title="Close"
          style={{
            color: 'white',
            minWidth: `${TITLE_BAR.BUTTON_SIZE}px`,
            padding: 0,
          }}
        />
      </div>
    </div>
  );
};

/**
 * Export memoized component to prevent unnecessary re-renders
 * Component only re-renders when props change
 */
export default memo(TitleBar);

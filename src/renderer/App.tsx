/**
 * Main App Component - Ghost Interface
 * State-aware layout that adapts to window state
 *
 * Features:
 * - 5-state Ghost Interface (hidden, handle, widget, app, fullscreen)
 * - Splash screen with connection status
 * - Settings panel overlay
 * - Window list with virtual scrolling
 * - Smooth animations with framer-motion
 * - FluentUI theming integration
 *
 * Architecture:
 * - Uses custom hooks for window state management
 * - Memoized handlers for performance
 * - Proper cleanup of timers and effects
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { motion, AnimatePresence } from 'framer-motion';
import { insuranceDataDarkTheme } from './styles/theme';
import { useWindowState } from './hooks/useWindowState';
import TitleBar from './components/TitleBar';
import SplashScreen from './components/SplashScreen';
import SettingsPanel from './components/SettingsPanel';
import WindowListView from './components/WindowListView';
import { ConnectionStatus, UserInfo } from './types';
import './styles/ghost-interface.css';
import './styles/animations.css';
import './styles/windows-effects.css';

/**
 * App Component
 * Root component managing Ghost Interface states
 *
 * @returns {JSX.Element} Rendered application
 */
const App: React.FC = () => {
  const { currentState, expand, collapse, hide, toggleFullscreen } = useWindowState();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connecting',
    message: 'Connecting to Smart Flow server...',
  });
  const [userInfo] = useState<UserInfo>({
    name: 'User',
    email: 'user@insurancedata.nl',
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Simulate connection process with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let connectionTimer: NodeJS.Timeout;
    let splashTimer: NodeJS.Timeout;

    connectionTimer = setTimeout(() => {
      if (isMounted) {
        setConnectionStatus({
          status: 'connected',
          message: 'Connected to Smart Flow server',
          lastConnected: new Date(),
        });

        // Hide splash after successful connection
        splashTimer = setTimeout(() => {
          if (isMounted) {
            setShowSplash(false);
          }
        }, 1500);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(connectionTimer);
      clearTimeout(splashTimer);
    };
  }, []);

  /**
   * Toggle settings panel visibility
   */
  const handleToggleSettings = useCallback((): void => {
    setShowSettings((prev) => !prev);
  }, []);

  /**
   * Close settings panel
   */
  const handleCloseSettings = useCallback((): void => {
    setShowSettings(false);
  }, []);

  /**
   * Render content based on current window state
   * @returns {JSX.Element | null} Rendered content or null
   */
  const renderStateContent = useCallback((): JSX.Element | null => {
    switch (currentState) {
      case 'hidden':
        return null;

      case 'handle':
        return (
          <motion.div
            className="handle-view"
            role="button"
            aria-label="Expand Smart Pilot"
            tabIndex={0}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onClick={expand}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') expand();
            }}
          >
            <div className="handle-glow" aria-hidden="true" />
          </motion.div>
        );

      case 'widget':
        return (
          <motion.div
            className="widget-view"
            role="region"
            aria-label="Smart Pilot widget"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="widget-icon"
              role="button"
              aria-label="Expand Smart Pilot"
              tabIndex={0}
              onClick={expand}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') expand();
              }}
            >
              SP
            </div>
            <button onClick={expand} aria-label="Expand to full application">
              Expand
            </button>
          </motion.div>
        );

      case 'app':
        return (
          <motion.div
            className="app-view"
            role="main"
            aria-label="Smart Pilot application"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <TitleBar
              onMinimize={collapse}
              onClose={hide}
              onSettings={handleToggleSettings}
              currentState={currentState}
            />
            <div className="app-content">
              {showSettings ? (
                <SettingsPanel onClose={handleCloseSettings} />
              ) : (
                <WindowListView />
              )}
            </div>
          </motion.div>
        );

      case 'fullscreen':
        return (
          <motion.div
            className="fullscreen-view"
            role="main"
            aria-label="Smart Pilot dashboard fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TitleBar
              onMinimize={toggleFullscreen}
              onClose={hide}
              onSettings={handleToggleSettings}
              currentState={currentState}
            />
            <div className="fullscreen-content">
              <h1>Smart Pilot Dashboard</h1>
              {showSettings ? (
                <SettingsPanel onClose={handleCloseSettings} />
              ) : (
                <WindowListView />
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  }, [currentState, expand, collapse, hide, toggleFullscreen, showSettings, handleToggleSettings, handleCloseSettings]);

  return (
    <FluentProvider theme={insuranceDataDarkTheme}>
      <div className="smart-pilot-app" data-state={currentState}>
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen
              key="splash"
              connectionStatus={connectionStatus}
              userInfo={userInfo}
            />
          ) : (
            <React.Fragment key="main">
              {renderStateContent()}
            </React.Fragment>
          )}
        </AnimatePresence>
      </div>
    </FluentProvider>
  );
};

export default App;

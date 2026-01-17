/**
 * WindowListView Component
 * Displays detected windows in a compact, scrollable grid layout
 */

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { themeTokens } from '../styles/theme';

/**
 * UI Constants
 */
const UI_DIMENSIONS = {
  ROW_HEIGHT: 32,
  ROW_PADDING: 8,
} as const;

/**
 * DetectedWindow interface
 */
export interface DetectedWindow {
  id: string;
  title: string;
  processName: string;
  applicationType: 'browser' | 'desktop';
  isActive: boolean;
}

/**
 * Loading state
 */
type LoadingState =
  | { status: 'loading' }
  | { status: 'success'; data: DetectedWindow[] }
  | { status: 'error'; error: string };

/**
 * WindowListView Component
 * Renders list of detected windows in a compact grid
 */
const WindowListView: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'loading',
  });

  // Fetch windows with cleanup
  useEffect(() => {
    let isMounted = true;

    console.log('[WindowListView] Mounting component...');

    const fetchWindows = async () => {
      try {
        console.log('[WindowListView] Fetching windows from backend...');

        // Call IPC to get all windows
        const response = await window.smartPilot?.windows?.getAll();

        console.log('[WindowListView] IPC Response:', response);

        if (!response || !response.success) {
          throw new Error(response?.error?.message || 'Failed to get windows');
        }

        const windowsData = response.data;
        console.log('[WindowListView] Received windows data:', windowsData);

        // Log errors if any
        if (windowsData.errors && windowsData.errors.length > 0) {
          console.error('[WindowListView] Errors from backend:', windowsData.errors);
          throw new Error(windowsData.errors[0].message || 'Unknown error from backend');
        }

        // Map backend WindowInfo to frontend DetectedWindow format
        const detectedWindows: DetectedWindow[] = windowsData.windows.map((win: any, index: number) => ({
          id: String(win.windowHandle || index),
          title: win.title,
          processName: win.processName,
          applicationType: 'desktop',
          isActive: index === 0,
        }));

        console.log('[WindowListView] Mapped to DetectedWindow format:', detectedWindows.length, 'windows');

        if (!isMounted) return;

        setLoadingState({
          status: 'success',
          data: detectedWindows,
        });
      } catch (error) {
        console.error('[WindowListView] Error fetching windows:', error);
        if (!isMounted) return;

        setLoadingState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchWindows();

    return () => {
      isMounted = false;
      console.log('[WindowListView] Component unmounting...');
    };
  }, []);

  /**
   * Render compact table row
   */
  const renderWindowRow = useCallback(
    (window: DetectedWindow, index: number): JSX.Element => {
      return (
        <motion.div
          key={window.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.1, delay: index * 0.005 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '12px',
            padding: `${UI_DIMENSIONS.ROW_PADDING}px 12px`,
            height: `${UI_DIMENSIONS.ROW_HEIGHT}px`,
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: window.isActive
              ? 'rgba(255, 138, 0, 0.1)'
              : 'transparent',
            borderLeft: window.isActive
              ? `3px solid ${themeTokens.colors.orange}`
              : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = window.isActive
              ? 'rgba(255, 138, 0, 0.1)'
              : 'transparent';
          }}
          role="row"
        >
          {/* Title Column */}
          <div
            style={{
              color: 'white',
              fontSize: '11px',
              fontWeight: window.isActive ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={window.title}
            role="cell"
          >
            {window.title}
          </div>

          {/* Window Handle Column */}
          <div
            style={{
              color: themeTokens.colors.grayLight,
              fontSize: '10px',
              fontFamily: 'monospace',
              textAlign: 'right',
              flexShrink: 0,
            }}
            title={`Handle: ${window.id}`}
            role="cell"
          >
            {window.id}
          </div>
        </motion.div>
      );
    },
    []
  );

  // Memoize window count to prevent recalculation
  const windowCount = useMemo(
    () => (loadingState.status === 'success' ? loadingState.data.length : 0),
    [loadingState]
  );

  // Loading state
  if (loadingState.status === 'loading') {
    console.log('[WindowListView] Rendering loading state');
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'white',
        }}
        role="status"
        aria-live="polite"
        aria-label="Loading windows"
      >
        <span>Loading windows...</span>
      </div>
    );
  }

  // Error state
  if (loadingState.status === 'error') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'white',
          padding: '20px',
        }}
        role="alert"
        aria-live="assertive"
      >
        <span style={{ fontSize: '18px', marginBottom: '8px' }}>Error Loading Windows</span>
        <span style={{ fontSize: '14px', color: themeTokens.colors.grayLight }}>
          {loadingState.error}
        </span>
      </div>
    );
  }

  // Success state - Compact grid layout
  console.log('[WindowListView] Rendering success state with', windowCount, 'windows');
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      role="region"
      aria-label="Window list"
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 12px 8px',
          borderBottom: `1px solid ${themeTokens.colors.grayLight}`,
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            color: 'white',
            fontSize: '16px',
            margin: 0,
            fontWeight: 600,
          }}
          id="window-list-heading"
        >
          Active Windows
        </h3>
        <p
          style={{
            color: themeTokens.colors.grayLight,
            fontSize: '11px',
            margin: '3px 0 0',
          }}
          aria-live="polite"
        >
          {windowCount} window{windowCount !== 1 ? 's' : ''} detected
        </p>
      </div>

      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '12px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '10px',
          fontWeight: 600,
          color: themeTokens.colors.grayLight,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
        role="row"
      >
        <div role="columnheader">Window Title</div>
        <div role="columnheader" style={{ textAlign: 'right' }}>Handle</div>
      </div>

      {/* Scrollable table body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        role="table"
        aria-labelledby="window-list-heading"
      >
        {loadingState.data.map((window, index) => renderWindowRow(window, index))}
      </div>
    </div>
  );
};

/**
 * Export memoized component to prevent unnecessary re-renders
 */
export default memo(WindowListView);

/**
 * WindowListView Component
 * Displays detected windows in a compact, scrollable grid layout
 */

import React, { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@fluentui/react-components';
import { ArrowUpload20Regular } from '@fluentui/react-icons';
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
  context?: string; // Relatienummer from OCR
  contextLoading?: boolean; // True while OCR is running
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
  const [windowFilter, setWindowFilter] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Cache for context detection results (persists across refreshes)
  const contextCacheRef = useRef<Map<string, { context?: string; loading: boolean }>>(new Map());

  // Load settings
  useEffect(() => {
    console.log('[WindowListView] Loading settings...');

    window.smartPilot?.settings?.getWindowDetection?.().then((response: any) => {
      if (response?.success && response?.data) {
        const settings = response.data;
        setWindowFilter(settings.windowFilter || '');
        setRefreshInterval(settings.refreshInterval || 5);
        setAutoRefresh(settings.enableAutoRefresh !== false);
        console.log('[WindowListView] Settings loaded:', settings);
      }
    }).catch((error: any) => {
      console.error('[WindowListView] Failed to load settings:', error);
    });
  }, []);

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
        let detectedWindows: DetectedWindow[] = windowsData.windows.map((win: any, index: number) => {
          const windowId = String(win.windowHandle || index);
          const cachedContext = contextCacheRef.current.get(windowId);

          // If we have a cache entry, use it. Otherwise, mark as loading (will be detected)
          const isNewWindow = !cachedContext;

          return {
            id: windowId,
            title: win.title,
            processName: win.processName,
            applicationType: 'desktop',
            isActive: index === 0,
            context: cachedContext?.context,
            contextLoading: isNewWindow ? true : (cachedContext?.loading ?? false),
          };
        });

        // Apply filter if set
        if (windowFilter && windowFilter.trim()) {
          const keywords = windowFilter.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
          console.log('[WindowListView] Applying filter keywords:', keywords);

          detectedWindows = detectedWindows.filter(win => {
            const searchText = `${win.title} ${win.processName}`.toLowerCase();
            return keywords.some(keyword => searchText.includes(keyword));
          });

          console.log('[WindowListView] Filtered from', windowsData.windows.length, 'to', detectedWindows.length, 'windows');
        }

        console.log('[WindowListView] Final window count:', detectedWindows.length);

        if (!isMounted) return;

        setLoadingState({
          status: 'success',
          data: detectedWindows,
        });

        // Cleanup cache: remove windows that no longer exist
        const currentWindowIds = new Set(detectedWindows.map(w => w.id));
        const cachedWindowIds = Array.from(contextCacheRef.current.keys());
        cachedWindowIds.forEach(cachedId => {
          if (!currentWindowIds.has(cachedId)) {
            console.log(`[WindowListView] Removing stale cache entry for window ${cachedId}`);
            contextCacheRef.current.delete(cachedId);
          }
        });

        // Detect context ONLY for NEW windows (not in cache)
        const detectContextForNewWindows = async () => {
          for (const win of detectedWindows) {
            // Skip if already in cache
            if (contextCacheRef.current.has(win.id)) {
              console.log(`[WindowListView] Using cached context for window ${win.id}`);
              continue;
            }

            // Mark as loading in cache
            contextCacheRef.current.set(win.id, { loading: true });

            try {
              console.log(`[WindowListView] Detecting context for NEW window ${win.id}...`);
              const contextResponse = await window.smartPilot?.windows?.detectContext(Number(win.id));

            if (!isMounted) return;

            if (contextResponse?.success && contextResponse?.data) {
              const contextData = contextResponse.data;
              const relatienummer = contextData.relatienummer || undefined;
              console.log(`[WindowListView] Context detected for window ${win.id}:`, relatienummer);

              // Update cache
              contextCacheRef.current.set(win.id, {
                context: relatienummer,
                loading: false,
              });

              // Update UI
              setLoadingState(prevState => {
                if (prevState.status !== 'success') return prevState;

                const updatedWindows = prevState.data.map(w => {
                  if (w.id === win.id) {
                    return {
                      ...w,
                      context: relatienummer,
                      contextLoading: false,
                    };
                  }
                  return w;
                });

                return {
                  status: 'success',
                  data: updatedWindows,
                };
              });
            } else {
              console.warn(`[WindowListView] No context found for window ${win.id}`);

              // Update cache - no context found
              contextCacheRef.current.set(win.id, {
                loading: false,
              });

              // Update UI
              setLoadingState(prevState => {
                if (prevState.status !== 'success') return prevState;

                const updatedWindows = prevState.data.map(w => {
                  if (w.id === win.id) {
                    return { ...w, contextLoading: false };
                  }
                  return w;
                });

                return {
                  status: 'success',
                  data: updatedWindows,
                };
              });
            }
          } catch (error) {
            console.error(`[WindowListView] Error detecting context for window ${win.id}:`, error);

            // Update cache - error occurred
            contextCacheRef.current.set(win.id, {
              loading: false,
            });

            // Update UI
            setLoadingState(prevState => {
              if (prevState.status !== 'success') return prevState;

              const updatedWindows = prevState.data.map(w => {
                if (w.id === win.id) {
                  return { ...w, contextLoading: false };
                }
                return w;
              });

              return {
                status: 'success',
                data: updatedWindows,
              };
            });
          }
        }
        };

        // Start context detection for new windows (don't await - runs in background)
        detectContextForNewWindows();
      } catch (error) {
        console.error('[WindowListView] Error fetching windows:', error);
        if (!isMounted) return;

        setLoadingState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Initial fetch
    fetchWindows();

    // Setup auto-refresh interval if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh && refreshInterval > 0) {
      console.log(`[WindowListView] Setting up auto-refresh every ${refreshInterval} seconds`);
      intervalId = setInterval(() => {
        console.log('[WindowListView] Auto-refresh triggered');
        fetchWindows();
      }, refreshInterval * 1000);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
        console.log('[WindowListView] Auto-refresh interval cleared');
      }
      console.log('[WindowListView] Component unmounting...');
    };
  }, [windowFilter, refreshInterval, autoRefresh]);

  /**
   * Handle activate window button click
   */
  const handleActivate = useCallback(async (windowHandle: string) => {
    try {
      console.log(`[WindowListView] Activating window ${windowHandle}`);
      const result = await window.smartPilot?.windows?.activate(Number(windowHandle));

      if (result && result.success) {
        console.log(`[WindowListView] Successfully activated window ${windowHandle}`);
      } else {
        console.error(`[WindowListView] Failed to activate window ${windowHandle}:`, result?.error);
      }
    } catch (error) {
      console.error(`[WindowListView] Error activating window ${windowHandle}:`, error);
    }
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
            gridTemplateColumns: '1fr auto auto auto',
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

          {/* Context Column (Relatienummer) */}
          <div
            style={{
              color: window.context ? themeTokens.colors.orange : themeTokens.colors.grayLight,
              fontSize: '10px',
              fontFamily: 'monospace',
              textAlign: 'center',
              flexShrink: 0,
              width: '90px',
            }}
            title={window.context ? `Relatienummer: ${window.context}` : 'Geen context'}
            role="cell"
          >
            {window.contextLoading ? '...' : window.context || '-'}
          </div>

          {/* Activate Button Column */}
          <div
            role="cell"
            style={{
              flexShrink: 0,
            }}
          >
            <Button
              size="small"
              appearance="subtle"
              icon={<ArrowUpload20Regular />}
              onClick={(e) => {
                e.stopPropagation();
                handleActivate(window.id);
              }}
              style={{
                minWidth: '32px',
                height: '24px',
                padding: '0 8px',
                color: themeTokens.colors.orange,
              }}
              title="Activeer window"
            >
              Activeer
            </Button>
          </div>
        </motion.div>
      );
    },
    [handleActivate]
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
          gridTemplateColumns: '1fr auto auto auto',
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
        <div role="columnheader" style={{ textAlign: 'center', width: '90px' }}>Context</div>
        <div role="columnheader" style={{ textAlign: 'right', width: '100px' }}>Actie</div>
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

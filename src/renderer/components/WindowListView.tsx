/**
 * Window List View Component
 * Displays detected windows/tabs with virtual scrolling
 *
 * Features:
 * - Virtual scrolling for performance (react-window)
 * - Loading and error states
 * - Animated window items with framer-motion
 * - Active window highlighting
 * - Application type icons
 * - Accessibility support
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Card,
  Badge,
  Avatar,
} from '@fluentui/react-components';
import {
  Window24Regular,
  Desktop24Regular,
  Globe24Regular,
  CircleFilled,
} from '@fluentui/react-icons';
import { motion } from 'framer-motion';
import { themeTokens } from '../styles/theme';
import { DetectedWindow } from '../types';

// Hardcoded constants to avoid Vite module resolution issues
const UI_DIMENSIONS = {
  CARD_MARGIN: 8,
  CARD_PADDING: 12,
  LIST_ITEM_HEIGHT: 100,
  LIST_HEIGHT: 600,
  BORDER_WIDTH: 1,
  BORDER_WIDTH_ACTIVE: 2,
} as const;

/**
 * Loading state type for async operations
 */
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: DetectedWindow[] }
  | { status: 'error'; error: string };

/**
 * WindowListView Component
 * Renders list of detected windows with virtual scrolling
 *
 * @returns {JSX.Element} Rendered window list
 */
const WindowListView: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'loading',
  });

  // Fetch windows with cleanup
  useEffect(() => {
    let isMounted = true;

    // Simulate fetching windows
    const timer = setTimeout(() => {
      if (isMounted) {
        const mockWindows: DetectedWindow[] = [
          {
            id: '1',
            title: 'Insurance Data Portal - Home',
            processName: 'chrome.exe',
            applicationType: 'browser',
            url: 'https://portal.insurancedata.nl',
            isActive: true,
          },
          {
            id: '2',
            title: 'Customer Policy Review',
            processName: 'excel.exe',
            applicationType: 'desktop',
            isActive: false,
          },
          {
            id: '3',
            title: 'Claims Dashboard',
            processName: 'chrome.exe',
            applicationType: 'browser',
            url: 'https://claims.insurancedata.nl',
            isActive: false,
          },
          {
            id: '4',
            title: 'Underwriting Analysis.docx',
            processName: 'winword.exe',
            applicationType: 'desktop',
            isActive: false,
          },
          {
            id: '5',
            title: 'Email - Inbox',
            processName: 'outlook.exe',
            applicationType: 'desktop',
            isActive: false,
          },
        ];

        setLoadingState({
          status: 'success',
          data: mockWindows,
        });
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  /**
   * Get icon for application type
   * @param {string} type - Application type
   * @returns {JSX.Element} Icon component
   */
  const getApplicationIcon = useCallback((type: string): JSX.Element => {
    switch (type) {
      case 'browser':
        return <Globe24Regular />;
      case 'desktop':
        return <Desktop24Regular />;
      default:
        return <Window24Regular />;
    }
  }, []);

  /**
   * Memoized window item renderer
   */
  const WindowItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }): JSX.Element => {
      if (loadingState.status !== 'success') {
        return <div style={style} />;
      }

      const window = loadingState.data[index];
    
      return (
        <motion.div
          style={style}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card
            role="listitem"
            aria-label={`${window.title}, ${window.processName}, ${window.isActive ? 'active' : 'inactive'}`}
            style={{
              margin: `${UI_DIMENSIONS.CARD_MARGIN}px ${UI_DIMENSIONS.CARD_PADDING}px`,
              background: window.isActive
                ? `linear-gradient(135deg, ${themeTokens.colors.grayMedium} 0%, ${themeTokens.colors.grayDark} 100%)`
                : themeTokens.colors.grayMedium,
              border: window.isActive
                ? `${UI_DIMENSIONS.BORDER_WIDTH_ACTIVE}px solid ${themeTokens.colors.orange}`
                : `${UI_DIMENSIONS.BORDER_WIDTH}px solid rgba(255, 255, 255, 0.1)`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: `${UI_DIMENSIONS.CARD_PADDING}px`,
              }}
            >
              <Avatar
                icon={getApplicationIcon(window.applicationType)}
                color="colorful"
                aria-label={`${window.applicationType} application`}
                style={{
                  background: window.isActive
                    ? themeTokens.colors.orange
                    : themeTokens.colors.grayLight,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  {window.isActive && (
                    <CircleFilled
                      style={{
                        fontSize: '8px',
                        color: themeTokens.colors.orange,
                      }}
                      aria-label="Active indicator"
                    />
                  )}
                  <span
                    style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: window.isActive ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {window.title}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      color: themeTokens.colors.grayLight,
                      fontSize: '12px',
                    }}
                  >
                    {window.processName}
                  </span>
                  {window.applicationType === 'browser' && (
                    <Badge appearance="outline" color="informative" size="small">
                      Web
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      );
    },
    [loadingState, getApplicationIcon]
  );

  // Memoize window count to prevent recalculation
  const windowCount = useMemo(
    () => (loadingState.status === 'success' ? loadingState.data.length : 0),
    [loadingState]
  );

  // Loading state
  if (loadingState.status === 'loading') {
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

  // Success state
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="region"
      aria-label="Window list"
    >
      <div
        style={{
          padding: '16px 12px 8px',
          borderBottom: `1px solid ${themeTokens.colors.grayLight}`,
        }}
      >
        <h3
          style={{
            color: 'white',
            fontSize: '18px',
            margin: 0,
          }}
          id="window-list-heading"
        >
          Active Windows
        </h3>
        <p
          style={{
            color: themeTokens.colors.grayLight,
            fontSize: '12px',
            margin: '4px 0 0',
          }}
          aria-live="polite"
        >
          {windowCount} window{windowCount !== 1 ? 's' : ''} detected
        </p>
      </div>

      <div style={{ flex: 1 }} role="list" aria-labelledby="window-list-heading">
        <List
          height={UI_DIMENSIONS.LIST_HEIGHT}
          itemCount={windowCount}
          itemSize={UI_DIMENSIONS.LIST_ITEM_HEIGHT}
          width="100%"
        >
          {WindowItem}
        </List>
      </div>
    </div>
  );
};

/**
 * Export memoized component to prevent unnecessary re-renders
 */
export default memo(WindowListView);

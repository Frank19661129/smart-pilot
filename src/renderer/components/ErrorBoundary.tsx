/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */

import React from 'react';
import { Button, Card } from '@fluentui/react-components';
import { ErrorCircle24Filled, ArrowReset24Regular } from '@fluentui/react-icons';
import { themeTokens } from '../styles/theme';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('React component error caught:', error, {
        componentStack: errorInfo.componentStack,
      });
    }

    // In production, could send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: themeTokens.colors.grayDark,
            padding: '20px',
          }}
        >
          <Card
            style={{
              maxWidth: '600px',
              padding: '32px',
              background: themeTokens.colors.grayMedium,
              border: `2px solid ${themeTokens.colors.orange}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <ErrorCircle24Filled
                primaryFill={themeTokens.colors.orange}
                style={{ fontSize: '48px' }}
              />
              <div>
                <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>
                  Something went wrong
                </h1>
                <p style={{ color: themeTokens.colors.grayLight, margin: '8px 0 0' }}>
                  The application encountered an unexpected error
                </p>
              </div>
            </div>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                }}
              >
                <p style={{ color: themeTokens.colors.orange, fontWeight: 600, margin: '0 0 8px' }}>
                  Error Details:
                </p>
                <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '12px', margin: 0 }}>
                  {this.state.error.message}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details style={{ marginTop: '12px' }}>
                    <summary style={{ color: themeTokens.colors.grayLight, cursor: 'pointer' }}>
                      Component Stack
                    </summary>
                    <pre
                      style={{
                        color: themeTokens.colors.grayLight,
                        fontSize: '10px',
                        overflow: 'auto',
                        marginTop: '8px',
                        maxHeight: '200px',
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                appearance="primary"
                icon={<ArrowReset24Regular />}
                onClick={this.handleReset}
                style={{ flex: 1 }}
              >
                Try Again
              </Button>
              <Button
                appearance="secondary"
                onClick={this.handleReload}
                style={{ flex: 1 }}
              >
                Reload Application
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

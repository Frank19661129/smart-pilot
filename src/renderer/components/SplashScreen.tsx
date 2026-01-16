/**
 * Splash Screen Component
 * Shows during initial connection to Smart Flow server
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@fluentui/react-components';
import { CheckmarkCircle24Filled } from '@fluentui/react-icons';
import { themeTokens } from '../styles/theme';
import { ConnectionStatus, UserInfo } from '../types';

interface SplashScreenProps {
  connectionStatus: ConnectionStatus;
  userInfo: UserInfo;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ connectionStatus, userInfo }) => {
  const isConnected = connectionStatus.status === 'connected';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${themeTokens.colors.grayDark} 0%, #2a2827 100%)`,
        gap: themeTokens.spacing.lg,
      }}
    >
      {/* Insurance Data Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.4, 0, 0.2, 1],
          delay: 0.2 
        }}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${themeTokens.colors.orange} 0%, ${themeTokens.colors.orangeLight} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
          boxShadow: themeTokens.shadows.orange,
        }}
      >
        ID
      </motion.div>

      {/* Smart Pilot Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          textAlign: 'center',
        }}
      >
        <h1 style={{
          color: 'white',
          fontSize: '32px',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          Smart Pilot
        </h1>
        {version && (
          <p style={{
            color: themeTokens.colors.orangeLight,
            fontSize: '14px',
            margin: '0 0 8px 0',
            fontWeight: 500,
          }}>
            {version}
          </p>
        )}
        <p style={{
          color: themeTokens.colors.grayLight,
          fontSize: '16px',
          margin: 0,
        }}>
          AI Assistant for Insurance Data
        </p>
      </motion.div>

      {/* User Name */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{
          color: themeTokens.colors.orangeLight,
          fontSize: '18px',
          fontWeight: 500,
        }}
      >
        Welcome, {userInfo.name}
      </motion.div>

      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: themeTokens.spacing.sm,
          padding: themeTokens.spacing.sm,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: themeTokens.borderRadius.md,
          minWidth: '300px',
          justifyContent: 'center',
        }}
      >
        {isConnected ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <CheckmarkCircle24Filled 
                primaryFill={themeTokens.colors.orange}
              />
            </motion.div>
            <span style={{ color: 'white', fontSize: '14px' }}>
              {connectionStatus.message}
            </span>
          </>
        ) : (
          <>
            <Spinner size="small" />
            <span style={{ color: themeTokens.colors.grayLight, fontSize: '14px' }}>
              {connectionStatus.message}
            </span>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;

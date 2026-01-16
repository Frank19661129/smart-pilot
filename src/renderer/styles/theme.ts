/**
 * Insurance Data Fluent UI Theme
 * Based on Insurance Data Design System
 */

import { 
  createLightTheme, 
  createDarkTheme, 
  Theme,
  BrandVariants 
} from '@fluentui/react-components';

// Insurance Data Brand Colors - Official #EC6726
const insuranceDataBrand: BrandVariants = {
  10: '#FFF5F0',
  20: '#FFE8DC',
  30: '#FFD1B8',
  40: '#FFBA94',
  50: '#FF9966',
  60: '#EC6726',
  70: '#CC5229',
  80: '#993D1F',
  90: '#662914',
  100: '#33140A',
  110: '#1a0805',
  120: '#0d0402',
  130: '#060201',
  140: '#030100',
  150: '#010000',
  160: '#000000',
};

// Create Light Theme
export const insuranceDataLightTheme: Theme = createLightTheme(insuranceDataBrand);

// Create Dark Theme with Insurance Data gray backgrounds
export const insuranceDataDarkTheme: Theme = createDarkTheme(insuranceDataBrand);

// Custom overrides for Insurance Data dark theme
insuranceDataDarkTheme.colorNeutralBackground1 = '#4A4645'; // Main dark background
insuranceDataDarkTheme.colorNeutralBackground2 = '#5A5655'; // Elevated surfaces
insuranceDataDarkTheme.colorNeutralBackground3 = '#6A6665'; // Hover states
insuranceDataDarkTheme.colorBrandBackground = '#EC6726'; // Orange brand
insuranceDataDarkTheme.colorBrandBackgroundHover = '#FF9966'; // Orange hover
insuranceDataDarkTheme.colorBrandBackgroundPressed = '#CC5229'; // Orange pressed

// Theme tokens for easy access
export const themeTokens = {
  colors: {
    orange: '#EC6726',
    orangeLight: '#FF9966',
    orangeDark: '#CC5229',
    orangeTransparent: 'rgba(236, 103, 38, 0.1)',
    grayDark: '#4A4645',
    grayMedium: '#5A5655',
    grayLight: '#6A6665',
    white: '#FFFFFF',
    black: '#1a1a1a',
  },
  spacing: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '40px',
    xl: '60px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  transitions: {
    fast: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    base: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
    md: '0 4px 16px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
    orange: '0 4px 12px rgba(255, 102, 51, 0.3)',
  },
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1400,
    tooltip: 1600,
  },
};

// Window state dimensions
export const windowStateDimensions = {
  hidden: { width: 0, height: 0 },
  handle: { width: 8, height: '100vh' },
  widget: { width: 200, height: 200 },
  app: { width: 400, height: 800 },
  fullscreen: { width: '100vw', height: '100vh' },
};

export type WindowState = 'hidden' | 'handle' | 'widget' | 'app' | 'fullscreen';

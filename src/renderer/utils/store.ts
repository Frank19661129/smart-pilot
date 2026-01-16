/**
 * Store Utility
 * Centralized storage access with fallback to localStorage
 * Eliminates code duplication across components
 */

/**
 * Interface for store operations
 */
export interface Store {
  get<T>(key: string, defaultValue: T): T;
  set(key: string, value: any): void;
}

/**
 * Create a fallback store using localStorage
 * Used when electron-store is not available (browser development)
 * @returns {Store} Store implementation
 */
const createMockStore = (): Store => ({
  get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
});

/**
 * Get the appropriate store implementation
 * Returns electron-store if available, otherwise returns localStorage fallback
 * @returns {Store} Store implementation
 */
export const createStore = (): Store => {
  // Check if window and electronStore are available
  if (typeof window !== 'undefined' && window.electronStore) {
    return window.electronStore;
  }

  // Return fallback for browser development
  return createMockStore();
};

/**
 * Global type augmentation for Window interface
 */
declare global {
  interface Window {
    electronStore?: Store;
    smartPilot?: any;
    electron?: any;
  }
}

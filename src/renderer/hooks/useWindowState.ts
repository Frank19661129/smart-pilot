/**
 * Window State Management Hook
 * Manages the 5 collapsible states of the Ghost Interface
 *
 * States:
 * - hidden: Window is completely hidden
 * - handle: Thin 8px handle on screen edge
 * - widget: Small 200x200 widget view
 * - app: Full application panel (400x800)
 * - fullscreen: Full screen mode
 *
 * Features:
 * - Persistent state storage via electron-store
 * - Smooth transitions with 300ms animation
 * - IPC communication with Electron main process
 */

import { useState, useEffect, useCallback } from 'react';
import { WindowState } from '../types';
import { createStore } from '../utils/store';

/** Window state progression order */
const WINDOW_STATE_ORDER: WindowState[] = ['hidden', 'handle', 'widget', 'app', 'fullscreen'];

/** Transition animation duration in milliseconds */
const TRANSITION_DURATION = 300;

/**
 * Return type for useWindowState hook
 */
interface UseWindowStateReturn {
  /** Current window state */
  currentState: WindowState;
  /** Expand to next state in order */
  expand: () => void;
  /** Collapse to previous state in order */
  collapse: () => void;
  /** Hide window completely */
  hide: () => void;
  /** Show window from hidden state */
  show: () => void;
  /** Toggle between fullscreen and app state */
  toggleFullscreen: () => void;
  /** Set specific window state */
  setState: (state: WindowState) => void;
  /** Whether window is currently transitioning */
  isTransitioning: boolean;
}

/**
 * Custom hook for managing Ghost Interface window states
 * @returns {UseWindowStateReturn} Window state management functions
 */
export const useWindowState = (): UseWindowStateReturn => {
  const store = createStore();
  const [currentState, setCurrentState] = useState<WindowState>(
    store.get('lastWindowState', 'handle') as WindowState
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Save state to persistent storage whenever it changes
  useEffect(() => {
    store.set('lastWindowState', currentState);
  }, [currentState, store]);

  /**
   * Transition to a new window state with animation
   * @param {WindowState} newState - Target window state
   */
  const transitionToState = useCallback((newState: WindowState): void => {
    setIsTransitioning(true);
    setCurrentState(newState);

    // Match CSS transition duration
    setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);

    // Notify Electron main process about window size change
    if (typeof window !== 'undefined' && window.electron?.setWindowState) {
      window.electron.setWindowState(newState);
    }
  }, []);

  /**
   * Expand to the next state in progression
   */
  const expand = useCallback((): void => {
    const currentIndex = WINDOW_STATE_ORDER.indexOf(currentState);
    if (currentIndex < WINDOW_STATE_ORDER.length - 1) {
      transitionToState(WINDOW_STATE_ORDER[currentIndex + 1]);
    }
  }, [currentState, transitionToState]);

  /**
   * Collapse to the previous state in progression
   */
  const collapse = useCallback((): void => {
    const currentIndex = WINDOW_STATE_ORDER.indexOf(currentState);
    if (currentIndex > 0) {
      transitionToState(WINDOW_STATE_ORDER[currentIndex - 1]);
    }
  }, [currentState, transitionToState]);

  /**
   * Hide the window completely
   */
  const hide = useCallback((): void => {
    transitionToState('hidden');
  }, [transitionToState]);

  /**
   * Show the window from hidden state
   */
  const show = useCallback((): void => {
    if (currentState === 'hidden') {
      transitionToState('handle');
    }
  }, [currentState, transitionToState]);

  /**
   * Toggle between fullscreen and app state
   */
  const toggleFullscreen = useCallback((): void => {
    if (currentState === 'fullscreen') {
      transitionToState('app');
    } else {
      transitionToState('fullscreen');
    }
  }, [currentState, transitionToState]);

  /**
   * Set a specific window state
   * @param {WindowState} state - Target window state
   */
  const setState = useCallback((state: WindowState): void => {
    transitionToState(state);
  }, [transitionToState]);

  return {
    currentState,
    expand,
    collapse,
    hide,
    show,
    toggleFullscreen,
    setState,
    isTransitioning,
  };
};

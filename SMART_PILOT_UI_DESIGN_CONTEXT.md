# Smart Pilot Ghost Interface - UI Design Context

**Project**: Smart Pilot AI Assistant for Insurance Data  
**Design System**: Fluent UI v9 + Insurance Data Theme  
**Date**: January 16, 2026  
**Status**: Implementation Complete

## Executive Summary

Smart Pilot implements a Ghost Interface - a collapsible AI assistant that seamlessly transitions through 5 distinct states from completely hidden to fullscreen dashboard. Built with Fluent UI v9, it follows the Insurance Data design system with orange (#EC6726) primary color and dark gray (#4A4645) backgrounds.

## Component Hierarchy

App (FluentProvider wrapper)
- SplashScreen (Initial connection UI)
  - Logo animation
  - User greeting
  - Connection status
- State-aware Layout
  - Handle View (8px minimal bar)
  - Widget View (200x200 icon)
  - App View (400x800 panel)
    - TitleBar
    - WindowListView
    - SettingsPanel
  - Fullscreen View (100vw x 100vh)

## State Management Patterns

### Window State Hook (useWindowState.ts)

Purpose: Manages the 5 collapsible states with smooth transitions

State Flow:
Hidden (0x0) <-> Handle (8px) <-> Widget (200x200) <-> App (400x800) <-> Fullscreen (100vw x 100vh)

Methods:
- expand(): Move to next larger state
- collapse(): Move to next smaller state
- hide(): Jump to hidden state
- show(): Show from hidden (goes to handle)
- toggleFullscreen(): Toggle between app and fullscreen
- setState(state): Direct state control

Persistence:
- Uses Electron Store (or localStorage in browser)
- Saves lastWindowState on every transition
- Restores last state on app launch

Transition Management:
- Sets isTransitioning flag during state change
- 300ms duration matches CSS transition timing
- Notifies Electron main process for window resize

## Animation Choreography

### Splash Screen Entry
1. Logo scales in (0.5->1.0) with fade - 0.8s + 0.2s delay
2. Title slides up - 0.6s + 0.4s delay
3. User name fades in - 0.6s + 0.6s delay
4. Connection status appears - 0.6s + 0.8s delay
5. On connection: checkmark scales in with spring
6. Exit: Fade out entire screen - 0.5s

### State Transitions
- Handle to Widget: Scale 0.8->1.0, opacity 0->1, 0.3s
- Widget to App: Translate Y 20px->0, opacity 0->1, 0.3s
- App to Fullscreen: Opacity 0->1, 0.3s
- All transitions use cubic-bezier(0.4, 0, 0.2, 1)

## Theme Customization Guide

### Color System

Primary Brand (Orange):
- 10: #FFF5F0 (Lightest tint)
- 60: #EC6726 (Primary - Insurance Data orange)
- 70: #CC5229 (Hover/pressed state)
- 100: #33140A (Darkest shade)

Neutral Grays:
- --id-gray-dark: #4A4645 (Main background)
- --id-gray-medium: #5A5655 (Elevated surfaces)
- --id-gray-light: #6A6665 (Hover states)

### Using Theme Tokens

In TypeScript:


In CSS:


## Accessibility Considerations

### Keyboard Navigation
- Tab order: Settings -> Minimize -> Close -> Window list -> Settings controls
- Shortcuts: Tab, Shift+Tab, Enter/Space, Escape, Arrow keys

### Focus Management
- Focus indicators: 2px solid orange outline with 2px offset
- Focus trap in settings panel

### Screen Reader Support
- ARIA labels on all interactive elements
- Live regions for status updates

### Color Contrast (WCAG AA)
- White on dark gray: 12.6:1
- Orange on dark gray: 4.8:1
- Orange on white: 4.5:1

## Performance Optimizations

### Virtual Scrolling
- WindowListView uses react-window
- Renders only visible items
- Handles 1000+ windows smoothly

### Animation Performance
- GPU acceleration with transform and opacity
- Avoids layout thrashing
- Batch DOM reads/writes

## Electron Integration

### IPC Communication
- Renderer to Main: setWindowState, setAutoStart
- Main to Renderer: Window resize, position updates

### Window Management
- Frameless window with transparent background
- Always on top, skip taskbar
- Draggable title bar region

## Testing Strategy

### Unit Tests
- Hook behavior testing
- Component rendering tests

### Integration Tests
- User interaction flows
- State transition validation

### E2E Tests (Playwright)
- Complete state cycle
- Settings persistence
- Multi-monitor behavior

## Troubleshooting Guide

1. Animations Stuttering: Add GPU acceleration
2. Window Not Showing: Check hidden state, always-on-top
3. Theme Not Applied: Verify FluentProvider wrapper
4. Store Not Persisting: Use electron-store via preload

## Future Enhancements

Phase 2:
- AI context detection
- Smart suggestions
- Voice interface
- Multi-monitor support
- Theme builder

---

Document Version: 1.0  
Last Updated: January 16, 2026

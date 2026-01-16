# Smart Pilot - Ghost Interface

AI Assistant for Insurance Data workflows with a modern, collapsible Ghost Interface.

## Features

- **5 Collapsible States**: Hidden → Handle → Widget → App → Fullscreen
- **Frameless Design**: Modern Windows 11 Acrylic/Mica effects
- **Fluent UI v9**: Microsoft's latest design system
- **Insurance Data Theme**: Official orange (#EC6726) and dark gray (#4A4645)
- **Smooth Animations**: 0.3s transitions with Framer Motion
- **Persistent Settings**: Electron Store for user preferences

## Architecture

### Window States

1. **Hidden** (0x0): Completely hidden from view
2. **Handle** (8x100vh): Minimal bar with orange glow on hover
3. **Widget** (200x200): Icon-only compact view
4. **App** (400x800): Full side panel with navigation
5. **Fullscreen** (100vw x 100vh): Dashboard layout

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Fluent UI v9
- **Animations**: Framer Motion
- **Desktop**: Electron 28
- **Build**: Vite
- **State**: React Hooks + Electron Store

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts:
- Vite dev server on http://localhost:5173
- Electron window with hot reload

### Building

```bash
npm run build
```

Outputs to `dist/` directory.

## Project Structure

```
id-smartpilot/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # App lifecycle, window management
│   │   └── preload.ts     # IPC bridge
│   └── renderer/          # React app
│       ├── components/    # UI components
│       │   ├── SplashScreen.tsx
│       │   ├── TitleBar.tsx
│       │   ├── SettingsPanel.tsx
│       │   └── WindowListView.tsx
│       ├── hooks/         # Custom hooks
│       │   └── useWindowState.ts
│       ├── styles/        # CSS and theme
│       │   ├── theme.ts
│       │   ├── ghost-interface.css
│       │   ├── animations.css
│       │   └── windows-effects.css
│       ├── types/         # TypeScript definitions
│       │   └── index.ts
│       ├── App.tsx        # Main app component
│       └── main.tsx       # React entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Theme Customization

The Insurance Data theme is defined in `src/renderer/styles/theme.ts`:

```typescript
const insuranceDataBrand = {
  60: '#EC6726',  // Primary orange
  // ... other shades
};
```

All theme tokens are exported from the theme file for consistent usage.

## State Management

Window state is managed by the `useWindowState` hook:

```typescript
const { currentState, expand, collapse, hide, show, toggleFullscreen } = useWindowState();
```

States are persisted to Electron Store automatically.

## Animations

All animations use Framer Motion with consistent timing:

- Fast: 0.2s
- Base: 0.3s
- Slow: 0.5s
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

## Accessibility

- Keyboard navigation supported
- Focus indicators with orange outline
- Screen reader friendly labels
- High contrast mode support

## License

Proprietary - Insurance Data

# Smart Pilot - Quick Start Guide

## Installation

```bash
cd id-smartpilot
npm install
```

## Development

```bash
npm run dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron window
3. Enable hot reload for instant updates

## Project Structure

```
id-smartpilot/
├── src/
│   ├── main/              # Electron process
│   │   ├── main.ts        # Window management
│   │   └── preload.ts     # IPC bridge
│   └── renderer/          # React UI
│       ├── components/    # UI components
│       ├── hooks/         # Custom hooks
│       ├── styles/        # CSS + theme
│       ├── types/         # TypeScript types
│       ├── App.tsx        # Main component
│       └── main.tsx       # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Components

### 1. Theme (src/renderer/styles/theme.ts)

Exports Insurance Data theme with Fluent UI v9:

```typescript
import { insuranceDataDarkTheme, themeTokens } from './styles/theme';

// Use in components
<div style={{ background: themeTokens.colors.orange }} />
```

### 2. Window State Hook (src/renderer/hooks/useWindowState.ts)

Manages 5 collapsible states:

```typescript
const { currentState, expand, collapse, hide, show } = useWindowState();

// States: 'hidden', 'handle', 'widget', 'app', 'fullscreen'
```

### 3. Main App (src/renderer/App.tsx)

State-aware layout that renders different UI per state:

- Hidden: Nothing
- Handle: 8px bar with glow
- Widget: 200x200 icon
- App: 400x800 panel
- Fullscreen: Dashboard

### 4. Components

- **SplashScreen**: Initial loading with animations
- **TitleBar**: Custom window controls
- **SettingsPanel**: User preferences
- **WindowListView**: Detected windows with virtual scrolling

## Customization

### Change Theme Colors

Edit `src/renderer/styles/theme.ts`:

```typescript
const insuranceDataBrand: BrandVariants = {
  60: '#EC6726',  // Change primary color here
  // ...
};
```

### Modify Window Dimensions

Edit `src/renderer/styles/theme.ts`:

```typescript
export const windowStateDimensions = {
  handle: { width: 8, height: '100vh' },    // Make wider
  widget: { width: 200, height: 200 },      // Make larger
  app: { width: 400, height: 800 },         // Adjust size
  // ...
};
```

### Add New Window State

1. Add to type definition in `src/renderer/types/index.ts`
2. Update `WINDOW_STATE_ORDER` in `useWindowState.ts`
3. Add case in `App.tsx` renderStateContent()
4. Update Electron main process window dimensions

## Common Tasks

### Add New Component

```typescript
// 1. Create file: src/renderer/components/MyComponent.tsx
import React from 'react';
import { themeTokens } from '../styles/theme';

const MyComponent: React.FC = () => {
  return <div>My Component</div>;
};

export default MyComponent;

// 2. Import in App.tsx
import MyComponent from './components/MyComponent';
```

### Add Persistent Setting

```typescript
// 1. Add to AppSettings type in types/index.ts
export interface AppSettings {
  myNewSetting: boolean;  // Add here
}

// 2. Use in component
const [settings, setSettings] = useState<AppSettings>(
  store.get('appSettings', { myNewSetting: false })
);

// 3. Save changes
useEffect(() => {
  store.set('appSettings', settings);
}, [settings]);
```

### Style with Fluent UI

```typescript
import { Button, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  customButton: {
    backgroundColor: '#EC6726',
    color: 'white',
    '&:hover': {
      backgroundColor: '#FF9966',
    },
  },
});

const MyComponent = () => {
  const styles = useStyles();
  return <Button className={styles.customButton}>Click</Button>;
};
```

## Building for Production

```bash
npm run build
```

Creates optimized bundle in `dist/` directory.

## Troubleshooting

**Window not showing:**
```typescript
// Check state
console.log(currentState);

// Force show
setState('handle');
```

**Theme not applied:**
```typescript
// Verify FluentProvider wrapper in App.tsx
<FluentProvider theme={insuranceDataDarkTheme}>
  {/* Your app */}
</FluentProvider>
```

**Animations not smooth:**
```css
/* Add GPU acceleration */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0);
}
```

## Resources

- **Fluent UI v9**: https://react.fluentui.dev/
- **Framer Motion**: https://www.framer.com/motion/
- **Electron**: https://www.electronjs.org/
- **Vite**: https://vitejs.dev/

## Getting Help

1. Check `SMART_PILOT_UI_DESIGN_CONTEXT.md` for detailed architecture
2. Review component source code with inline comments
3. Test in development mode with DevTools open

---

Happy coding!

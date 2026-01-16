# Windows Integration - Code Examples

Complete code examples for using Smart Pilot's Windows integration features.

---

## Table of Contents

1. [Basic Window Detection](#basic-window-detection)
2. [Browser Tab Detection](#browser-tab-detection)
3. [Session Context Detection](#session-context-detection)
4. [Real-Time Monitoring](#real-time-monitoring)
5. [Advanced Filtering](#advanced-filtering)
6. [Error Handling](#error-handling)
7. [React Integration](#react-integration)
8. [Complete Application Example](#complete-application-example)

---

## Basic Window Detection

### Example 1: Get All Windows

```typescript
async function listAllWindows() {
  const result = await window.windowsAPI.getAllWindows();

  console.log(`Total windows found: ${result.totalCount}`);

  // Display window information
  result.windows.forEach((win, index) => {
    console.log(`\n${index + 1}. ${win.title}`);
    console.log(`   Process: ${win.processName} (PID: ${win.processId})`);
    console.log(`   Class: ${win.className}`);

    if (win.bounds) {
      console.log(`   Position: ${win.bounds.x}, ${win.bounds.y}`);
      console.log(`   Size: ${win.bounds.width}x${win.bounds.height}`);
    }
  });

  // Check for errors
  if (result.errors.length > 0) {
    console.warn(`Errors encountered: ${result.errors.length}`);
    result.errors.forEach(err => {
      console.error(`  ${err.code}: ${err.message}`);
    });
  }
}
```

### Example 2: Get Active Window

```typescript
async function trackActiveWindow() {
  const activeWindow = await window.windowsAPI.getActiveWindow();

  if (activeWindow) {
    console.log('Currently active window:');
    console.log(`  Title: ${activeWindow.title}`);
    console.log(`  Process: ${activeWindow.processName}`);
    console.log(`  PID: ${activeWindow.processId}`);
  } else {
    console.log('No active window detected');
  }
}
```

---

## Browser Tab Detection

### Example 3: Detect All Browser Tabs

```typescript
async function detectBrowserTabs() {
  const result = await window.windowsAPI.getBrowserTabs();

  console.log(`Found ${result.tabs.length} browser tabs`);
  console.log(`From ${result.windows.length} browser windows`);

  // Group tabs by browser
  const tabsByBrowser = result.tabs.reduce((acc, tab) => {
    if (!acc[tab.browser]) acc[tab.browser] = [];
    acc[tab.browser].push(tab);
    return acc;
  }, {} as Record<string, typeof result.tabs>);

  // Display grouped results
  for (const [browser, tabs] of Object.entries(tabsByBrowser)) {
    console.log(`\n${browser.toUpperCase()} (${tabs.length} tabs):`);
    tabs.forEach((tab, i) => {
      const activeLabel = tab.isActive ? ' [ACTIVE]' : '';
      console.log(`  ${i + 1}. ${tab.title}${activeLabel}`);
      if (tab.url) {
        console.log(`     URL: ${tab.url}`);
      }
    });
  }
}
```

### Example 4: Monitor Active Browser Tab

```typescript
let lastActiveTab: string | null = null;

async function monitorActiveBrowserTab() {
  const result = await window.windowsAPI.getBrowserTabs();

  const activeTab = result.tabs.find(tab => tab.isActive);

  if (activeTab) {
    const currentTab = `${activeTab.browser}:${activeTab.title}`;

    if (currentTab !== lastActiveTab) {
      console.log('Active tab changed:');
      console.log(`  Browser: ${activeTab.browser}`);
      console.log(`  Title: ${activeTab.title}`);
      if (activeTab.url) {
        console.log(`  URL: ${activeTab.url}`);
      }
      lastActiveTab = currentTab;
    }
  }
}

// Poll every 2 seconds
setInterval(monitorActiveBrowserTab, 2000);
```

---

## Session Context Detection

### Example 5: Detect Virtual Environment

```typescript
async function detectVirtualEnvironment() {
  const context = await window.windowsAPI.getSessionContext();

  console.log('Session Information:');
  console.log(`  Type: ${context.type}`);
  console.log(`  Is Remote: ${context.isRemote ? 'Yes' : 'No'}`);
  console.log(`  Session ID: ${context.sessionId}`);

  if (context.isRemote) {
    console.log(`  Protocol: ${context.protocol || 'Unknown'}`);
    console.log(`  Client Name: ${context.clientName || 'Unknown'}`);
    console.log(`  Host Name: ${context.hostName || 'Unknown'}`);

    // Take action based on environment
    switch (context.type) {
      case 'avd':
        console.log('⚠️ Running in Azure Virtual Desktop');
        console.log('   Enabling AVD-specific optimizations...');
        // Enable AVD optimizations
        break;

      case 'citrix':
        console.log('⚠️ Running in Citrix Virtual Apps/Desktops');
        console.log('   Enabling Citrix-specific features...');
        // Enable Citrix features
        break;

      case 'terminal-server':
      case 'rdp':
        console.log('⚠️ Running in Remote Desktop session');
        console.log('   Adjusting performance settings...');
        // Adjust for RDP
        break;

      case 'physical':
        console.log('✓ Running on physical machine');
        break;
    }
  } else {
    console.log('✓ Running on physical Windows machine');
  }

  // Display metadata
  if (context.metadata) {
    console.log('\nSession Metadata:');
    for (const [key, value] of Object.entries(context.metadata)) {
      console.log(`  ${key}: ${value}`);
    }
  }
}
```

### Example 6: Quick Remote Check

```typescript
async function quickRemoteCheck() {
  const isRemote = await window.windowsAPI.isRemoteSession();

  if (isRemote) {
    console.log('⚠️ REMOTE SESSION DETECTED');
    // Show warning banner
    showWarningBanner('You are in a remote session');
  } else {
    console.log('✓ Local session');
  }
}
```

---

## Real-Time Monitoring

### Example 7: Continuous Window Monitoring

```typescript
class WindowMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private lastWindowCount = 0;
  private lastActiveWindow: string | null = null;

  start(intervalMs: number = 1000) {
    this.stop(); // Stop existing monitor

    this.intervalId = setInterval(async () => {
      await this.checkWindows();
    }, intervalMs);

    console.log(`Window monitoring started (interval: ${intervalMs}ms)`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Window monitoring stopped');
    }
  }

  private async checkWindows() {
    try {
      // Check total window count
      const result = await window.windowsAPI.getAllWindows();

      if (result.totalCount !== this.lastWindowCount) {
        console.log(`Window count changed: ${this.lastWindowCount} → ${result.totalCount}`);
        this.lastWindowCount = result.totalCount;
        this.onWindowCountChanged(result.totalCount);
      }

      // Check active window
      const activeWindow = await window.windowsAPI.getActiveWindow();
      const activeTitle = activeWindow ? `${activeWindow.processName}:${activeWindow.title}` : null;

      if (activeTitle !== this.lastActiveWindow) {
        console.log(`Active window changed: ${activeTitle}`);
        this.lastActiveWindow = activeTitle;
        this.onActiveWindowChanged(activeWindow);
      }

    } catch (error) {
      console.error('Monitor error:', error);
    }
  }

  // Override these methods
  protected onWindowCountChanged(count: number) {
    // Handle window count change
  }

  protected onActiveWindowChanged(window: any) {
    // Handle active window change
  }
}

// Usage
const monitor = new WindowMonitor();
monitor.start(500); // Check every 500ms

// Later...
monitor.stop();
```

### Example 8: Browser Activity Tracker

```typescript
interface BrowserActivity {
  browser: string;
  title: string;
  timestamp: number;
  duration: number;
}

class BrowserActivityTracker {
  private activities: BrowserActivity[] = [];
  private currentTab: string | null = null;
  private currentStartTime: number = 0;

  async track() {
    const result = await window.windowsAPI.getBrowserTabs();
    const activeTab = result.tabs.find(tab => tab.isActive);

    if (activeTab) {
      const tabKey = `${activeTab.browser}:${activeTab.title}`;

      // New tab detected
      if (tabKey !== this.currentTab) {
        // Save previous activity
        if (this.currentTab && this.currentStartTime > 0) {
          const duration = Date.now() - this.currentStartTime;
          const [browser, title] = this.currentTab.split(':');

          this.activities.push({
            browser,
            title,
            timestamp: this.currentStartTime,
            duration
          });

          console.log(`Activity logged: ${this.currentTab} (${duration}ms)`);
        }

        // Start tracking new tab
        this.currentTab = tabKey;
        this.currentStartTime = Date.now();
      }
    }
  }

  getActivities(): BrowserActivity[] {
    return [...this.activities];
  }

  getSummary() {
    const summary: Record<string, number> = {};

    for (const activity of this.activities) {
      const key = `${activity.browser}:${activity.title}`;
      summary[key] = (summary[key] || 0) + activity.duration;
    }

    return summary;
  }

  displaySummary() {
    const summary = this.getSummary();

    console.log('\nBrowser Activity Summary:');
    console.log('─'.repeat(60));

    const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1]);

    for (const [tab, duration] of sorted) {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      console.log(`${tab}: ${minutes}m ${seconds}s`);
    }
  }
}

// Usage
const tracker = new BrowserActivityTracker();

setInterval(() => {
  tracker.track();
}, 1000);

// Display summary every 5 minutes
setInterval(() => {
  tracker.displaySummary();
}, 300000);
```

---

## Advanced Filtering

### Example 9: Filter Microsoft Office Windows

```typescript
async function findOfficeDocuments() {
  const officeProcesses = [
    { name: 'WINWORD.EXE', app: 'Word' },
    { name: 'EXCEL.EXE', app: 'Excel' },
    { name: 'POWERPNT.EXE', app: 'PowerPoint' },
    { name: 'OUTLOOK.EXE', app: 'Outlook' }
  ];

  const documents = [];

  for (const { name, app } of officeProcesses) {
    const windows = await window.windowsAPI.getWindowsByProcess(name);

    for (const win of windows) {
      documents.push({
        application: app,
        title: win.title,
        processId: win.processId
      });
    }
  }

  console.log(`Found ${documents.length} Office documents:`);
  documents.forEach(doc => {
    console.log(`  [${doc.application}] ${doc.title}`);
  });

  return documents;
}
```

### Example 10: Filter by Window Class

```typescript
async function findDialogWindows() {
  // Find all dialog windows (typically have "Dialog" in class name)
  const dialogs = await window.windowsAPI.getWindowsByClassName('Dialog');

  console.log(`Found ${dialogs.length} dialog windows:`);
  dialogs.forEach(dialog => {
    console.log(`  ${dialog.title} (${dialog.processName})`);
  });

  return dialogs;
}
```

---

## Error Handling

### Example 11: Robust Error Handling

```typescript
async function safeWindowDetection() {
  try {
    const result = await window.windowsAPI.getAllWindows();

    // Check for partial success
    if (result.errors.length > 0) {
      console.warn(`Detected ${result.totalCount} windows with ${result.errors.length} errors`);

      // Log errors
      result.errors.forEach(error => {
        console.error(`Error ${error.code}: ${error.message}`);
        if (error.details) {
          console.error('Details:', error.details);
        }
      });
    }

    return result.windows;

  } catch (error) {
    console.error('Fatal error during window detection:', error);

    // Show user-friendly error message
    showErrorNotification('Failed to detect windows. Please try again.');

    // Return empty array as fallback
    return [];
  }
}
```

### Example 12: Retry Logic

```typescript
async function detectWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${i + 1} failed: ${error.message}`);

      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError!.message}`);
}

// Usage
const windows = await detectWithRetry(() => window.windowsAPI.getAllWindows());
```

---

## React Integration

### Example 13: React Hook for Windows

```typescript
import { useState, useEffect } from 'react';

function useWindows(refreshInterval: number = 5000) {
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchWindows = async () => {
      try {
        setLoading(true);
        const result = await window.windowsAPI.getAllWindows();

        if (mounted) {
          setWindows(result.windows);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchWindows();
    const interval = setInterval(fetchWindows, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);

  return { windows, loading, error };
}

// Usage in component
function WindowList() {
  const { windows, loading, error } = useWindows(3000);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Open Windows ({windows.length})</h2>
      <ul>
        {windows.map((win, i) => (
          <li key={i}>
            <strong>{win.title}</strong> - {win.processName}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 14: React Hook for Session Context

```typescript
import { useState, useEffect } from 'react';

function useSessionContext() {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchContext = async () => {
      try {
        const ctx = await window.windowsAPI.getSessionContext();
        if (mounted) {
          setContext(ctx);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to get session context:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchContext();

    return () => {
      mounted = false;
    };
  }, []);

  return { context, loading };
}

// Usage in component
function SessionBanner() {
  const { context, loading } = useSessionContext();

  if (loading) return null;

  if (context?.isRemote) {
    return (
      <div className="warning-banner">
        ⚠️ Running in {context.type.toUpperCase()} session
      </div>
    );
  }

  return null;
}
```

---

## Complete Application Example

### Example 15: Full Integration Demo

```typescript
import React, { useState, useEffect } from 'react';

interface AppState {
  windows: any[];
  browserTabs: any[];
  activeWindow: any | null;
  sessionContext: any | null;
  stats: {
    totalWindows: number;
    browserCount: number;
    tabCount: number;
  };
}

function SmartPilotDashboard() {
  const [state, setState] = useState<AppState>({
    windows: [],
    browserTabs: [],
    activeWindow: null,
    sessionContext: null,
    stats: {
      totalWindows: 0,
      browserCount: 0,
      tabCount: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch in parallel
      const [windowsResult, browsersResult, activeWin, sessionCtx] = await Promise.all([
        window.windowsAPI.getAllWindows(),
        window.windowsAPI.getBrowserTabs(),
        window.windowsAPI.getActiveWindow(),
        window.windowsAPI.getSessionContext()
      ]);

      setState({
        windows: windowsResult.windows,
        browserTabs: browsersResult.tabs,
        activeWindow: activeWin,
        sessionContext: sessionCtx,
        stats: {
          totalWindows: windowsResult.totalCount,
          browserCount: browsersResult.windows.length,
          tabCount: browsersResult.tabs.length
        }
      });

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className="dashboard">
      <header>
        <h1>Smart Pilot Dashboard</h1>
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      </header>

      {/* Session Banner */}
      {state.sessionContext?.isRemote && (
        <div className="session-banner warning">
          ⚠️ Running in {state.sessionContext.type.toUpperCase()} session
          {state.sessionContext.protocol && ` (${state.sessionContext.protocol})`}
        </div>
      )}

      {/* Statistics */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{state.stats.totalWindows}</div>
          <div className="stat-label">Total Windows</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{state.stats.browserCount}</div>
          <div className="stat-label">Browser Windows</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{state.stats.tabCount}</div>
          <div className="stat-label">Browser Tabs</div>
        </div>
      </div>

      {/* Active Window */}
      {state.activeWindow && (
        <div className="active-window">
          <h2>Active Window</h2>
          <div className="window-info">
            <strong>{state.activeWindow.title}</strong>
            <p>{state.activeWindow.processName} (PID: {state.activeWindow.processId})</p>
          </div>
        </div>
      )}

      {/* Browser Tabs */}
      <div className="browser-tabs">
        <h2>Browser Tabs ({state.browserTabs.length})</h2>
        <div className="tab-list">
          {state.browserTabs.map((tab, i) => (
            <div key={i} className={`tab-item ${tab.isActive ? 'active' : ''}`}>
              <span className="tab-browser">{tab.browser}</span>
              <span className="tab-title">{tab.title}</span>
              {tab.isActive && <span className="badge">ACTIVE</span>}
            </div>
          ))}
        </div>
      </div>

      {/* All Windows */}
      <div className="all-windows">
        <h2>All Windows ({state.windows.length})</h2>
        <div className="window-list">
          {state.windows.slice(0, 20).map((win, i) => (
            <div key={i} className="window-item">
              <div className="window-title">{win.title}</div>
              <div className="window-meta">
                {win.processName} • PID: {win.processId}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SmartPilotDashboard;
```

---

## Additional Tips

### Performance Optimization

```typescript
// Debounce rapid updates
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Usage
const debouncedFetch = debounce(fetchWindows, 500);
```

### Caching

```typescript
class WindowCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5000; // 5 seconds

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

**For more examples and documentation, see:**
- [SMART_PILOT_WINDOWS_INTEGRATION_CONTEXT.md](./SMART_PILOT_WINDOWS_INTEGRATION_CONTEXT.md)
- [README.md](./README.md)

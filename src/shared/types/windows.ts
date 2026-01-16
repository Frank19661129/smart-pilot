/**
 * Type definitions for Windows integration
 */

export interface WindowInfo {
  /** Window title text */
  title: string;
  /** Windows class name */
  className: string;
  /** Process name (e.g., "chrome.exe") */
  processName: string;
  /** Process ID */
  processId: number;
  /** Window handle (HWND) as number */
  windowHandle: number;
  /** Window icon as base64 string (optional) */
  icon?: string;
  /** Whether window is visible */
  isVisible: boolean;
  /** Window position and size */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface BrowserTab {
  /** Browser type */
  browser: 'chrome' | 'edge' | 'firefox' | 'brave' | 'opera' | 'unknown';
  /** Tab title */
  title: string;
  /** Tab URL (if accessible) */
  url?: string;
  /** Favicon URL or base64 (if accessible) */
  favicon?: string;
  /** Tab index within browser window */
  tabIndex?: number;
  /** Parent window process ID */
  processId: number;
  /** Whether tab is active/focused */
  isActive: boolean;
}

export type SessionType = 'physical' | 'avd' | 'citrix' | 'terminal-server' | 'rdp' | 'unknown';

export interface SessionContext {
  /** Type of session detected */
  type: SessionType;
  /** Windows session ID */
  sessionId: number;
  /** Remote host name (for remote sessions) */
  hostName?: string;
  /** Whether session is remote */
  isRemote: boolean;
  /** Client name (for remote sessions) */
  clientName?: string;
  /** Protocol being used */
  protocol?: 'RDP' | 'ICA' | 'PCoIP' | 'Unknown';
  /** Additional session metadata */
  metadata?: Record<string, unknown>;
}

export interface WindowDetectorError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Browser detection result
 */
export interface BrowserDetectionResult {
  windows: WindowInfo[];
  tabs: BrowserTab[];
  errors: WindowDetectorError[];
}

/**
 * All windows detection result
 */
export interface WindowsDetectionResult {
  windows: WindowInfo[];
  totalCount: number;
  errors: WindowDetectorError[];
}

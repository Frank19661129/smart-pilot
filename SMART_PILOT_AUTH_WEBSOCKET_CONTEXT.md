# Smart Pilot - Windows Authentication & WebSocket Context

## Overview

This document describes the Windows Integrated Authentication and WebSocket implementation for Smart Pilot, following IDDI backend patterns and security best practices.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Windows Integrated Authentication](#windows-integrated-authentication)
3. [WebSocket Communication](#websocket-communication)
4. [Security Considerations](#security-considerations)
5. [Token Management](#token-management)
6. [Error Recovery](#error-recovery)
7. [Usage Examples](#usage-examples)
8. [API Reference](#api-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDERER PROCESS                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Components                                           │ │
│  │  - Login UI                                                 │ │
│  │  - Connection Status                                        │ │
│  │  - Real-time Updates                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▲                                    │
│                              │ window.smartPilot API              │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Preload Script (contextBridge)                            │ │
│  │  - auth.login()                                             │ │
│  │  - auth.checkStatus()                                       │ │
│  │  - ws.connect()                                             │ │
│  │  - ws.sendMessage()                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ IPC (contextBridge)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          MAIN PROCESS                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  IPC Handlers                                               │ │
│  │  - auth-handlers.ts                                         │ │
│  │  - websocket-handlers.ts                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▲                                    │
│                              │                                    │
│  ┌──────────────────────┐   │   ┌──────────────────────┐        │
│  │  AuthService         │◄──┴──►│  WebSocketClient     │        │
│  │  - Token Management  │       │  - Auto-reconnect    │        │
│  │  - Auto-refresh      │       │  - Message Queue     │        │
│  │  - Session State     │       │  - Ping/Pong         │        │
│  └──────────┬───────────┘       └──────────┬───────────┘        │
│             │                               │                     │
│             ▼                               │                     │
│  ┌──────────────────────┐                  │                     │
│  │  WindowsAuthenticator│                  │                     │
│  │  - SSPI (node-sspi)  │                  │                     │
│  │  - Kerberos/NTLM     │                  │                     │
│  │  - AD/Entra ID       │                  │                     │
│  └──────────┬───────────┘                  │                     │
│             │                               │                     │
│             ▼                               │                     │
│  ┌──────────────────────┐                  │                     │
│  │  SecureStorage       │                  │                     │
│  │  - electron-store    │                  │                     │
│  │  - Encrypted tokens  │                  │                     │
│  └──────────────────────┘                  │                     │
└─────────────────────────────────────────────┼─────────────────────┘
                              │               │
                              ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        IDDI BACKEND                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  /api/v1/auth/windows - Windows Auth Exchange              │ │
│  │  /api/v1/auth/refresh - Token Refresh                      │ │
│  │  ws://backend/ws?token=xxx - WebSocket Endpoint            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Windows Integrated Authentication

### Flow Diagram

```
┌──────────┐                ┌──────────────┐               ┌──────────┐
│  Client  │                │ AuthService  │               │ Backend  │
└────┬─────┘                └──────┬───────┘               └────┬─────┘
     │                             │                            │
     │ 1. Login Request            │                            │
     ├─────────────────────────────►                            │
     │                             │                            │
     │                      2. Get Windows User                 │
     │                        (SSPI/node-sspi)                  │
     │                             │                            │
     │                      3. Generate SSPI Token              │
     │                        (Kerberos/NTLM)                   │
     │                             │                            │
     │                             │ 4. Exchange Token for JWT  │
     │                             ├────────────────────────────►
     │                             │                            │
     │                             │    5. JWT Token Response   │
     │                             │◄────────────────────────────
     │                             │                            │
     │                      6. Store Token Securely             │
     │                        (electron-store encrypted)        │
     │                             │                            │
     │                      7. Schedule Auto-refresh            │
     │                        (30min - 5min = 25min)            │
     │                             │                            │
     │   8. Login Success          │                            │
     │◄─────────────────────────────                            │
     │                             │                            │
     │                      ... Time Passes ...                 │
     │                             │                            │
     │                      9. Auto-refresh Token               │
     │                             ├────────────────────────────►
     │                             │                            │
     │                             │   10. New JWT Token        │
     │                             │◄────────────────────────────
     │                             │                            │
     │  11. Auth State Changed     │                            │
     │◄─────────────────────────────                            │
     │                             │                            │
```

### Authentication Provider Detection

The system automatically detects the Windows authentication provider:

1. **Entra ID (Azure AD)**: Username format `user@domain.com` (UPN)
2. **Active Directory**: Username format `DOMAIN\username`
3. **Local User**: Plain username without domain

### SSPI Token Generation

```typescript
// Uses node-sspi to generate Kerberos or NTLM tokens
const sspiClient = new sspi.Client('Negotiate');
const securityToken = sspiClient.getSecurityToken(clientContextHandle);
const base64Token = Buffer.from(securityToken).toString('base64');
```

### Backend Token Exchange

```http
POST /api/v1/auth/windows HTTP/1.1
Host: backend.iddi.com
Content-Type: application/json
Authorization: Negotiate <base64-sspi-token>

{
  "grant_type": "windows_auth",
  "windows_token": "<base64-sspi-token>",
  "username": "DOMAIN\\user",
  "upn": "user@domain.com",
  "domain": "DOMAIN"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 1800,
  "scope": "read write admin"
}
```

---

## WebSocket Communication

### Connection Flow

```
┌──────────┐              ┌──────────────┐              ┌──────────┐
│  Client  │              │  WSClient    │              │ Backend  │
└────┬─────┘              └──────┬───────┘              └────┬─────┘
     │                           │                           │
     │ 1. Connect Request        │                           │
     ├───────────────────────────►                           │
     │                           │                           │
     │                    2. Get Access Token                │
     │                      (from AuthService)               │
     │                           │                           │
     │                           │ 3. WebSocket Handshake    │
     │                           │   ws://backend/ws?token=xxx
     │                           ├───────────────────────────►
     │                           │                           │
     │                           │    4. Connection Success  │
     │                           │◄───────────────────────────
     │                           │                           │
     │                    5. Start Ping Interval             │
     │                      (every 30 seconds)               │
     │                           │                           │
     │ 6. Connected Event        │                           │
     │◄───────────────────────────                           │
     │                           │                           │
     │                    ... Active Connection ...          │
     │                           │                           │
     │                           │ 7. Ping                   │
     │                           ├───────────────────────────►
     │                           │                           │
     │                           │    8. Pong                │
     │                           │◄───────────────────────────
     │                           │                           │
     │                    ... Connection Lost ...            │
     │                           │                           │
     │                    9. Auto-reconnect                  │
     │                      (exponential backoff)            │
     │                           │                           │
     │                           │ 10. Reconnect Attempt     │
     │                           ├───────────────────────────►
     │                           │                           │
     │                           │    11. Connection Success │
     │                           │◄───────────────────────────
     │                           │                           │
     │ 12. Reconnected Event     │                           │
     │◄───────────────────────────                           │
     │                           │                           │
     │                    13. Process Queued Messages        │
     │                           │                           │
```

### Message Protocol

All WebSocket messages follow this structure:

```typescript
interface WebSocketMessage<T = any> {
  type: MessageType;           // Message type identifier
  payload: T;                  // Message payload
  messageId?: string;          // Unique message ID
  timestamp: number;           // Unix timestamp
  correlationId?: string;      // For request-response pattern
}
```

### Message Types

#### Server → Client

1. **progress_update**: Operation progress notifications
   ```json
   {
     "type": "progress_update",
     "payload": {
       "operationId": "op-123",
       "progress": 75,
       "step": "Processing document 3 of 4",
       "totalSteps": 4,
       "currentStep": 3,
       "estimatedTimeRemaining": 30
     },
     "timestamp": 1705429200000
   }
   ```

2. **task_assigned**: New task assignment
   ```json
   {
     "type": "task_assigned",
     "payload": {
       "taskId": "task-456",
       "taskType": "document_review",
       "description": "Review insurance claim document",
       "priority": "high",
       "dueDate": 1705515600000,
       "data": { "documentId": "doc-789" }
     },
     "timestamp": 1705429200000
   }
   ```

3. **notification**: User notification
   ```json
   {
     "type": "notification",
     "payload": {
       "notificationId": "notif-123",
       "title": "Document Processed",
       "message": "Your document has been successfully processed",
       "level": "success",
       "timeout": 5000
     },
     "timestamp": 1705429200000
   }
   ```

#### Client → Server

1. **ping**: Keep-alive heartbeat
   ```json
   {
     "type": "ping",
     "payload": { "timestamp": 1705429200000 },
     "timestamp": 1705429200000
   }
   ```

2. **cancel_operation**: Cancel running operation
   ```json
   {
     "type": "cancel_operation",
     "payload": {
       "operationId": "op-123",
       "reason": "User cancelled"
     },
     "timestamp": 1705429200000
   }
   ```

3. **custom_payload**: Application-specific data
   ```json
   {
     "type": "custom_payload",
     "payload": {
       "action": "submit_form",
       "data": { "formId": "form-123", "values": {} }
     },
     "timestamp": 1705429200000
   }
   ```

### Reconnection Strategy

Exponential backoff with configurable parameters:

```typescript
const reconnectDelay = Math.min(
  reconnectInterval * Math.pow(reconnectDecay, attemptNumber - 1),
  maxReconnectInterval
);
```

**Default Configuration:**
- Initial delay: 1 second
- Max delay: 30 seconds
- Decay factor: 1.5
- Max attempts: infinite (0)

**Example sequence:**
- Attempt 1: 1s
- Attempt 2: 1.5s
- Attempt 3: 2.25s
- Attempt 4: 3.375s
- Attempt 5: 5.06s
- ...
- Attempt 10+: 30s (capped)

---

## Security Considerations

### 1. Token Storage

- **Encryption**: Tokens stored using `electron-store` with encryption
- **Key Management**: Encryption key should be generated per-machine
- **Location**: Stored in user's AppData directory with restricted permissions

```typescript
const store = new Store({
  name: 'auth-tokens',
  encryptionKey: 'smart-pilot-auth-encryption-key', // TODO: Generate per-machine
});
```

**Recommended**: Generate encryption key from machine-specific data:
```typescript
const machineId = require('os').hostname() + process.platform + app.getVersion();
const encryptionKey = crypto.createHash('sha256').update(machineId).digest('hex');
```

### 2. Token Transmission

- **HTTPS**: All authentication endpoints must use HTTPS
- **WSS**: WebSocket connections should use WSS (secure WebSocket)
- **Token in URL**: WebSocket tokens passed via query parameter (acceptable for temporary tokens)
- **Header Alternative**: Consider using `Sec-WebSocket-Protocol` for token transmission

### 3. Context Isolation

- **contextBridge**: All IPC communication goes through secure `contextBridge`
- **No Node Integration**: `nodeIntegration: false` in BrowserWindow
- **Preload Script**: Only whitelisted APIs exposed to renderer

### 4. SSPI Security

- **Kerberos Preferred**: Use Kerberos over NTLM when available
- **Fallback**: NTLM as fallback for compatibility
- **No Password Storage**: Windows credentials never stored or transmitted directly

### 5. Corporate Network Support

#### Proxy Configuration

```typescript
// Detect system proxy settings
app.on('ready', () => {
  const session = require('electron').session;
  session.defaultSession.setProxy({
    proxyRules: 'http://proxy.company.com:8080',
    proxyBypassRules: 'localhost,127.0.0.1',
  });
});
```

#### Firewall Considerations

- **WebSocket Port**: Ensure port 443 (WSS) or 8000 (WS) is open
- **Authentication Endpoints**: HTTPS port 443
- **Kerberos**: Port 88 for domain controllers
- **NTLM**: SMB ports (445, 139) for domain authentication

---

## Token Management

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     TOKEN LIFECYCLE                          │
└─────────────────────────────────────────────────────────────┘

  Issue Time              Refresh Time           Expiry Time
      │                       │                       │
      ▼                       ▼                       ▼
  ────┼───────────────────────┼───────────────────────┼────► Time
      │◄──────25 minutes─────►│◄────5 minutes────────►│
      │                       │                       │
   Token                Auto-refresh              Token
  Issued                 Triggered               Expires
 (t = 0)                (t = 25m)               (t = 30m)
```

### Token Refresh Strategy

1. **Automatic Refresh**: Enabled by default
2. **Refresh Timing**: 5 minutes before expiry (configurable)
3. **Refresh Method**: Uses refresh token to obtain new access token
4. **Failure Handling**: Automatic logout on refresh failure
5. **User Notification**: Optional notification on refresh

### Configuration

```typescript
const authConfig: AuthConfig = {
  backendUrl: 'https://backend.iddi.com',
  authEndpoint: '/api/v1/auth/windows',
  refreshEndpoint: '/api/v1/auth/refresh',
  autoRefresh: true,              // Enable automatic refresh
  refreshBeforeExpiry: 300,       // Refresh 5 minutes before expiry
  maxRetries: 3,                  // Retry failed auth attempts
  timeout: 10000,                 // 10 second timeout
  enableKerberos: true,           // Enable Kerberos auth
  enableNTLM: true,               // Enable NTLM fallback
};
```

### Token Refresh Implementation

```typescript
async refreshToken(): Promise<TokenRefreshResult> {
  const response = await axios.post(
    `${config.backendUrl}/api/v1/auth/refresh`,
    {
      grant_type: 'refresh_token',
      refresh_token: currentTokens.refreshToken,
    }
  );

  const newTokens = {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
    issuedAt: Date.now(),
    expiresAt: Date.now() + response.data.expires_in * 1000,
  };

  await storage.setTokens(newTokens);
  scheduleNextRefresh();

  return { success: true, tokens: newTokens };
}
```

---

## Error Recovery

### Error Categories

1. **Network Errors**: Connection failures, timeouts
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **WebSocket Errors**: Connection lost, pong timeout
4. **Server Errors**: Backend unavailable, internal errors

### Recovery Strategies

#### 1. Network Errors

```typescript
// Exponential backoff with retry
let retryCount = 0;
while (retryCount < maxRetries) {
  try {
    return await performOperation();
  } catch (error) {
    retryCount++;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    await sleep(delay);
  }
}
```

#### 2. Authentication Errors

```typescript
// Token expired → Auto-refresh
if (error.code === 401 && hasRefreshToken) {
  const result = await refreshToken();
  if (result.success) {
    return retryOperation();
  } else {
    await logout();
    notifyUser('Session expired, please login again');
  }
}
```

#### 3. WebSocket Errors

```typescript
// Connection lost → Auto-reconnect
wsClient.on('close', () => {
  if (autoReconnect) {
    scheduleReconnect();
  }
});

// Pong timeout → Reconnect
if (noPongReceived && timeoutExceeded) {
  ws.close();
  scheduleReconnect();
}
```

#### 4. Server Errors

```typescript
// Backend unavailable → Queue messages
if (ws.readyState !== WebSocket.OPEN) {
  messageQueue.push(message);
  return;
}

// Process queue on reconnect
ws.on('open', () => {
  processMessageQueue();
});
```

### Error Codes

```typescript
enum AuthErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  WINDOWS_AUTH_FAILED = 'WINDOWS_AUTH_FAILED',
  BACKEND_UNAVAILABLE = 'BACKEND_UNAVAILABLE',
  KERBEROS_ERROR = 'KERBEROS_ERROR',
  NTLM_ERROR = 'NTLM_ERROR',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
}

enum WebSocketErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  MAX_RECONNECT_ATTEMPTS = 'MAX_RECONNECT_ATTEMPTS',
  PONG_TIMEOUT = 'PONG_TIMEOUT',
}
```

---

## Usage Examples

### 1. Basic Authentication

```typescript
// Renderer Process (React Component)
import { useEffect, useState } from 'react';

function LoginComponent() {
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    // Check existing session
    checkAuthStatus();

    // Listen for auth state changes
    const unsubscribe = window.smartPilot.auth.onAuthStateChanged((event) => {
      console.log('Auth state changed:', event);
      checkAuthStatus();
    });

    return unsubscribe;
  }, []);

  const checkAuthStatus = async () => {
    const status = await window.smartPilot.auth.checkStatus();
    setAuthStatus(status);
  };

  const handleLogin = async () => {
    const result = await window.smartPilot.auth.login();
    if (result.success) {
      console.log('Login successful:', result.user);
    } else {
      console.error('Login failed:', result.error);
    }
  };

  const handleLogout = async () => {
    await window.smartPilot.auth.logout();
  };

  return (
    <div>
      {authStatus?.isAuthenticated ? (
        <div>
          <p>Welcome, {authStatus.user?.displayName}!</p>
          <p>Token expires in: {authStatus.tokenExpiresIn}s</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login with Windows</button>
      )}
    </div>
  );
}
```

### 2. WebSocket Connection

```typescript
// Renderer Process
function WebSocketComponent() {
  useEffect(() => {
    // Connect WebSocket
    connectWebSocket();

    // Setup event listeners
    const unsubscribeConnected = window.smartPilot.ws.onConnected((state) => {
      console.log('WebSocket connected:', state);
    });

    const unsubscribeDisconnected = window.smartPilot.ws.onDisconnected((state) => {
      console.log('WebSocket disconnected:', state);
    });

    const unsubscribeMessage = window.smartPilot.ws.onMessage((message) => {
      console.log('WebSocket message:', message);
    });

    const unsubscribeProgress = window.smartPilot.ws.onProgressUpdate((payload) => {
      console.log('Progress update:', payload.progress, '%');
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeMessage();
      unsubscribeProgress();
      window.smartPilot.ws.disconnect();
    };
  }, []);

  const connectWebSocket = async () => {
    const result = await window.smartPilot.ws.connect({
      url: 'wss://backend.iddi.com/ws',
      autoReconnect: true,
    });

    if (!result.success) {
      console.error('WebSocket connection failed:', result.error);
    }
  };

  const sendMessage = async () => {
    await window.smartPilot.ws.sendMessage('custom_payload', {
      action: 'get_documents',
      filters: { status: 'pending' },
    });
  };

  return (
    <div>
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
}
```

### 3. Complete Integration

```typescript
// Renderer Process - Complete Flow
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check authentication status
    const authStatus = await window.smartPilot.auth.checkStatus();
    setIsAuthenticated(authStatus.isAuthenticated);

    if (authStatus.isAuthenticated) {
      // Auto-connect WebSocket if authenticated
      const wsResult = await window.smartPilot.ws.connect();
      setWsConnected(wsResult.success);
    }

    // Listen for auth changes
    window.smartPilot.auth.onAuthStateChanged(async (event) => {
      if (event.newState === 'authenticated') {
        setIsAuthenticated(true);
        // Connect WebSocket on login
        const wsResult = await window.smartPilot.ws.connect();
        setWsConnected(wsResult.success);
      } else {
        setIsAuthenticated(false);
        // Disconnect WebSocket on logout
        await window.smartPilot.ws.disconnect();
        setWsConnected(false);
      }
    });

    // Listen for WebSocket events
    window.smartPilot.ws.onConnected(() => setWsConnected(true));
    window.smartPilot.ws.onDisconnected(() => setWsConnected(false));
  };

  return (
    <div>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

---

## API Reference

### Authentication API

#### `window.smartPilot.auth.login()`

Perform Windows integrated authentication.

**Returns:** `Promise<{ success: boolean; user?: WindowsUser; error?: string }>`

#### `window.smartPilot.auth.logout()`

Logout and clear session.

**Returns:** `Promise<void>`

#### `window.smartPilot.auth.checkStatus()`

Check current authentication status.

**Returns:** `Promise<SessionInfo>`

#### `window.smartPilot.auth.refreshToken()`

Manually refresh access token.

**Returns:** `Promise<{ success: boolean; error?: string }>`

#### `window.smartPilot.auth.getAccessToken()`

Get current access token.

**Returns:** `Promise<string | null>`

#### `window.smartPilot.auth.getCurrentUser()`

Get current authenticated user.

**Returns:** `Promise<WindowsUser | null>`

#### `window.smartPilot.auth.onAuthStateChanged(callback)`

Listen for authentication state changes.

**Parameters:**
- `callback`: `(event: AuthStateChange) => void`

**Returns:** `() => void` (unsubscribe function)

### WebSocket API

#### `window.smartPilot.ws.connect(config?)`

Connect to WebSocket server.

**Parameters:**
- `config`: `Partial<WebSocketConfig>` (optional)

**Returns:** `Promise<{ success: boolean; error?: string }>`

#### `window.smartPilot.ws.disconnect()`

Disconnect from WebSocket server.

**Returns:** `Promise<void>`

#### `window.smartPilot.ws.sendMessage(type, payload, correlationId?)`

Send message through WebSocket.

**Parameters:**
- `type`: `MessageType`
- `payload`: `any`
- `correlationId`: `string` (optional)

**Returns:** `Promise<{ success: boolean; error?: string }>`

#### `window.smartPilot.ws.cancelOperation(operationId, reason?)`

Cancel a running operation.

**Parameters:**
- `operationId`: `string`
- `reason`: `string` (optional)

**Returns:** `Promise<{ success: boolean; error?: string }>`

#### `window.smartPilot.ws.getState()`

Get WebSocket connection state.

**Returns:** `Promise<WebSocketConnectionState | null>`

#### `window.smartPilot.ws.getStats()`

Get WebSocket statistics.

**Returns:** `Promise<WebSocketStats | null>`

#### Event Listeners

- `window.smartPilot.ws.onConnected(callback)`
- `window.smartPilot.ws.onDisconnected(callback)`
- `window.smartPilot.ws.onReconnecting(callback)`
- `window.smartPilot.ws.onError(callback)`
- `window.smartPilot.ws.onMessage(callback)`
- `window.smartPilot.ws.onProgressUpdate(callback)`
- `window.smartPilot.ws.onTaskAssigned(callback)`
- `window.smartPilot.ws.onNotification(callback)`

All return an unsubscribe function: `() => void`

---

## Configuration

### Environment Variables

```env
# Backend Configuration
BACKEND_URL=https://backend.iddi.com
WS_URL=wss://backend.iddi.com/ws

# Authentication
AUTH_ENDPOINT=/api/v1/auth/windows
REFRESH_ENDPOINT=/api/v1/auth/refresh
TOKEN_EXPIRY=1800

# WebSocket
WS_PING_INTERVAL=30000
WS_PONG_TIMEOUT=5000
WS_RECONNECT_INTERVAL=1000
WS_MAX_RECONNECT_INTERVAL=30000

# Development
NODE_ENV=development
```

### Default Configuration

```typescript
// Authentication
const defaultAuthConfig = {
  backendUrl: 'http://localhost:8000',
  authEndpoint: '/api/v1/auth/windows',
  refreshEndpoint: '/api/v1/auth/refresh',
  autoRefresh: true,
  refreshBeforeExpiry: 300,
  maxRetries: 3,
  timeout: 10000,
  enableKerberos: true,
  enableNTLM: true,
};

// WebSocket
const defaultWsConfig = {
  url: 'ws://localhost:8000/ws',
  autoReconnect: true,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectDecay: 1.5,
  maxReconnectAttempts: 0,
  pingInterval: 30000,
  pongTimeout: 5000,
  connectionTimeout: 10000,
};
```

---

## Testing

### Authentication Testing

```typescript
// Test Windows authentication
const authService = AuthService.getInstance();
const result = await authService.testAuthentication();

console.log('Can authenticate:', result.canAuthenticate);
console.log('Kerberos available:', result.kerberosAvailable);
console.log('NTLM available:', result.ntlmAvailable);
console.log('Current user:', result.currentUser);
```

### WebSocket Testing

```typescript
// Test WebSocket connection
const wsClient = new WebSocketClient({ url: 'ws://localhost:8000/ws' });

wsClient.on('connected', () => console.log('Connected'));
wsClient.on('error', (error) => console.error('Error:', error));

await wsClient.connect('test-token');
```

---

## Troubleshooting

### Common Issues

#### 1. "Windows authentication failed"

**Causes:**
- User not logged into Windows domain
- SSPI not available
- Kerberos/NTLM not configured

**Solutions:**
- Verify user is logged into domain
- Check `node-sspi` installation
- Enable NTLM fallback

#### 2. "WebSocket connection failed"

**Causes:**
- Backend not running
- Invalid authentication token
- Corporate firewall blocking WebSocket

**Solutions:**
- Verify backend URL
- Check authentication status
- Configure proxy settings
- Use WSS instead of WS

#### 3. "Token refresh failed"

**Causes:**
- Refresh token expired
- Backend unavailable
- Network issues

**Solutions:**
- Re-authenticate user
- Check backend health
- Verify network connectivity

---

## Future Enhancements

1. **Certificate-based Authentication**: Support for client certificates
2. **Multi-factor Authentication**: OTP integration
3. **Offline Mode**: Queue operations when offline
4. **Token Rotation**: Automatic token rotation for enhanced security
5. **Session Recording**: Audit log for authentication events
6. **Biometric Authentication**: Windows Hello integration

---

## References

- [IDDI Backend API Documentation](https://backend.iddi.com/docs)
- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
- [node-sspi Documentation](https://github.com/jlguenego/node-sspi)
- [WebSocket Protocol RFC 6455](https://tools.ietf.org/html/rfc6455)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-16
**Author:** Smart Pilot Team

# Smart Pilot - Authentication & WebSocket Quick Start

## Overview

This implementation provides Windows Integrated Authentication and WebSocket real-time communication for Smart Pilot, following IDDI backend patterns.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Key packages:**
- `node-sspi`: Windows SSPI authentication (Kerberos/NTLM)
- `ws`: WebSocket client
- `electron-store`: Secure token storage with encryption
- `axios`: HTTP client for API requests
- `electron-log`: Logging

### 2. Configure Backend

Set your IDDI backend URL in environment variables or configuration:

```env
BACKEND_URL=https://backend.iddi.com
WS_URL=wss://backend.iddi.com/ws
```

### 3. Run the Application

```bash
npm run dev
```

## Architecture

```
src/
├── main/                          # Main process (Node.js)
│   ├── auth/
│   │   ├── windows-auth.ts       # Windows authentication (SSPI)
│   │   └── auth-service.ts       # Auth service singleton
│   ├── websocket/
│   │   └── ws-client.ts          # WebSocket client
│   ├── ipc/
│   │   ├── auth-handlers.ts      # Auth IPC handlers
│   │   └── websocket-handlers.ts # WebSocket IPC handlers
│   └── main.ts                   # Main entry point
├── preload/
│   └── preload.ts                # Secure IPC bridge
└── shared/
    └── types/
        ├── auth.ts               # Auth type definitions
        └── websocket.ts          # WebSocket type definitions
```

## Usage Examples

### Authentication

```typescript
// Login with Windows credentials
const result = await window.smartPilot.auth.login();
if (result.success) {
  console.log('Logged in as:', result.user.username);
}

// Check authentication status
const status = await window.smartPilot.auth.checkStatus();
console.log('Authenticated:', status.isAuthenticated);

// Listen for auth state changes
window.smartPilot.auth.onAuthStateChanged((event) => {
  console.log('Auth state:', event.newState);
});

// Logout
await window.smartPilot.auth.logout();
```

### WebSocket

```typescript
// Connect to WebSocket
await window.smartPilot.ws.connect({
  url: 'wss://backend.iddi.com/ws',
  autoReconnect: true,
});

// Send message
await window.smartPilot.ws.sendMessage('custom_payload', {
  action: 'get_documents',
  filters: { status: 'pending' },
});

// Listen for messages
window.smartPilot.ws.onMessage((message) => {
  console.log('Received:', message);
});

// Listen for specific events
window.smartPilot.ws.onProgressUpdate((payload) => {
  console.log('Progress:', payload.progress + '%');
});

window.smartPilot.ws.onTaskAssigned((payload) => {
  console.log('New task:', payload.description);
});

window.smartPilot.ws.onNotification((payload) => {
  console.log('Notification:', payload.title);
});
```

### Complete React Integration

```typescript
function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Check auth status
    window.smartPilot.auth.checkStatus().then((status) => {
      setIsAuth(status.isAuthenticated);
      if (status.isAuthenticated) {
        // Auto-connect WebSocket
        window.smartPilot.ws.connect();
      }
    });

    // Listen for auth changes
    const unsubAuth = window.smartPilot.auth.onAuthStateChanged((event) => {
      if (event.newState === 'authenticated') {
        setIsAuth(true);
        window.smartPilot.ws.connect();
      } else {
        setIsAuth(false);
        setWsConnected(false);
      }
    });

    // Listen for WebSocket connection
    const unsubWs = window.smartPilot.ws.onConnected(() => {
      setWsConnected(true);
    });

    return () => {
      unsubAuth();
      unsubWs();
    };
  }, []);

  return (
    <div>
      <p>Auth: {isAuth ? 'Yes' : 'No'}</p>
      <p>WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

## Key Features

### Windows Integrated Authentication

- **SSPI Support**: Uses node-sspi for Kerberos/NTLM authentication
- **Entra ID**: Supports Azure AD (user@domain.com format)
- **Active Directory**: Supports classic AD (DOMAIN\username format)
- **Automatic Token Refresh**: Tokens refreshed 5 minutes before expiry
- **Secure Storage**: Tokens encrypted with electron-store
- **No Password Storage**: Windows credentials never stored or transmitted

### WebSocket Client

- **Auto-Reconnect**: Exponential backoff reconnection strategy
- **Keep-Alive**: Ping/pong heartbeat every 30 seconds
- **Message Queue**: Messages queued during disconnection
- **Event Emission**: Events forwarded to renderer via IPC
- **Statistics**: Track messages, bytes, latency, uptime
- **Error Recovery**: Automatic recovery from network issues

### Security

- **Context Isolation**: Full Electron context isolation
- **No Node Integration**: Renderer process isolated from Node.js
- **Secure IPC**: All communication through contextBridge
- **Token Encryption**: Secure token storage with encryption
- **Corporate Network**: Proxy and firewall support

## Connection Flow

```
1. User opens Smart Pilot
2. Main process initializes AuthService
3. AuthService checks for stored tokens
4. If valid tokens exist:
   - Restore session
   - Auto-connect WebSocket
5. If no valid tokens:
   - Show login UI
   - User clicks "Login with Windows"
   - Windows credentials exchanged for JWT
   - Token stored securely
   - WebSocket connects with token
6. Token auto-refresh every 25 minutes (30min expiry - 5min buffer)
7. WebSocket sends ping every 30 seconds
8. On disconnection: auto-reconnect with exponential backoff
```

## API Reference

### Authentication API

| Method | Description | Returns |
|--------|-------------|---------|
| `auth.login()` | Perform Windows authentication | `Promise<AuthResult>` |
| `auth.logout()` | Logout and clear session | `Promise<void>` |
| `auth.checkStatus()` | Get authentication status | `Promise<SessionInfo>` |
| `auth.refreshToken()` | Manually refresh token | `Promise<TokenRefreshResult>` |
| `auth.getAccessToken()` | Get current access token | `Promise<string \| null>` |
| `auth.getCurrentUser()` | Get current user | `Promise<WindowsUser \| null>` |
| `auth.onAuthStateChanged(cb)` | Listen for state changes | `() => void` (unsubscribe) |

### WebSocket API

| Method | Description | Returns |
|--------|-------------|---------|
| `ws.connect(config?)` | Connect to WebSocket | `Promise<{success, error?}>` |
| `ws.disconnect()` | Disconnect WebSocket | `Promise<void>` |
| `ws.sendMessage(type, payload, correlationId?)` | Send message | `Promise<{success, error?}>` |
| `ws.cancelOperation(operationId, reason?)` | Cancel operation | `Promise<{success, error?}>` |
| `ws.getState()` | Get connection state | `Promise<WebSocketConnectionState>` |
| `ws.getStats()` | Get statistics | `Promise<WebSocketStats>` |
| `ws.onConnected(cb)` | Listen for connection | `() => void` (unsubscribe) |
| `ws.onDisconnected(cb)` | Listen for disconnection | `() => void` (unsubscribe) |
| `ws.onMessage(cb)` | Listen for messages | `() => void` (unsubscribe) |
| `ws.onProgressUpdate(cb)` | Listen for progress updates | `() => void` (unsubscribe) |
| `ws.onTaskAssigned(cb)` | Listen for task assignments | `() => void` (unsubscribe) |
| `ws.onNotification(cb)` | Listen for notifications | `() => void` (unsubscribe) |

## Configuration

Default configuration can be customized:

```typescript
// Authentication config
const authConfig = {
  backendUrl: 'http://localhost:8000',
  authEndpoint: '/api/v1/auth/windows',
  refreshEndpoint: '/api/v1/auth/refresh',
  autoRefresh: true,
  refreshBeforeExpiry: 300,  // 5 minutes
  maxRetries: 3,
  timeout: 10000,
  enableKerberos: true,
  enableNTLM: true,
};

// WebSocket config
const wsConfig = {
  url: 'ws://localhost:8000/ws',
  autoReconnect: true,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectDecay: 1.5,
  maxReconnectAttempts: 0,  // infinite
  pingInterval: 30000,
  pongTimeout: 5000,
  connectionTimeout: 10000,
};
```

## Troubleshooting

### Windows Authentication Failed

**Problem:** `WINDOWS_AUTH_FAILED` error

**Solutions:**
1. Verify user is logged into Windows domain
2. Check `node-sspi` installation: `npm rebuild node-sspi`
3. Enable NTLM fallback in configuration
4. Check domain connectivity

### WebSocket Connection Failed

**Problem:** `CONNECTION_FAILED` error

**Solutions:**
1. Verify backend URL is correct
2. Check user is authenticated first
3. Configure proxy settings if behind corporate firewall
4. Use WSS (secure WebSocket) instead of WS

### Token Refresh Failed

**Problem:** `TOKEN_REFRESH_FAILED` error

**Solutions:**
1. Re-authenticate user (refresh token may be expired)
2. Check backend health
3. Verify network connectivity
4. Check backend /auth/refresh endpoint

## Backend Requirements

Your IDDI backend must implement:

1. **Windows Auth Endpoint**: `POST /api/v1/auth/windows`
   - Accept SSPI token in Authorization header
   - Return JWT access and refresh tokens

2. **Token Refresh Endpoint**: `POST /api/v1/auth/refresh`
   - Accept refresh token
   - Return new access token

3. **WebSocket Endpoint**: `ws://backend/ws?token=xxx`
   - Accept JWT token in query parameter
   - Support bidirectional message protocol

## Testing

```bash
# Run main process with debugging
npm run dev:main

# Test authentication
node -e "const { AuthService } = require('./dist/main/auth/auth-service'); AuthService.getInstance().testAuthentication().then(console.log);"

# View logs
# Check: %USERPROFILE%\AppData\Roaming\smart-pilot\logs\main.log
```

## Documentation

- **Full Context**: [SMART_PILOT_AUTH_WEBSOCKET_CONTEXT.md](./SMART_PILOT_AUTH_WEBSOCKET_CONTEXT.md)
- **Usage Examples**: [examples/auth-websocket-usage.ts](./examples/auth-websocket-usage.ts)
- **Type Definitions**: [src/shared/types/](./src/shared/types/)

## Security Best Practices

1. **Token Encryption**: Use machine-specific encryption key
2. **HTTPS/WSS**: Always use secure connections in production
3. **Token Expiry**: Keep token lifetime short (30 minutes recommended)
4. **Auto-Refresh**: Enable automatic token refresh
5. **Context Isolation**: Keep renderer process isolated
6. **No Secrets**: Never store passwords or secrets in code

## Future Enhancements

- Certificate-based authentication
- Multi-factor authentication (MFA)
- Offline mode with operation queue
- Token rotation for enhanced security
- Windows Hello biometric integration
- Session recording and audit logs

## Support

For issues or questions:
1. Check [SMART_PILOT_AUTH_WEBSOCKET_CONTEXT.md](./SMART_PILOT_AUTH_WEBSOCKET_CONTEXT.md)
2. Review [examples/auth-websocket-usage.ts](./examples/auth-websocket-usage.ts)
3. Check application logs in AppData
4. Contact Smart Pilot team

---

**Version:** 1.0
**Last Updated:** 2026-01-16

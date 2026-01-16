/**
 * Smart Pilot - Authentication & WebSocket Usage Examples
 *
 * Complete examples showing how to use Windows authentication
 * and WebSocket features in Smart Pilot
 */

// ============================================================================
// EXAMPLE 1: Basic Authentication Flow
// ============================================================================

async function example1_BasicAuthentication() {
  console.log('=== Example 1: Basic Authentication ===\n');

  // Check if already authenticated
  const status = await window.smartPilot.auth.checkStatus();
  console.log('Current auth status:', status);

  if (!status.isAuthenticated) {
    // Perform Windows authentication
    console.log('Performing Windows authentication...');
    const result = await window.smartPilot.auth.login();

    if (result.success) {
      console.log('Login successful!');
      console.log('User:', result.user);
      console.log('Token expires in:', result.tokenExpiresIn, 'seconds');
    } else {
      console.error('Login failed:', result.error);
    }
  } else {
    console.log('Already authenticated as:', status.user?.username);
  }
}

// ============================================================================
// EXAMPLE 2: Auth State Monitoring
// ============================================================================

function example2_AuthStateMonitoring() {
  console.log('=== Example 2: Auth State Monitoring ===\n');

  // Listen for authentication state changes
  const unsubscribe = window.smartPilot.auth.onAuthStateChanged((event) => {
    console.log('Auth state changed:', {
      from: event.previousState,
      to: event.newState,
      reason: event.reason,
      timestamp: new Date(event.timestamp).toISOString(),
    });

    // Handle different state changes
    switch (event.reason) {
      case 'login':
        console.log('User logged in successfully');
        onUserLogin();
        break;

      case 'logout':
        console.log('User logged out');
        onUserLogout();
        break;

      case 'token_refreshed':
        console.log('Token refreshed automatically');
        break;

      case 'token_expired':
        console.log('Token expired, user needs to re-authenticate');
        showReLoginDialog();
        break;

      case 'error':
        console.error('Authentication error occurred');
        break;
    }
  });

  // Clean up listener when component unmounts
  return unsubscribe;
}

// ============================================================================
// EXAMPLE 3: Manual Token Refresh
// ============================================================================

async function example3_ManualTokenRefresh() {
  console.log('=== Example 3: Manual Token Refresh ===\n');

  // Check token expiration
  const status = await window.smartPilot.auth.checkStatus();
  console.log('Token expires in:', status.tokenExpiresIn, 'seconds');

  // Refresh token manually if needed
  if (status.tokenExpiresIn && status.tokenExpiresIn < 300) {
    console.log('Token expiring soon, refreshing...');

    const result = await window.smartPilot.auth.refreshToken();
    if (result.success) {
      console.log('Token refreshed successfully');
    } else {
      console.error('Token refresh failed:', result.error);
    }
  }
}

// ============================================================================
// EXAMPLE 4: WebSocket Connection
// ============================================================================

async function example4_WebSocketConnection() {
  console.log('=== Example 4: WebSocket Connection ===\n');

  // Ensure user is authenticated first
  const authStatus = await window.smartPilot.auth.checkStatus();
  if (!authStatus.isAuthenticated) {
    console.error('User must be authenticated to connect WebSocket');
    return;
  }

  // Connect to WebSocket
  const result = await window.smartPilot.ws.connect({
    url: 'wss://backend.iddi.com/ws',
    autoReconnect: true,
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    pingInterval: 30000,
  });

  if (result.success) {
    console.log('WebSocket connected successfully');

    // Get connection state
    const state = await window.smartPilot.ws.getState();
    console.log('Connection state:', state);
  } else {
    console.error('WebSocket connection failed:', result.error);
  }
}

// ============================================================================
// EXAMPLE 5: WebSocket Event Handlers
// ============================================================================

function example5_WebSocketEventHandlers() {
  console.log('=== Example 5: WebSocket Event Handlers ===\n');

  // Connection events
  const unsubscribeConnected = window.smartPilot.ws.onConnected((state) => {
    console.log('✓ WebSocket connected', {
      status: state.status,
      connectedAt: new Date(state.connectedAt!).toISOString(),
    });
  });

  const unsubscribeDisconnected = window.smartPilot.ws.onDisconnected((state) => {
    console.log('✗ WebSocket disconnected', {
      status: state.status,
      lastError: state.lastError,
    });
  });

  const unsubscribeReconnecting = window.smartPilot.ws.onReconnecting((state) => {
    console.log('⟳ WebSocket reconnecting...', {
      attempt: state.reconnectAttempts,
    });
  });

  const unsubscribeError = window.smartPilot.ws.onError((error) => {
    console.error('WebSocket error:', {
      code: error.code,
      message: error.message,
      timestamp: new Date(error.timestamp).toISOString(),
    });
  });

  // Return cleanup function
  return () => {
    unsubscribeConnected();
    unsubscribeDisconnected();
    unsubscribeReconnecting();
    unsubscribeError();
  };
}

// ============================================================================
// EXAMPLE 6: Receiving WebSocket Messages
// ============================================================================

function example6_ReceivingMessages() {
  console.log('=== Example 6: Receiving WebSocket Messages ===\n');

  // Generic message handler
  const unsubscribeMessage = window.smartPilot.ws.onMessage((message) => {
    console.log('Message received:', {
      type: message.type,
      payload: message.payload,
      timestamp: new Date(message.timestamp).toISOString(),
    });
  });

  // Progress update handler
  const unsubscribeProgress = window.smartPilot.ws.onProgressUpdate((payload) => {
    console.log('Progress update:', {
      operation: payload.operationId,
      progress: payload.progress + '%',
      step: payload.step,
      eta: payload.estimatedTimeRemaining + 's',
    });

    // Update UI progress bar
    updateProgressBar(payload.progress);
  });

  // Task assigned handler
  const unsubscribeTask = window.smartPilot.ws.onTaskAssigned((payload) => {
    console.log('New task assigned:', {
      taskId: payload.taskId,
      type: payload.taskType,
      priority: payload.priority,
      description: payload.description,
    });

    // Show notification
    showTaskNotification(payload);
  });

  // Notification handler
  const unsubscribeNotification = window.smartPilot.ws.onNotification((payload) => {
    console.log('Notification:', {
      title: payload.title,
      message: payload.message,
      level: payload.level,
    });

    // Display notification to user
    displayNotification(payload);
  });

  // Return cleanup function
  return () => {
    unsubscribeMessage();
    unsubscribeProgress();
    unsubscribeTask();
    unsubscribeNotification();
  };
}

// ============================================================================
// EXAMPLE 7: Sending WebSocket Messages
// ============================================================================

async function example7_SendingMessages() {
  console.log('=== Example 7: Sending WebSocket Messages ===\n');

  // Send custom payload
  await window.smartPilot.ws.sendMessage('custom_payload', {
    action: 'get_documents',
    filters: {
      status: 'pending',
      category: 'insurance_claims',
    },
  });

  console.log('Custom message sent');

  // Send with correlation ID for request-response pattern
  const correlationId = 'req-' + Date.now();
  await window.smartPilot.ws.sendMessage(
    'custom_payload',
    {
      action: 'process_document',
      documentId: 'doc-12345',
    },
    correlationId
  );

  console.log('Message sent with correlation ID:', correlationId);

  // Listen for response
  const unsubscribe = window.smartPilot.ws.onMessage((message) => {
    if (message.correlationId === correlationId) {
      console.log('Response received:', message.payload);
      unsubscribe();
    }
  });
}

// ============================================================================
// EXAMPLE 8: Cancel Operation
// ============================================================================

async function example8_CancelOperation() {
  console.log('=== Example 8: Cancel Operation ===\n');

  const operationId = 'op-12345';

  // Cancel a running operation
  await window.smartPilot.ws.cancelOperation(operationId, 'User cancelled');
  console.log('Cancellation request sent for operation:', operationId);
}

// ============================================================================
// EXAMPLE 9: WebSocket Statistics
// ============================================================================

async function example9_WebSocketStatistics() {
  console.log('=== Example 9: WebSocket Statistics ===\n');

  const stats = await window.smartPilot.ws.getStats();

  if (stats) {
    console.log('WebSocket Statistics:', {
      messagesSent: stats.messagesSent,
      messagesReceived: stats.messagesReceived,
      bytesSent: stats.bytesSent,
      bytesReceived: stats.bytesReceived,
      reconnectCount: stats.reconnectCount,
      averageLatency: stats.averageLatency + 'ms',
      uptime: stats.uptime + 's',
    });
  }
}

// ============================================================================
// EXAMPLE 10: Complete Integration (React Component)
// ============================================================================

function Example10_ReactComponent() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [wsConnected, setWsConnected] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [notifications, setNotifications] = React.useState([]);

  React.useEffect(() => {
    // Initialize authentication
    initializeAuth();

    // Setup WebSocket listeners
    const cleanupWs = setupWebSocketListeners();

    // Cleanup on unmount
    return () => {
      cleanupWs();
      window.smartPilot.ws.disconnect();
    };
  }, []);

  const initializeAuth = async () => {
    // Check authentication status
    const status = await window.smartPilot.auth.checkStatus();
    setIsAuthenticated(status.isAuthenticated);

    if (status.isAuthenticated) {
      setCurrentUser(status.user);
      // Auto-connect WebSocket
      await connectWebSocket();
    }

    // Listen for auth state changes
    window.smartPilot.auth.onAuthStateChanged(async (event) => {
      if (event.newState === 'authenticated') {
        setIsAuthenticated(true);
        const user = await window.smartPilot.auth.getCurrentUser();
        setCurrentUser(user);
        await connectWebSocket();
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setWsConnected(false);
        await window.smartPilot.ws.disconnect();
      }
    });
  };

  const connectWebSocket = async () => {
    const result = await window.smartPilot.ws.connect();
    setWsConnected(result.success);
  };

  const setupWebSocketListeners = () => {
    const cleanup = [];

    cleanup.push(
      window.smartPilot.ws.onConnected(() => {
        setWsConnected(true);
      })
    );

    cleanup.push(
      window.smartPilot.ws.onDisconnected(() => {
        setWsConnected(false);
      })
    );

    cleanup.push(
      window.smartPilot.ws.onNotification((payload) => {
        setNotifications((prev) => [...prev, payload]);
      })
    );

    return () => cleanup.forEach((fn) => fn());
  };

  const handleLogin = async () => {
    const result = await window.smartPilot.auth.login();
    if (!result.success) {
      alert('Login failed: ' + result.error);
    }
  };

  const handleLogout = async () => {
    await window.smartPilot.auth.logout();
  };

  const handleSendMessage = async () => {
    await window.smartPilot.ws.sendMessage('custom_payload', {
      action: 'test',
      data: { hello: 'world' },
    });
  };

  return (
    <div>
      <h1>Smart Pilot</h1>

      <div>
        <h2>Authentication</h2>
        {isAuthenticated ? (
          <div>
            <p>Logged in as: {currentUser?.displayName}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin}>Login with Windows</button>
        )}
      </div>

      <div>
        <h2>WebSocket</h2>
        <p>Status: {wsConnected ? 'Connected' : 'Disconnected'}</p>
        {wsConnected && (
          <button onClick={handleSendMessage}>Send Test Message</button>
        )}
      </div>

      <div>
        <h2>Notifications</h2>
        {notifications.map((notif, index) => (
          <div key={index}>
            <strong>{notif.title}</strong>: {notif.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 11: Error Handling
// ============================================================================

async function example11_ErrorHandling() {
  console.log('=== Example 11: Error Handling ===\n');

  try {
    // Attempt authentication
    const result = await window.smartPilot.auth.login();

    if (!result.success) {
      // Handle authentication errors
      switch (result.errorCode) {
        case 'WINDOWS_AUTH_FAILED':
          console.error('Windows authentication failed. Please check your domain credentials.');
          break;

        case 'NETWORK_ERROR':
          console.error('Network error. Please check your connection and try again.');
          break;

        case 'BACKEND_UNAVAILABLE':
          console.error('Backend server is unavailable. Please try again later.');
          break;

        case 'KERBEROS_ERROR':
          console.error('Kerberos authentication failed. Falling back to NTLM...');
          // Retry logic here
          break;

        default:
          console.error('Authentication failed:', result.error);
      }
    }
  } catch (error) {
    console.error('Unexpected error during authentication:', error);
  }

  // WebSocket error handling
  window.smartPilot.ws.onError((error) => {
    switch (error.code) {
      case 'CONNECTION_FAILED':
        console.error('WebSocket connection failed. Retrying...');
        break;

      case 'AUTHENTICATION_FAILED':
        console.error('WebSocket authentication failed. Token may be expired.');
        // Refresh token and reconnect
        window.smartPilot.auth.refreshToken().then(() => {
          window.smartPilot.ws.connect();
        });
        break;

      case 'PONG_TIMEOUT':
        console.error('Server not responding. Connection will be reestablished.');
        break;

      default:
        console.error('WebSocket error:', error.message);
    }
  });
}

// ============================================================================
// EXAMPLE 12: Configuration
// ============================================================================

async function example12_Configuration() {
  console.log('=== Example 12: Custom Configuration ===\n');

  // Connect with custom WebSocket configuration
  await window.smartPilot.ws.connect({
    url: 'wss://custom-backend.com/ws',
    autoReconnect: true,
    reconnectInterval: 2000,      // Start with 2 second delay
    maxReconnectInterval: 60000,  // Max 60 seconds
    reconnectDecay: 1.5,          // Exponential backoff factor
    maxReconnectAttempts: 10,     // Give up after 10 attempts
    pingInterval: 20000,          // Ping every 20 seconds
    pongTimeout: 10000,           // Wait 10 seconds for pong
    connectionTimeout: 15000,     // Connection timeout 15 seconds
  });

  console.log('WebSocket connected with custom configuration');
}

// ============================================================================
// Helper Functions
// ============================================================================

function onUserLogin() {
  console.log('User login handler called');
  // Initialize application state
  // Load user preferences
  // Connect to backend services
}

function onUserLogout() {
  console.log('User logout handler called');
  // Clear application state
  // Disconnect from services
  // Redirect to login page
}

function showReLoginDialog() {
  console.log('Showing re-login dialog');
  // Display modal asking user to re-authenticate
}

function updateProgressBar(progress: number) {
  console.log('Updating progress bar:', progress + '%');
  // Update UI progress indicator
}

function showTaskNotification(task: any) {
  console.log('Showing task notification:', task.description);
  // Display OS notification or in-app notification
}

function displayNotification(notification: any) {
  console.log('Displaying notification:', notification.title);
  // Show notification in UI
}

// ============================================================================
// Export Examples
// ============================================================================

export const examples = {
  basicAuthentication: example1_BasicAuthentication,
  authStateMonitoring: example2_AuthStateMonitoring,
  manualTokenRefresh: example3_ManualTokenRefresh,
  websocketConnection: example4_WebSocketConnection,
  websocketEventHandlers: example5_WebSocketEventHandlers,
  receivingMessages: example6_ReceivingMessages,
  sendingMessages: example7_SendingMessages,
  cancelOperation: example8_CancelOperation,
  websocketStatistics: example9_WebSocketStatistics,
  reactComponent: Example10_ReactComponent,
  errorHandling: example11_ErrorHandling,
  configuration: example12_Configuration,
};

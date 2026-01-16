# Smart Pilot - Nginx Integration Guide

## Backend Infrastructure

Smart Pilot connects to the IDDI backend which runs behind **nginx** as a reverse proxy.

### Architecture

```
Smart Pilot (Electron App)
    ↓
nginx (192.168.2.5:443)
    ↓
├── /ws       → WebSocket (backend:8000/ws)
├── /api      → REST API (backend:8000/api)
├── /health   → Health check
└── /         → Frontend (frontend:3000)
```

## Correct Configuration

### Environment Variables (.env file)

Create `.env` in project root with:

```env
BACKEND_URL=https://192.168.2.5
WS_URL=wss://192.168.2.5/ws
```

**Important**:
- Use `wss://` (WebSocket Secure) not `ws://`
- Use `https://` not `http://`
- No port number needed (nginx handles SSL on 443)

### Nginx Routes Used by Smart Pilot

| Route | Purpose | Backend Endpoint | Timeout |
|-------|---------|------------------|---------|
| `/ws` | WebSocket real-time communication | `backend:8000/ws` | 3600s |
| `/api/v1/auth/login` | User authentication | `backend:8000/api/v1/auth/login` | 300s |
| `/api/v1/auth/me` | Get current user | `backend:8000/api/v1/auth/me` | 300s |
| `/api/v1/auth/sso/callback` | SSO callback | `backend:8000/api/v1/auth/sso/callback` | 300s |
| `/health` | Health check | `backend:8000/health` | 30s |

### SSL/TLS Configuration

Nginx is configured with:
- **SSL Certificate**: `/etc/nginx/ssl/nginx.crt`
- **SSL Key**: `/etc/nginx/ssl/nginx.key`
- **Protocols**: TLSv1.2, TLSv1.3
- **Ciphers**: HIGH:!aNULL:!MD5

**Note**: In development, Smart Pilot may need to accept self-signed certificates.

### WebSocket Configuration

Nginx WebSocket proxy includes:
- HTTP/1.1 upgrade headers
- Connection upgrade support
- Long timeouts (3600s read/send)
- No buffering
- SSL verification disabled (for self-signed certs)

### CORS Configuration

The backend API should have CORS enabled for:
- Origin: Electron app (handled by backend)
- Credentials: true
- Methods: GET, POST, PUT, DELETE, PATCH
- Headers: Authorization, Content-Type

## Testing Connectivity

### 1. Test Health Endpoint
```bash
curl -k https://192.168.2.5/health
```

### 2. Test API Endpoint
```bash
curl -k https://192.168.2.5/api/v1/health
```

### 3. Test WebSocket (from Smart Pilot)
The app automatically tests WebSocket connectivity on startup.

## Common Issues

### Issue 1: SSL Certificate Errors
**Error**: `CERT_HAS_EXPIRED` or `SELF_SIGNED_CERT_IN_CHAIN`

**Solution**: In development, the app accepts self-signed certificates:
```typescript
// Already configured in auth-service.ts
rejectUnauthorized: false  // Dev mode only
```

### Issue 2: WebSocket Connection Refused
**Error**: `WebSocket connection failed`

**Checklist**:
- [ ] Is nginx running? (`docker ps | grep nginx`)
- [ ] Is backend running? (`docker ps | grep backend`)
- [ ] Can you access `https://192.168.2.5/health`?
- [ ] Is WS_URL set to `wss://192.168.2.5/ws`?

### Issue 3: CORS Errors
**Error**: `Access-Control-Allow-Origin`

**Solution**: Backend must include CORS middleware (already configured in FastAPI).

### Issue 4: Network Unreachable
**Error**: `ENETUNREACH` or timeout

**Solution**:
- Ensure you're on the same network as the server (192.168.2.x)
- Check firewall allows port 443
- Verify nginx is bound to correct interface

## Development vs Production

### Development (Local Backend)
```env
BACKEND_URL=http://localhost:8001
WS_URL=ws://localhost:8001/ws
```

### Production (Nginx)
```env
BACKEND_URL=https://192.168.2.5
WS_URL=wss://192.168.2.5/ws
```

### Future Production (Domain)
```env
BACKEND_URL=https://smartflow.insurancedata.com
WS_URL=wss://smartflow.insurancedata.com/ws
```

## Docker Network Details

From `docker-compose.yml`:
- **Nginx Container**: `iddi-nginx`
- **Backend Container**: `iddi-backend`
- **Ports**: 443 (HTTPS), 80 (redirect to HTTPS)
- **Network**: Default Docker bridge

### Access from Host Machine
```
https://192.168.2.5          → Frontend
https://192.168.2.5/api      → Backend API
wss://192.168.2.5/ws         → WebSocket
https://192.168.2.5/docs     → API Documentation
```

## Smart Pilot Connection Flow

1. **App Starts** → Loads `.env` file
2. **Auth Check** → `GET https://192.168.2.5/api/v1/auth/me`
3. **WebSocket Connect** → `wss://192.168.2.5/ws?token=xxx`
4. **Keep-Alive** → Ping every 30 seconds
5. **Auto-Reconnect** → Exponential backoff if disconnected

## Monitoring

### Check Nginx Logs
```bash
docker logs iddi-nginx
```

### Check Backend Logs
```bash
docker logs iddi-backend
```

### Watch WebSocket Traffic
Enable Developer Tools in Smart Pilot:
- Press `Ctrl+Shift+I`
- Go to Network tab
- Filter by WS
- Watch WebSocket messages

## Security Notes

1. **Self-Signed Certificates**: Only acceptable in development
2. **Production**: Use Let's Encrypt or proper CA-signed certificates
3. **Windows Firewall**: May need to allow outbound HTTPS/WSS
4. **Corporate Proxy**: May need proxy configuration
5. **VPN**: Ensure VPN doesn't block WebSocket connections

## Troubleshooting Commands

```bash
# Test nginx is running
docker ps | grep nginx

# Test backend is running
docker ps | grep backend

# Test health endpoint
curl -k https://192.168.2.5/health

# Test API endpoint
curl -k https://192.168.2.5/api/v1/health

# Test WebSocket upgrade (should return 101)
curl -k -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://192.168.2.5/ws

# View nginx config
docker exec iddi-nginx cat /etc/nginx/conf.d/default.conf

# Restart nginx
docker restart iddi-nginx
```

## Summary

✅ **Correct URLs for Smart Pilot**:
- Backend: `https://192.168.2.5`
- WebSocket: `wss://192.168.2.5/ws`

❌ **Incorrect (Don't use)**:
- `http://localhost:8000` (bypasses nginx)
- `ws://localhost:8001/ws` (bypasses nginx)
- `http://192.168.2.5` (not SSL)

---

**Last Updated**: January 16, 2026
**Nginx Version**: nginx:alpine (from docker-compose.yml)
**Backend Port**: 8001 (mapped from container 8000)

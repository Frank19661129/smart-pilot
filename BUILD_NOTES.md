# Build Notes - Smart Pilot

## Native Module Dependencies Temporarily Removed

### Reason
The following native modules require Visual Studio C++ Build Tools which are not properly configured:
- `ffi-napi` - FFI bindings for Windows API
- `ref-napi` - Native data types
- `ref-struct-napi` - C struct definitions
- `node-sspi` - Windows SSPI authentication

### Current State
These dependencies have been temporarily removed to allow the application to build and run in demo mode.

### Impact
The following features are currently using mock data:
1. **Windows API Integration** - Window/browser detection uses mock data
2. **SSPI Authentication** - Uses simulated Windows user authentication

### To Re-enable Native Features

1. Install Visual Studio Build Tools:
   ```bash
   npm install --global windows-build-tools
   ```

2. Or install Visual Studio 2019/2022 with "Desktop development with C++" workload

3. Add dependencies back to package.json:
   ```json
   "ffi-napi": "^4.0.3",
   "ref-napi": "^3.0.3",
   "ref-struct-napi": "^1.1.1",
   "node-sspi": "^0.2.10"
   ```

4. Run `npm install`

5. Update `src/main/windows-integration/window-detector.ts` to use real Windows API calls

6. Update `src/main/auth/windows-auth.ts` to use real SSPI authentication

### Current Workarounds

The application includes mock implementations that simulate:
- Browser and window detection with realistic test data
- Windows user authentication with demo credentials
- All UI features work identically

This allows development and testing without native dependencies.

## Date
January 16, 2026

## Status
✅ App runs and builds successfully with mock data
⚠️ Native Windows API features require build tools installation

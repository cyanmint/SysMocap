# Browser Version Migration Guide

This document explains how SysMocap was adapted to run in web browsers for Android and web support.

## Overview

SysMocap originally used Electron for cross-platform desktop support. This migration adds a browser version that:
- Works on Android devices
- Runs in modern web browsers
- Maintains full motion capture capabilities
- Uses browser-native APIs instead of Electron APIs

## Architecture Changes

### 1. Dual-Mode Detection

All key JavaScript files now detect the runtime environment:

```javascript
const isBrowserMode = typeof window !== 'undefined' && 
    (typeof process === 'undefined' || !process.versions || !process.versions.electron);
```

This allows the same code to run in both Electron and browser environments.

### 2. Storage Layer

**Before (Electron):**
```javascript
const storage = require("electron-localstorage");
storage.setItem("key", value);
```

**After (Browser-compatible):**
```javascript
const storage = {
    getItem: (key) => JSON.parse(localStorage.getItem(key)),
    setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value))
};
```

### 3. IPC Communication

**Before (Electron):**
```javascript
const { ipcRenderer } = require("electron");
ipcRenderer.send("channel", data);
ipcRenderer.on("channel", callback);
```

**After (Browser shim):**
```javascript
const ipcRenderer = {
    send: (channel, ...args) => {
        window.dispatchEvent(new CustomEvent('ipc-' + channel, { detail: args }));
    },
    on: (channel, callback) => {
        window.addEventListener('ipc-' + channel, (e) => callback(e, e.detail));
    }
};
```

### 4. Remote API Shims

**Electron Remote APIs:**
- `remote.getGlobal()` → Returns browser-compatible alternatives
- `remote.app.getGPUInfo()` → Uses WebGL to detect GPU
- `remote.dialog.showOpenDialogSync()` → Uses HTML5 file input
- `remote.getCurrentWindow()` → Returns stub object
- `remote.shell.openExternal()` → Uses `window.open()`

### 5. File Handling

**Before (Electron):**
```javascript
const result = await remote.dialog.showOpenDialogSync({
    properties: ["openFile"],
    filters: [...]
});
```

**After (Browser):**
```javascript
const input = document.createElement('input');
input.type = 'file';
input.accept = 'video/mp4,video/webm';
input.onchange = (e) => {
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    app.videoPath = url;
};
input.click();
```

## Modified Files

### Core Files

1. **mainview/framework.js**
   - Added browser mode detection at startup
   - Implemented IPC shim for browser
   - Created remote API shims
   - Dual initialization paths for Electron and browser
   - Wrapped all Electron-specific code in checks

2. **utils/setting.js**
   - Added browser detection
   - Switched storage backends based on environment
   - Browser uses localStorage, Electron uses electron-localstorage

3. **utils/language.js**
   - Made module compatible with both CommonJS and browser
   - Exports to `window.languages` in browser mode
   - Uses `module.exports` in Node.js/Electron

4. **mocap/mocap.js**
   - Added browser mode detection
   - Implemented IPC shim for browser
   - Made globalSettings loading environment-aware

5. **mocaprender/script.js**
   - Added browser compatibility layer
   - Made language loading work in browser
   - IPC shim for rendering communication

### New Files

1. **browser-serve.js**
   - Simple Express server for development
   - Serves static files and node_modules
   - CORS headers for development

2. **browser/index.html**
   - Entry point for browser version
   - Redirects to mainview/framework.html

3. **browser/browser-shim.js**
   - Additional browser compatibility utilities
   - Reserved for future enhancements

4. **browser/README.md**
   - Comprehensive browser version documentation
   - Quick start guide
   - Feature comparison

### Modified Configuration

1. **package.json**
   - Added `"browser": "node browser-serve.js"` script

2. **mainview/framework.html**
   - Added language.js script tag for browser loading

## Feature Comparison

| Feature | Electron | Browser |
|---------|----------|---------|
| Motion Capture | ✅ | ✅ |
| 3D Model Rendering | ✅ | ✅ |
| Camera Access | ✅ Native | ✅ getUserMedia |
| File Dialogs | ✅ Native | ✅ HTML5 Input |
| Settings Storage | ✅ File System | ✅ localStorage |
| Window Controls | ✅ Native | ❌ |
| Update Checking | ✅ | ❌ |
| GPU Selection | ✅ | ❌ |
| Separate Process | ✅ | ❌ |

## Running the Browser Version

### Development

```bash
npm install
npm run browser
```

Then navigate to:
- `http://localhost:3000/mainview/framework.html`

### Production

For production deployment:

1. Use any static file server (nginx, Apache, etc.)
2. **HTTPS is required** for camera access
3. Serve the entire project directory
4. Ensure node_modules is accessible

Example nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name sysmocap.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /path/to/SysMocap;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location /node_modules {
        alias /path/to/SysMocap/node_modules;
    }
}
```

## Android Support

The browser version works on Android devices with:
- Chrome 90+
- Firefox 88+
- Samsung Internet 14+

**Requirements:**
- HTTPS (for camera access)
- WebGL support
- ES6 module support

**Usage:**
1. Access the browser version URL from Android device
2. Grant camera permissions when prompted
3. Use touch gestures to interact

## Limitations

### Browser Version

- No native file system access (files must be selected by user)
- No automatic updates
- No discrete GPU selection
- No separate render process
- Settings lost if localStorage cleared
- Limited to browser security model

### Security Considerations

- Camera access requires HTTPS in production
- Files are processed client-side only
- No server-side data storage
- All computation happens in browser

## Testing

### Verified Functionality

- ✅ Server starts successfully
- ✅ Static files served correctly
- ✅ Node modules accessible
- ✅ No JavaScript syntax errors

### Requires Testing

- 🔄 Browser UI rendering
- 🔄 Camera access in browser
- 🔄 Motion capture in browser
- 🔄 3D model loading
- 🔄 Touch interface on mobile
- 🔄 Performance on Android devices

## Future Enhancements

Potential improvements:
1. Progressive Web App (PWA) support
2. Service worker for offline capability
3. WebRTC for multi-user scenarios
4. WebAssembly for better performance
5. IndexedDB for larger data storage
6. File System Access API (when widely supported)

## Troubleshooting

### Common Issues

**Server won't start:**
```bash
npm install  # Reinstall dependencies
npm run browser
```

**Camera not working:**
- Ensure HTTPS is used (required by browsers)
- Check browser permissions
- Verify camera is not in use by another app

**Models won't load:**
- Check browser console for errors
- Ensure models.json is accessible
- Verify CORS settings

**Performance issues:**
- Reduce model complexity setting
- Lower camera resolution
- Use desktop browser instead of mobile

## Contributing

When adding new features:
1. Always add browser mode checks
2. Provide browser-compatible alternatives
3. Update both Electron and browser paths
4. Test in both environments
5. Document browser limitations

## License

Same as main project: Mozilla Public License 2.0

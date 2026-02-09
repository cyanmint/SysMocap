# SysMocap Runtime Modes

SysMocap now supports **three different runtime modes**, each with different capabilities and platform support.

## Runtime Modes Overview

| Mode | Desktop | Mobile | Platform Support | Node.js Access | Native APIs |
|------|---------|--------|------------------|----------------|-------------|
| **Electron** | ✅ | ❌ | Windows, macOS, Linux | ✅ | ✅ Full |
| **NW.js** | ✅ | ✅* | Windows, macOS, Linux, Android* | ✅ | ✅ Full |
| **Browser** | ✅ | ✅ | All platforms with modern browser | ❌ | ❌ Limited |

*NW.js mobile support requires additional packaging for Android/iOS

## 1. Electron Mode (Desktop Only)

### Overview
- Original runtime environment
- Best for desktop applications
- Full native OS integration
- Separate main/renderer processes

### Capabilities
- ✅ Native file dialogs
- ✅ Native menus and window controls
- ✅ Auto-updates
- ✅ Full file system access
- ✅ GPU acceleration control
- ✅ Separate process architecture
- ❌ Mobile support

### Running
```bash
npm install
npm start
```

### Building
```bash
# Windows x64
npm run package:win64

# macOS x64
npm run package:mac64

# macOS ARM64
npm run package:macarm

# Windows ARM64
npm run package:winarm
```

### Entry Point
- `main.js` - Electron main process
- `mainview/framework.html` - Renderer process

### Dependencies
- Requires `electron` package
- Uses `@electron/remote` for IPC
- Uses `electron-localstorage` for storage

## 2. NW.js Mode (Desktop & Mobile)

### Overview
- Node-webkit runtime
- Single process model (Node.js + DOM in same context)
- Better mobile platform support potential
- Can build for Android with additional tools

### Capabilities
- ✅ Full Node.js API access in renderer
- ✅ Direct DOM manipulation with Node.js
- ✅ Native file access
- ✅ Simpler architecture (no IPC needed)
- ✅ Potential Android/mobile deployment
- ✅ GPU acceleration
- ❌ No automatic updates built-in

### Running
```bash
npm install
npm run start:nw
```

### Building
```bash
# Windows x64
npm run package:nw-win64

# macOS x64
npm run package:nw-mac64

# Linux x64
npm run package:nw-linux64
```

### Entry Point
- `main-nw.js` - NW.js startup script
- `mainview/framework.html` - Main window (defined in package.json)

### Dependencies
- Requires `nw` package for development
- Uses `nw-builder` for packaging
- Uses file-based storage (Node.js fs module)

### Key Differences from Electron
1. **Single process**: No separate main/renderer processes
2. **Direct access**: Can use `require()` directly in HTML/JS
3. **Global context**: Access to both Node.js and browser APIs
4. **Window management**: Uses `nw.Window` API instead of Electron's BrowserWindow

## 3. Browser Mode (Desktop & Mobile)

### Overview
- Pure web application
- Runs in any modern browser
- Best for Android/iOS devices
- No installation required

### Capabilities
- ✅ Cross-platform (any device with browser)
- ✅ Mobile browser support (Android, iOS)
- ✅ Touch-friendly interface
- ✅ No installation needed
- ✅ Easy deployment
- ❌ No native file access
- ❌ Limited to browser APIs
- ❌ Requires HTTPS for camera

### Running
```bash
npm install
npm run browser
# Open http://localhost:3000/mainview/framework.html
```

### Building
```bash
# Linux/Mac
npm run build:web

# Windows
npm run build:web:win
```

### Deployment
1. Copy `web-build` directory to web server
2. Enable HTTPS (required for camera access)
3. Configure CORS headers
4. Serve static files

### Entry Point
- `browser-serve.js` - Development server
- `mainview/framework.html` - Main application
- `browser/index.html` - Optional entry point

### Dependencies
- Uses `localStorage` for settings
- Uses `getUserMedia` for camera
- Uses HTML5 File API for file selection

## Runtime Detection

The application automatically detects which runtime it's running in:

```javascript
// From utils/runtime-detector.js or framework.js
const isNwjs = (function() {
    try {
        return typeof nw !== 'undefined' && nw.process;
    } catch (e) {
        return false;
    }
})();

const isElectron = typeof process !== 'undefined' && 
    process.versions && process.versions.electron && !isNwjs;

const isBrowserMode = typeof window !== 'undefined' && 
    !isNwjs && !isElectron;
```

## Choosing the Right Mode

### Use Electron when:
- ✅ Targeting desktop only
- ✅ Need full native OS integration
- ✅ Want automatic updates
- ✅ Need separate process security
- ✅ Building professional desktop app

### Use NW.js when:
- ✅ Need desktop + potential mobile
- ✅ Want simpler architecture
- ✅ Need direct Node.js in renderer
- ✅ Planning Android deployment
- ✅ Prefer single process model

### Use Browser when:
- ✅ Need mobile browser support NOW
- ✅ Want zero installation
- ✅ Targeting Android/iOS browsers
- ✅ Need easy deployment
- ✅ Prefer pure web technologies

## Feature Comparison

| Feature | Electron | NW.js | Browser |
|---------|----------|-------|---------|
| Motion Capture | ✅ | ✅ | ✅ |
| 3D Rendering | ✅ | ✅ | ✅ |
| Camera Access | ✅ Native | ✅ Native | ✅ getUserMedia |
| File Dialogs | ✅ Native | ✅ Native | ⚠️ HTML5 Input |
| Settings Storage | ✅ File | ✅ File | ✅ localStorage |
| Updates | ✅ Auto | ⚠️ Manual | ❌ |
| Window Controls | ✅ Full | ✅ Full | ❌ |
| Installation | Required | Required | ❌ None |
| Package Size | ~150MB | ~120MB | ~15MB |
| Android Support | ❌ | ✅* | ✅ |
| iOS Support | ❌ | ⚠️* | ✅ |

*With additional configuration/tooling

## Development Workflow

### Testing All Modes

```bash
# Test Electron
npm start

# Test NW.js (after installing nw)
npm run start:nw

# Test Browser
npm run browser
# Open http://localhost:3000/mainview/framework.html
```

### Adding New Features

When adding features, ensure compatibility with all modes:

1. **Check runtime**: Use runtime detection
2. **Provide fallbacks**: Browser-compatible alternatives
3. **Test all modes**: Verify functionality in each runtime
4. **Document differences**: Note any mode-specific behavior

Example:
```javascript
if (isElectron) {
    // Use Electron APIs
    const { shell } = require('electron');
    shell.openExternal(url);
} else if (isNwjs) {
    // Use NW.js APIs
    nw.Shell.openExternal(url);
} else {
    // Browser fallback
    window.open(url, '_blank');
}
```

## Mobile Deployment

### Android (Browser Mode) - Ready Now
1. Deploy web version to HTTPS server
2. Open in Chrome/Firefox on Android
3. Add to home screen for app-like experience

### Android (NW.js Mode) - Requires Additional Setup
1. Use tools like Cordova or Capacitor
2. Package NW.js app for Android
3. Requires additional native bridge configuration

### iOS (Browser Mode) - Ready Now
1. Deploy web version to HTTPS server
2. Open in Safari on iOS
3. Add to home screen

## Troubleshooting

### Electron Issues
- Check `main.js` for main process errors
- Verify `@electron/remote` is initialized
- Check Electron version compatibility

### NW.js Issues
- Ensure `nw` package is installed
- Check `main-nw.js` loads correctly
- Verify `window` configuration in package.json
- Check Node.js version compatibility

### Browser Issues
- Enable HTTPS for camera access
- Check browser console for errors
- Verify CORS headers
- Ensure modern browser (Chrome 90+, Firefox 88+, Safari 14+)

## Performance Comparison

| Metric | Electron | NW.js | Browser |
|--------|----------|-------|---------|
| Startup Time | ~2-3s | ~1-2s | ~1s |
| Memory Usage | ~200MB | ~150MB | ~100MB |
| CPU Usage | Medium | Medium | Low-Medium |
| GPU Access | Full | Full | WebGL |
| Load Time | Local | Local | Network |

## Conclusion

SysMocap's three-mode architecture provides flexibility:

- **Electron**: Best desktop experience
- **NW.js**: Desktop + mobile potential  
- **Browser**: Instant mobile access

Choose the mode that best fits your deployment needs!

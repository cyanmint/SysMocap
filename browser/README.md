# SysMocap Browser Edition

This is the browser version of SysMocap for Android and web support.

## Quick Start

### Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run browser
```

3. Open your browser and navigate to:
```
http://localhost:3000/mainview/framework.html
```

### Features in Browser Mode

- ✅ Motion capture using MediaPipe
- ✅ 3D model rendering with Three.js
- ✅ Camera access via getUserMedia API
- ✅ Local storage for settings
- ✅ Touch-friendly UI for mobile devices
- ⚠️ File dialogs replaced with HTML5 file inputs
- ⚠️ No native window controls (works in full-screen mode)

### Android Support

To use on Android devices:
1. Open Chrome or any modern mobile browser
2. Navigate to the server URL (http://your-server-ip:3000/mainview/framework.html)
3. Allow camera permissions when prompted
4. Use touch gestures to control the interface

### Differences from Desktop Version

- File system access is limited to user-selected files
- No native menus or window controls
- Update checking is disabled in browser mode
- Some desktop-specific features are not available
- Settings are stored in browser localStorage instead of file system

### Development

The browser compatibility layer is implemented in:
- `utils/setting.js` - Browser-compatible storage
- `utils/language.js` - Universal module loading
- `mainview/framework.js` - Browser detection and shims
- `mocap/mocap.js` - Browser IPC shim
- `mocaprender/script.js` - Browser compatibility

### Building for Production

For production deployment, you can use any static file server. The app is entirely client-side and requires:
- A web server to serve static files
- HTTPS for camera access (required by browsers)
- WebGL support
- ES6 module support

## License

Mozilla Public License 2.0 - see LICENSE file

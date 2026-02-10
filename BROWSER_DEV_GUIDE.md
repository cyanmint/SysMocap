# Browser Version - Developer Quick Reference

## Adding New Features

When adding features to SysMocap, follow this pattern to maintain browser compatibility:

### Pattern 1: Environment Detection

```javascript
// At the top of your file
const isBrowserMode = typeof window !== 'undefined' && 
    (typeof process === 'undefined' || !process.versions || !process.versions.electron);
```

### Pattern 2: Conditional Electron APIs

```javascript
// DON'T DO THIS:
const { shell } = require("electron");
shell.openExternal(url);

// DO THIS INSTEAD:
if (!isBrowserMode) {
    const { shell } = require("electron");
    shell.openExternal(url);
} else {
    window.open(url, '_blank');
}
```

### Pattern 3: IPC Communication

```javascript
// Use the shim that works in both modes
ipcRenderer.send("myChannel", data);  // Works in both Electron and browser

// The shim is defined in framework.js for browser mode:
if (isBrowserMode) {
    ipcRenderer = {
        send: (channel, ...args) => {
            window.dispatchEvent(new CustomEvent('ipc-' + channel, { detail: args }));
        },
        on: (channel, callback) => {
            window.addEventListener('ipc-' + channel, (e) => callback(e, e.detail));
        }
    };
}
```

### Pattern 4: File System Access

```javascript
// DON'T DO THIS:
const fs = require('fs');
fs.readFile(path, callback);

// DO THIS INSTEAD:
if (!isBrowserMode) {
    const fs = require('fs');
    fs.readFile(path, callback);
} else {
    // Use FileReader API
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => callback(null, e.target.result);
        reader.readAsText(file);
    };
    input.click();
}
```

### Pattern 5: Module Loading

```javascript
// For modules that need to work in both environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/Electron
    module.exports = myModule;
} else {
    // Browser
    window.myModule = myModule;
}
```

## Common API Mappings

### Storage

| Electron | Browser |
|----------|---------|
| `electron-localstorage.getItem()` | `JSON.parse(localStorage.getItem())` |
| `electron-localstorage.setItem()` | `localStorage.setItem(key, JSON.stringify(val))` |

### Window Management

| Electron | Browser |
|----------|---------|
| `remote.getCurrentWindow().close()` | `window.close()` |
| `remote.getCurrentWindow().maximize()` | Not available |
| `remote.getCurrentWindow().isMaximized()` | Not available (return false) |

### Dialogs

| Electron | Browser |
|----------|---------|
| `remote.dialog.showOpenDialog()` | `<input type="file">` + click() |
| `remote.dialog.showSaveDialog()` | Download link with blob URL |
| `remote.dialog.showMessageBox()` | `alert()`, `confirm()` |

### External Links

| Electron | Browser |
|----------|---------|
| `shell.openExternal(url)` | `window.open(url, '_blank')` |

### System Info

| Electron | Browser |
|----------|---------|
| `process.platform` | `navigator.platform` or UA parsing |
| `app.getVersion()` | Hard-coded version string |
| `app.getGPUInfo()` | WebGL renderer detection |

## Testing Checklist

Before committing new features:

- [ ] Test in Electron mode (`npm start`)
- [ ] Test in browser mode (`npm run browser`)
- [ ] No console errors in either mode
- [ ] All Electron APIs wrapped in checks
- [ ] Browser alternatives provided where needed
- [ ] Documentation updated

## Browser Limitations to Consider

When designing features, remember these browser limitations:

1. **No File System Access**: Users must explicitly select files
2. **No Native Menus**: Use in-page UI elements
3. **Camera Requires HTTPS**: Development uses localhost, production needs SSL
4. **No Process Separation**: Everything runs in one tab
5. **Storage Limits**: localStorage has ~5-10MB limit
6. **No Native Notifications**: Use in-browser notifications
7. **Limited GPU Control**: Browser decides GPU usage

## Debug Tips

### Enable Browser DevTools

In browser mode, press F12 or right-click → Inspect

### Common Error Messages

**"require is not defined"**
- Wrapped require in `if (!isBrowserMode)` check

**"localStorage is not defined"**
- Should not happen (localStorage is standard), check browser compatibility

**"Cannot read property 'send' of null"**
- ipcRenderer not initialized, ensure shim is loaded

**"Failed to load resource: net::ERR_FILE_NOT_FOUND"**
- Check file paths are relative
- Ensure server is serving node_modules

## Performance Considerations

### Browser vs Electron

Browsers may be slower for:
- Initial model loading (no disk cache)
- File processing (security restrictions)
- Rendering (less GPU control)

Optimize by:
- Reducing model complexity
- Using lower camera resolution
- Minimizing real-time processing
- Caching loaded resources

## Contributing Guidelines

1. Always maintain dual-mode compatibility
2. Document browser limitations
3. Test on mobile devices when possible
4. Consider touch interfaces
5. Minimize dependencies
6. Use standard Web APIs when available

## Questions?

See:
- [BROWSER_MIGRATION.md](BROWSER_MIGRATION.md) - Full migration guide
- [browser/README.md](browser/README.md) - Browser version README
- Main [README.md](README.md) - Project overview

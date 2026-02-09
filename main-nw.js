/**
 *  Main Entry Point for SysMocap (NW.js version)
 *
 *  A part of SysMocap, open sourced under Mozilla Public License 2.0
 *
 *  https://github.com/xianfei/SysMocap
 *
 *  xianfei 2022.4
 */

// NW.js has Node.js integration in the same context as the DOM
// So we can access both window and require() in the same file

const path = require("path");
const fs = require("fs");
const os = require("os");

// Get NW.js window
const win = nw.Window.get();

// Make profile file on user home dir
const appDataPath = path.join(
    nw.App.dataPath || path.join(os.homedir(), 'SysMocap'),
    "profile.json"
);
const appDataDir = path.dirname(appDataPath);

if (!fs.existsSync(appDataDir)) {
    try {
        fs.mkdirSync(appDataDir, { recursive: true });
    } catch (e) {
        console.error('Failed to create app data directory:', e);
    }
}

// Global app info for NW.js
global.storagePath = { jsonPath: appDataPath };
global.appInfo = { 
    appVersion: nw.App.manifest.version || '0.7.3-nwjs',
    appName: nw.App.manifest.name || 'SysMocap NW.js'
};

// Set up window
win.on('close', function() {
    this.hide();
    // Cleanup
    if (global.webServer) {
        global.webServer.stopServer();
    }
    this.close(true);
});

// Window controls for NW.js
global.nwWindow = {
    minimize: () => win.minimize(),
    maximize: () => win.maximize(),
    unmaximize: () => win.unmaximize(),
    restore: () => win.restore(),
    isMaximized: () => win.isMaximized || false,
    close: () => win.close(),
    show: () => win.show(),
    hide: () => win.hide()
};

// Set window properties
win.title = 'SysMocap';
win.resizable = true;

// Command line arguments handling for GPU
const argv = nw.App.argv;
if (argv.includes('--force-gpu')) {
    console.log('GPU acceleration forced via command line');
}

// Initialize the app by loading the main view
console.log('[NW.js] SysMocap starting...');
console.log('[NW.js] App version:', global.appInfo.appVersion);
console.log('[NW.js] Storage path:', global.storagePath.jsonPath);

// The mainview/framework.html will be loaded automatically as the main entry point
// defined in package.json's "main" field for NW.js mode

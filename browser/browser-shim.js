/**
 * Browser Shim for SysMocap
 * 
 * Provides browser-compatible alternatives to Electron APIs
 * 
 * A part of SysMocap, open sourced under Mozilla Public License 2.0
 * https://github.com/xianfei/SysMocap
 */

// Global browser environment detection
window.isBrowserMode = true;

// Initialize browser-specific globals
window.browserShim = {
    storagePath: { jsonPath: 'sysmocap-browser-storage' },
    appInfo: { 
        appVersion: '0.7.3-browser', 
        appName: 'SysMocap Browser' 
    }
};

// Expose to iframe if needed
window.addEventListener('load', () => {
    const iframe = document.getElementById('main-frame');
    if (iframe) {
        iframe.addEventListener('load', () => {
            try {
                iframe.contentWindow.isBrowserMode = true;
                iframe.contentWindow.browserShim = window.browserShim;
            } catch (e) {
                console.warn('Could not inject browser shim into iframe:', e);
            }
        });
    }
});

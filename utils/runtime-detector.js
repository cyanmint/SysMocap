/**
 *  Runtime Detection Utility for SysMocap
 *
 *  Detects which runtime environment the app is running in:
 *  - Electron (desktop only)
 *  - NW.js (desktop & mobile)
 *  - Browser (desktop & mobile)
 *
 *  A part of SysMocap, open sourced under Mozilla Public License 2.0
 *
 *  https://github.com/xianfei/SysMocap
 */

/**
 * Detect the current runtime environment
 * @returns {Object} Runtime information
 */
function detectRuntime() {
    const result = {
        isElectron: false,
        isNwjs: false,
        isBrowser: false,
        runtime: 'unknown',
        hasNodeIntegration: false,
        platform: 'web'
    };

    // Check if we're in a browser-only environment
    if (typeof window === 'undefined') {
        result.runtime = 'node';
        result.hasNodeIntegration = true;
        return result;
    }

    // Check for NW.js
    // NW.js provides a global 'nw' object
    if (typeof nw !== 'undefined' && nw.process) {
        result.isNwjs = true;
        result.runtime = 'nwjs';
        result.hasNodeIntegration = true;
        result.platform = getNwjsPlatform();
        return result;
    }

    // Check for Electron
    // Electron has process.versions.electron
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        result.isElectron = true;
        result.runtime = 'electron';
        result.hasNodeIntegration = true;
        result.platform = getElectronPlatform();
        return result;
    }

    // Otherwise, we're in a regular browser
    result.isBrowser = true;
    result.runtime = 'browser';
    result.hasNodeIntegration = false;
    result.platform = getBrowserPlatform();
    
    return result;
}

function getNwjsPlatform() {
    if (typeof process !== 'undefined' && process.platform) {
        return process.platform;
    }
    return 'web';
}

function getElectronPlatform() {
    if (typeof process !== 'undefined' && process.platform) {
        return process.platform;
    }
    return 'web';
}

function getBrowserPlatform() {
    if (typeof navigator === 'undefined') return 'web';
    
    const ua = navigator.userAgent;
    if (ua.includes('Android')) return 'android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'ios';
    return 'web';
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS
    module.exports = { detectRuntime };
} else if (typeof window !== 'undefined') {
    // Browser global
    window.runtimeDetector = { detectRuntime };
}

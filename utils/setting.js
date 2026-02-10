/**
 *  Global Settings Utility
 *
 *  @usage import by ```const {getSettings,globalSettings,saveSettings} = require("../utils/setting.js")```
 *
 *  A part of SysMocap, open sourced under Mozilla Public License 2.0
 *
 *  https://github.com/xianfei/SysMocap
 *
 *  xianfei 2022.3
 */

// Detect if running in browser mode
const isNwjs = (function() {
    try {
        return typeof nw !== 'undefined' && nw.process;
    } catch (e) {
        return false;
    }
})();
const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron && !isNwjs;
const isBrowser = typeof window !== 'undefined' && !isNwjs && !isElectron;

let storage, remote;

if (isBrowser) {
    // Browser-compatible storage
    storage = {
        getItem: function(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                return null;
            }
        },
        setItem: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Failed to save to localStorage:', e);
            }
        }
    };
} else if (isNwjs) {
    // NW.js mode - use localStorage-like interface
    storage = {
        getItem: function(key) {
            try {
                const fs = require('fs');
                const path = require('path');
                const storagePath = global.storagePath ? global.storagePath.jsonPath : path.join(require('os').homedir(), 'SysMocap', 'profile.json');
                if (fs.existsSync(storagePath)) {
                    const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
                    return data[key] || null;
                }
                return null;
            } catch (e) {
                console.error('Failed to read from file storage:', e);
                return null;
            }
        },
        setItem: function(key, value) {
            try {
                const fs = require('fs');
                const path = require('path');
                const storagePath = global.storagePath ? global.storagePath.jsonPath : path.join(require('os').homedir(), 'SysMocap', 'profile.json');
                let data = {};
                if (fs.existsSync(storagePath)) {
                    data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
                }
                data[key] = value;
                const dir = path.dirname(storagePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');
            } catch (e) {
                console.error('Failed to save to file storage:', e);
            }
        },
        getStoragePath: function() {
            const path = require('path');
            return global.storagePath ? global.storagePath.jsonPath : path.join(require('os').homedir(), 'SysMocap', 'profile.json');
        }
    };
} else {
    // Electron mode
    storage = require("electron-localstorage");
    remote = require("@electron/remote");
    storage.setStoragePath(remote.getGlobal("storagePath").jsonPath);
}

var currentVer = 0.5;

function getSettings() {
    var settings = storage.getItem("sysmocap-global-settings");
    // load default settings when cannot read from localStroage
    if (!settings || !settings.valued || settings.ver < currentVer)
        settings = {
            ui: {
                themeColor: "indigo",
                isDark: false,
                useGlass: isBrowser ? false : true,
                language:
                    window.navigator.language.split("-")[0] == "zh"
                        ? "zh"
                        : "en",
                useNewModelUI: true,
            },
            preview: {
                showSketelonOnInput: true,
                mirroringWhenCamera: true,
                mirroringWhenVideoFile: true,
            },
            output: {
                antialias: true,
                showFPS: true,
                usePicInsteadOfColor: false,
                bgColor: "#ffffff",
                bgPicPath: "",
            },
            forward: {
                enableForwarding: false,
                port: "8080",
                useSSL: true,
                supportForWebXR: "false",
            },
            mediapipe: {
                modelComplexity: "2",
                smoothLandmarks: true,
                minDetectionConfidence: "0.7",
                minTrackingConfidence: "0.7",
                refineFaceLandmarks: true,
            },
            dev: {
                allowDevTools: false,
                openDevToolsWhenMocap: false,
            },
            performance: {
                useDgpu: false,
                GPUs: 0,
                useDescrertionProcess: isBrowser ? false : require("os").platform() == "darwin",
            },
            valued: true,
            ver: currentVer,
        };
    return settings;
}

var globalSettings = getSettings();

function getUserModels() {
    var models = storage.getItem("sysmocap-user-models");
    if (!models) models = [];
    return models;
}

var models = getUserModels();

function saveSettings(settings) {
    if (!settings) settings = globalSettings;
    storage.setItem("sysmocap-global-settings", settings);
    if (settings.performance.useDgpu) storage.setItem("useDgpu", true);
    else storage.setItem("useDgpu", false);
    if (settings.performance.useDescrertionProcess) storage.setItem("useDMoc", true);
    else storage.setItem("useDMoc", false);
    storage.setItem("used", true);
    if (settings.ui.isDark) storage.setItem("useDark", true);
    else storage.setItem("useDark", false);
}

function addUserModels(model) {
    if (!model) return;
    models.push(model);
    storage.setItem("sysmocap-user-models", models);
}

// remove from models name is same as the one to be removed
function removeUserModels(name) {
    var index = models.findIndex(function (element) {
        return element.name === name;
    });
    if (index > -1) models.splice(index, 1);
    storage.setItem("sysmocap-user-models", models);
}

module.exports = {
    getSettings: getSettings,
    globalSettings: globalSettings,
    saveSettings: saveSettings,
    getUserModels: getUserModels,
    userModels: models,
    addUserModels: addUserModels,
    removeUserModels: removeUserModels,
};

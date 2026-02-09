/**
 *  Global Settings Utility (Browser Version)
 *
 *  Browser-compatible version using localStorage instead of electron-localstorage
 *
 *  A part of SysMocap, open sourced under Mozilla Public License 2.0
 *
 *  https://github.com/xianfei/SysMocap
 *
 *  xianfei 2022.3
 */

// Browser-compatible storage wrapper
const storage = {
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

var currentVer = 0.5;

function getSettings() {
    var settings = storage.getItem("sysmocap-global-settings");
    // load default settings when cannot read from localStorage
    if (!settings || !settings.valued || settings.ver < currentVer)
        settings = {
            ui: {
                themeColor: "indigo",
                isDark: false,
                useGlass: false, // Glass effects not supported in browser
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
                useDescrertionProcess: false, // Not applicable in browser
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

// Export for browser (no module.exports)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSettings: getSettings,
        globalSettings: globalSettings,
        saveSettings: saveSettings,
        getUserModels: getUserModels,
        userModels: models,
        addUserModels: addUserModels,
        removeUserModels: removeUserModels,
    };
} else {
    // Browser global export
    window.settingUtils = {
        getSettings: getSettings,
        globalSettings: globalSettings,
        saveSettings: saveSettings,
        getUserModels: getUserModels,
        userModels: models,
        addUserModels: addUserModels,
        removeUserModels: removeUserModels,
    };
}

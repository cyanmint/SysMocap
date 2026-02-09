/**
 *  SysMocap Main GUI (display when boot finish)
 *
 *  A part of SysMocap, open sourced under Mozilla Public License 2.0
 *
 *  https://github.com/xianfei/SysMocap
 *
 *  xianfei 2022.3
 */

var ipcRenderer = null;
var remote = null;
var platform = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Android') ? 'android' : (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 'ios' : 'web')) : "web";

// Browser compatibility shim
const isBrowserMode = typeof window !== 'undefined' && (typeof process === 'undefined' || !process.versions || !process.versions.electron);

// IPC shim for browser mode
if (isBrowserMode) {
    ipcRenderer = {
        send: function(channel, ...args) {
            // Emit custom events for browser mode
            window.dispatchEvent(new CustomEvent('ipc-' + channel, { detail: args }));
        },
        on: function(channel, callback) {
            window.addEventListener('ipc-' + channel, (e) => {
                callback(e, e.detail);
            });
        }
    };
    
    remote = {
        getGlobal: function(name) {
            if (name === 'appInfo') {
                return { appVersion: '0.7.3-browser', appName: 'SysMocap Browser' };
            }
            if (name === 'storagePath') {
                return { jsonPath: 'sysmocap-browser' };
            }
            return {};
        },
        app: {
            getGPUInfo: async function() {
                // Try to get GPU info from WebGL
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                            return {
                                gpuDevice: [{
                                    description: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                                }]
                            };
                        }
                    }
                } catch (e) {
                    console.error('Failed to get GPU info:', e);
                }
                return { gpuDevice: [{ description: 'Unknown (Browser Mode)' }] };
            }
        },
        dialog: {
            showOpenDialogSync: function(options) {
                // In browser mode, we need to use file input
                console.warn('File dialog not available in browser mode. Use file input instead.');
                return null;
            }
        },
        getCurrentWindow: function() {
            return {
                isMaximized: () => false,
                restore: () => {},
                maximize: () => {},
                close: () => window.close()
            };
        },
        systemPreferences: {
            getMediaAccessStatus: () => 'granted',
            askForMediaAccess: async () => true
        },
        nativeTheme: {
            themeSource: 'system'
        }
    };
}

var mixamorig = {
    "Hips": {
        "name": "mixamorigHips",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    },
    "Neck": {
        "name": "mixamorigNeck",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    },
    "Chest": {
        "name": "mixamorigSpine2",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    },
    "Spine": {
        "name": "mixamorigSpine",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    },
    "RightUpperArm": {
        "name": "mixamorigRightArm",
        "order": "ZXY",
        "func": { "fx": "-z", "fy": "x", "fz": "-y" }
    },
    "RightLowerArm": {
        "name": "mixamorigRightForeArm",
        "order": "ZXY",
        "func": { "fx": "-z", "fy": "x", "fz": "-y" }
    },
    "LeftUpperArm": {
        "name": "mixamorigLeftArm",
        "order": "ZXY",
        "func": { "fx": "z", "fy": "-x", "fz": "-y" }
    },
    "LeftLowerArm": {
        "name": "mixamorigLeftForeArm",
        "order": "ZXY",
        "func": { "fx": "z", "fy": "-x", "fz": "-y" }
    },
    "LeftUpperLeg": {
        "name": "mixamorigLeftUpLeg",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    },
    "LeftLowerLeg": {
        "name": "mixamorigLeftLeg",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    },
    "RightUpperLeg": {
        "name": "mixamorigRightUpLeg",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    },
    "RightLowerLeg": {
        "name": "mixamorigRightLeg",
        "order": "XYZ",
        "func": { "fx": "-x", "fy": "y", "fz": "-z" }
    }
};

function domBoom(target, onfinish) {
    target.style.animation = "shake 800ms ease-in-out";
    var targetBoundingClientRectX = target.getBoundingClientRect().x;
    var targetBoundingClientRectY = target.getBoundingClientRect().y;

    var mydiv = document.createElement("div");
    mydiv.id = "newDivId";
    mydiv.style.height = window.innerHeight + "px";
    mydiv.style.width = window.innerWidth + "px";
    mydiv.style.position = "absolute";
    mydiv.style.top = "0px";
    mydiv.style.left = "0px";
    mydiv.style.zIndex = "9999";

    var targetBak = target;
    target = target.cloneNode(true);

    target.style.margin = "0";
    target.style.position = "absolute";
    target.style.top = targetBoundingClientRectY + "px";
    target.style.left = targetBoundingClientRectX + "px";
    target.style.zIndex = "9999";

    mydiv.append(target);
    mydiv.style.filter = "opacity(0)";
    document.body.appendChild(mydiv);

    setTimeout(
        () =>
            html2canvas(mydiv, { backgroundColor: null }).then(function (
                canvas
            ) {
                targetBak.style.filter = "opacity(0)";
                mydiv.remove();
                canvas.style.position = "absolute";
                canvas.style.top = "0px";
                canvas.style.left = "0px";
                canvas.style.zIndex = "9999";
                document.body.appendChild(canvas);
                var boomOption2 = {
                    // 粒子间隔
                    gap: 5,
                    // 粒子大小
                    radius: 3,
                    // 最小水平喷射速度
                    minVx: -20,
                    // 最大水平喷射速度
                    maxVx: 25,
                    // 最小垂直喷射速度
                    minVy: -25,
                    // 最大垂直喷射速度
                    maxVy: 0.1,
                    speed: 10,
                    onBoomEnd: function () {
                        targetBak.remove();
                        // targetBak.style.filter = '';
                        if (onfinish) onfinish();
                        canvas.remove();
                    },
                };
                new ParticleBoom(canvas, boomOption2);
            }),
        200
    );
}

var darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

import {
    argbFromHex,
    themeFromSourceColor,
    themeFromImage,
    sourceColorFromImage,
    applyTheme,
} from "../node_modules/@material/material-color-utilities/index.js";

function rgba2hex(rgba) {
    rgba = rgba.match(
        /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    );
    return rgba && rgba.length === 4
        ? "#" +
              ("0" + parseInt(rgba[1], 10).toString(16)).slice(-2) +
              ("0" + parseInt(rgba[2], 10).toString(16)).slice(-2) +
              ("0" + parseInt(rgba[3], 10).toString(16)).slice(-2)
        : "";
}

if (typeof require != "undefined" && !isBrowserMode) {
    // Electron mode - import electron remote
    remote = require("@electron/remote");

    ipcRenderer = require("electron").ipcRenderer;

    const { shell } = require("electron");

    platform = require("os").platform();

    // import setting utils
    const {
        getSettings,
        globalSettings,
        saveSettings,
        userModels,
        addUserModels,
        removeUserModels,
    } = require("../utils/setting.js");

    // set theme
    document.body.setAttribute(
        "class",
        "mdui-theme-layout-auto mdui-theme-primary-" +
            globalSettings.ui.themeColor +
            " mdui-theme-accent-" +
            globalSettings.ui.themeColor
    );

    var f = async () => {
        var color = window.getComputedStyle(
            document.querySelector(".mdui-color-theme"),
            null
        ).backgroundColor;
        var hex = rgba2hex(color);
        var theme = await themeFromSourceColor(argbFromHex(hex));
        applyTheme(theme, { target: document.body, dark: darkMode });
        // console.log(theme)
        ipcRenderer.send('tabChanged',window.sysmocapApp.tab,document.body.style.getPropertyValue('--md-sys-color-primary'),document.body.style.getPropertyValue('--md-sys-color-primary-container'));
    };
    f();

    // import languages
    const { languages } = require("../utils/language.js");

    // import built-in models
    var builtInModels = require("../models/models.json");

    var app = new Vue({
        el: "#vue-mount",
        data: {
            tab: "model",
            builtIn: builtInModels,
            selectModel: localStorage.getItem("selectModel")
                ? localStorage.getItem("selectModel")
                : JSON.stringify(builtInModels[0]),
            language: languages[globalSettings.ui.language],
            videoSource: "camera",
            videoPath: "",
            showModelImporter: 0,
            modelImporterName: "",
            modelImporterType: "",
            modelImporterPath: "",
            modelImporterImg: "",
            settings: globalSettings,
            appVersion: remote.getGlobal("appInfo").appVersion,
            glRenderer: "Unknown",
            platform: platform,
            userModels: JSON.parse(JSON.stringify(userModels)),
            theme: {},
            document: document,
            camera: "",
            cameras: [],
            process: process,
            checkingUpdate: false,
            hasUpdate: null,
            updateError:null,
            isLatest:false,
            disableAutoUpdate:localStorage.getItem('disableUpdate'),
            showLine: false
        },
        computed: {
            bg: function () {
                this.settings.ui.themeColor;
                var color = window.getComputedStyle(
                    document.querySelector(".mdui-color-theme"),
                    null
                ).backgroundColor;
                // console.log(color);
                return color;
            },
        },
        mounted() {
            var modelOnload = async function () {
                for (var e of document.querySelectorAll(".my-img")) {
                    if (e.src.includes("framework.html")) continue;
                    var theme = await themeFromImage(e);
                    applyTheme(theme, {
                        target: e.parentElement,
                        dark: darkMode,
                    });
                }
            };
            if (this.settings.ui.useNewModelUI) modelOnload();
            for(var e of document.querySelectorAll("div.color-dot")){
                e.style.boxShadow = e.computedStyleMap().get('background-color').toString().replace('rgb','rgba').replace(')',', 0.6) 0px 2px 6px')
            }

        },
        watch: {
            settings: {
                handler(newVal, oldVal) {
                    // save when changed
                    // console.log('settings changed')
                    document.body.setAttribute(
                        "class",
                        "mdui-theme-layout-auto mdui-theme-primary-" +
                            app.settings.ui.themeColor +
                            " mdui-theme-accent-" +
                            app.settings.ui.themeColor
                    );

                    if((remote.nativeTheme.themeSource=='dark')!==app.settings.ui.isDark){
                        remote.nativeTheme.themeSource = (!app.settings.ui.isDark)?'light':'dark';

                        var modelOnload = async function () {
                            for (var e of document.querySelectorAll(".my-img")) {
                                if (e.src.includes("framework.html")) continue;
                                var theme = await themeFromImage(e);
                                applyTheme(theme, {
                                    target: e.parentElement,
                                    dark: app.settings.ui.isDark,
                                });
                            }
                            for(var e of document.querySelectorAll("div.color-dot")){
                                e.style.boxShadow = e.computedStyleMap().get('background-color').toString().replace('rgb','rgba').replace(')',', 0.6) 0px 2px 6px')
                            }
                        };
                        setTimeout(()=>modelOnload(),500)
                        
                        
                    }

                    

                    var f = async () => {
                        var color = window.getComputedStyle(
                            document.querySelector(".mdui-text-color-theme"),
                            null
                        ).color;
                        var hex = rgba2hex(color);
                        var theme = await themeFromSourceColor(
                            argbFromHex(hex)
                        );
                        applyTheme(theme, {
                            target: document.body,
                            dark: app.settings.ui.isDark,
                        });
                        ipcRenderer.send('tabChanged',window.sysmocapApp.tab,document.body.style.getPropertyValue('--md-sys-color-primary'),document.body.style.getPropertyValue('--md-sys-color-primary-container'));
                    };
                    f();

                    saveSettings(app.settings);
                    app.language = languages[app.settings.ui.language];

                    
                },
                deep: true,
            },
            selectModel: {
                handler(newVal, oldVal) {
                    localStorage.setItem("selectModel", app.selectModel);
                },
                deep: true,
            },
            camera: (newVal, oldVal) => {
                // console.log({
                //     a: "last-choosed-camera",
                //     b: newVal,
                //     c: oldVal,
                //     d: localStorage.getItem("last-choosed-camera"),
                // });
                if (oldVal != "")
                    localStorage.setItem("last-choosed-camera", newVal);
            },
            disableAutoUpdate: (newVal, oldVal) => {
                if(newVal)localStorage.setItem('disableUpdate',true)
            },
            tab:(a,b)=>{
                ipcRenderer.send('tabChanged',window.sysmocapApp.tab,document.body.style.getPropertyValue('--md-sys-color-primary'),document.body.style.getPropertyValue('--md-sys-color-primary-container'));
            }
        },
    });

    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
        var lastChoosed = localStorage.getItem("last-choosed-camera");
        for (var mediaDevice of mediaDevices)
            if (mediaDevice.kind === "videoinput") {
                app.cameras.push({
                    id: mediaDevice.deviceId,
                    label: mediaDevice.label,
                });
            }
        if (app.cameras?.length > 0) app.camera = app.cameras[0].id;
        if (lastChoosed) {
            if (app.cameras?.find((e) => e.id == lastChoosed)) {
                app.camera = lastChoosed;
            }
        }
        app.$nextTick(() => {
            new mdui.Select("#demo-js-3");
        });
    });

    window.sysmocapApp = app;

    remote.app.getGPUInfo("complete").then((info) => {
        // console.log(info)
        app.glRenderer = info.auxAttributes.glRenderer;
    });

    document.getElementById("chooseFile").onclick = async function () {
        const result = await remote.dialog.showOpenDialogSync({
            properties: ["openFile"],
            filters: [
                {
                    name: "视频文件",
                    extensions: ["mp4", "webm"],
                },
            ],
        });
        if (result) app.videoPath = result;
    };

    // var inst = new mdui.Select("#demo-js");

    var inst2 = new mdui.Select("#demo-js-2");

    var hasInitdLight = false;

    var isRemoteInit = false;

    // mdui.alert(
    //     "该版本为早期技术预览版，有众多未完工功能。目前只支持VRM模型。Version" +
    //         app.appVersion +
    //         ", alpha, forced dgpu."
    // );

    var isMax = false;

    window.maximizeBtn = function () {
        if (remote.getCurrentWindow().isMaximized()) {
            remote.getCurrentWindow().restore();
        } else {
            remote.getCurrentWindow().maximize();
        }
    };

    var contentDom = document.querySelector("#drag-area");

    //阻止相关事件默认行为
    contentDom.ondragcenter =
        contentDom.ondragover =
        contentDom.ondragleave =
            () => {
                return false;
            };

    //对拖动释放事件进行处理
    contentDom.ondrop = (e) => {
        e.preventDefault();
        //console.log(e);
        var filePath = e.dataTransfer.files[0].path.replaceAll("\\", "/");
        // console.log(filePath);
        var strs1 = filePath.split("/");
        var name_ = strs1[strs1.length - 1];
        var name = name_.substr(0, name_.lastIndexOf("."));
        var type = name_.substr(name_.lastIndexOf(".") + 1);
        if (app.showModelImporter == 1) {
            app.modelImporterName = name;
            app.modelImporterType = type;
            app.modelImporterPath = filePath;
            app.showModelImporter++;
        } else {
            app.modelImporterImg = filePath;
        }
    };

    // find by name in app.userModels
    function findModelByName(name) {
        if (app.userModels)
            for (var i = 0; i < app.userModels.length; i++) {
                if (app.userModels[i].name == name) {
                    return app.userModels[i];
                }
            }

        for (var i = 0; i < app.builtIn.length; i++) {
            if (app.builtIn[i].name == name) {
                return app.builtIn[i];
            }
        }
        return null;
    }

    function addRightClick() {
        for (var i of document.querySelectorAll(".model-item-new.user-model")) {
            i.oncontextmenu = function (e) {
                // console.log(e.target);
                e.preventDefault();

                var target = e.target;
                while (!target.classList.contains("model-item-new")) {
                    target = target.parentElement;
                }
                const rightmenu = document.getElementById("rightmenu");
                const rightclick = document.getElementById("rightclick");
                rightmenu.style.transform = "scaleY(1)";
                rightclick.style.display = "";
                rightmenu.style.top = e.clientY + "px";
                rightmenu.style.left = e.clientX + "px";
                rightclick.onclick = function () {
                    rightmenu.style.transform = "scaleY(0)";
                    rightclick.style.display = "none";
                };
                rightclick.oncontextmenu = rightclick.onclick;
                document.getElementById("btnopen").onclick = function () {
                    e.target.click();
                    rightclick.onclick();
                };
                document.getElementById("btndefault").onclick = function () {
                    app.selectModel = JSON.stringify(
                        findModelByName(target.querySelector("h2").innerText)
                    );
                    rightclick.onclick();
                };

                for(var obj of ["btnshow","btnremove","removeline1","removeline0"])
                    document.getElementById(obj).style.display = "";

                document.getElementById("btnremove").onclick = function () {
                    var modelName = target.querySelector("h2").innerText;
                    domBoom(target);
                    setTimeout(() => {
                        removeUserModels(modelName);
                    }, 1000);
                    rightclick.onclick();
                };

                document.getElementById("btnshow").onclick = function () {
                    var path = findModelByName(
                        target.querySelector("h2").innerText
                    ).path;
                    if (platform !== "darwin")
                        shell.showItemInFolder("file://" + path);
                    else
                        shell.openExternal(
                            "file://" + path.substr(0, path.lastIndexOf("/"))
                        );
                    rightclick.onclick();
                };
            };
        }

        for (var i of document.querySelectorAll(
            ".model-item-new.buildin-model"
        )) {
            i.oncontextmenu = function (e) {
                e.preventDefault();
                var target = e.target;
                while (!target.classList.contains("model-item-new")) {
                    target = target.parentElement;
                }
                const rightmenu = document.getElementById("rightmenu");
                const rightclick = document.getElementById("rightclick");
                rightmenu.style.transform = "scaleY(1)";
                rightclick.style.display = "";
                rightmenu.style.top = e.clientY + "px";
                rightmenu.style.left = e.clientX + "px";
                rightclick.onclick = function () {
                    rightmenu.style.transform = "scaleY(0)";
                    rightclick.style.display = "none";
                };
                rightclick.oncontextmenu = rightclick.onclick;
                document.getElementById("btnopen").onclick = function () {
                    e.target.click();
                    rightclick.onclick();
                };
                for(var obj of ["btnshow","btnremove","removeline1","removeline0"])
                    document.getElementById(obj).style.display = "none";

                document.getElementById("btndefault").onclick = function () {
                    app.selectModel = JSON.stringify(
                        findModelByName(target.querySelector("h2").innerText)
                    );
                    rightclick.onclick();
                };
            };
        }
    }

    addRightClick();

    window.addUserModels = async function () {
        var model = {
            name: app.modelImporterName,
            type: app.modelImporterType,
            picBg: app.modelImporterImg,
            path: app.modelImporterPath,
            accessories: {},
            binding: app.modelImporterType == "fbx" ? mixamorig : {},
        };
        addUserModels(model);
        app.userModels.push(model);
        app.showModelImporter = 0;
        setTimeout(async () => {
            addRightClick();
            for (var e of document.querySelectorAll(".my-img")) {
                if (e.src.includes("framework.html")) continue;
                var theme = await themeFromImage(e);
                applyTheme(theme, {
                    target: e.parentElement,
                    dark: darkMode,
                });
            }
        }, 500);
    };

    mdui.mutation();
} else {
    // Browser mode initialization
    
    // Load settings from browser storage
    const getSettings = () => {
        try {
            const settings = localStorage.getItem("sysmocap-global-settings");
            return settings ? JSON.parse(settings) : null;
        } catch(e) {
            return null;
        }
    };
    
    const getUserModels = () => {
        try {
            const models = localStorage.getItem("sysmocap-user-models");
            return models ? JSON.parse(models) : [];
        } catch(e) {
            return [];
        }
    };
    
    const globalSettings = getSettings() || {
        ui: {
            themeColor: "indigo",
            isDark: false,
            useGlass: false,
            language: window.navigator.language.split("-")[0] == "zh" ? "zh" : "en",
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
            useDescrertionProcess: false,
        },
        valued: true,
        ver: 0.5,
    };
    
    const saveSettings = (settings) => {
        try {
            localStorage.setItem("sysmocap-global-settings", JSON.stringify(settings));
        } catch(e) {
            console.error('Failed to save settings:', e);
        }
    };
    
    const addUserModels = (model) => {
        const models = getUserModels();
        models.push(model);
        try {
            localStorage.setItem("sysmocap-user-models", JSON.stringify(models));
        } catch(e) {
            console.error('Failed to save user models:', e);
        }
    };
    
    const removeUserModels = (name) => {
        const models = getUserModels();
        const index = models.findIndex(e => e.name === name);
        if (index > -1) {
            models.splice(index, 1);
            try {
                localStorage.setItem("sysmocap-user-models", JSON.stringify(models));
            } catch(e) {
                console.error('Failed to remove user model:', e);
            }
        }
    };
    
    const userModels = getUserModels();
    
    // Load built-in models and languages
    let builtInModels = [];
    let languages = window.languages || {};
    
    // Load models.json via fetch
    fetch('../models/models.json')
        .then(response => response.json())
        .then(data => {
            builtInModels = data;
            initBrowserApp();
        })
        .catch(err => {
            console.error('Failed to load models:', err);
            builtInModels = [];
            initBrowserApp();
        });
    
    // Function to initialize Vue app in browser mode
    function initBrowserApp() {
        // set theme
        document.body.setAttribute(
            "class",
            "mdui-theme-layout-auto mdui-theme-primary-" +
                globalSettings.ui.themeColor +
                " mdui-theme-accent-" +
                globalSettings.ui.themeColor
        );
        
        var f = async () => {
            var color = window.getComputedStyle(
                document.querySelector(".mdui-color-theme"),
                null
            ).backgroundColor;
            var hex = rgba2hex(color);
            var theme = await themeFromSourceColor(argbFromHex(hex));
            applyTheme(theme, { target: document.body, dark: darkMode });
        };
        f();
        
        var app = new Vue({
            el: "#vue-mount",
            data: {
                tab: "model",
                builtIn: builtInModels,
                selectModel: localStorage.getItem("selectModel")
                    ? localStorage.getItem("selectModel")
                    : (builtInModels.length > 0 ? JSON.stringify(builtInModels[0]) : "{}"),
                language: languages[globalSettings.ui.language] || languages.en || {},
                videoSource: "camera",
                videoPath: "",
                showModelImporter: 0,
                modelImporterName: "",
                modelImporterType: "",
                modelImporterPath: "",
                modelImporterImg: "",
                settings: globalSettings,
                appVersion: remote.getGlobal("appInfo").appVersion,
                glRenderer: "Unknown",
                platform: platform,
                userModels: JSON.parse(JSON.stringify(userModels)),
                theme: {},
                document: document,
                camera: "",
                cameras: [],
                process: { platform: platform },
                checkingUpdate: false,
                hasUpdate: null,
                updateError: null,
                isLatest: false,
                disableAutoUpdate: localStorage.getItem('disableUpdate'),
                showLine: false
            },
            computed: {
                bg: function () {
                    this.settings.ui.themeColor;
                    var color = window.getComputedStyle(
                        document.querySelector(".mdui-color-theme"),
                        null
                    ).backgroundColor;
                    return color;
                },
            },
            mounted() {
                var modelOnload = async function () {
                    for (var e of document.querySelectorAll(".my-img")) {
                        if (e.src.includes("framework.html")) continue;
                        var theme = await themeFromImage(e);
                        applyTheme(theme, {
                            target: e.parentElement,
                            dark: darkMode,
                        });
                    }
                };
                if (this.settings.ui.useNewModelUI) modelOnload();
                for(var e of document.querySelectorAll("div.color-dot")){
                    e.style.boxShadow = e.computedStyleMap().get('background-color').toString().replace('rgb','rgba').replace(')',', 0.6) 0px 2px 6px')
                }
            },
            watch: {
                settings: {
                    handler(newVal, oldVal) {
                        document.body.setAttribute(
                            "class",
                            "mdui-theme-layout-auto mdui-theme-primary-" +
                                app.settings.ui.themeColor +
                                " mdui-theme-accent-" +
                                app.settings.ui.themeColor
                        );
                        
                        saveSettings(app.settings);
                        
                        var modelOnload = async function () {
                            for (var e of document.querySelectorAll(".my-img")) {
                                if (e.src.includes("framework.html")) continue;
                                var theme = await themeFromImage(e);
                                applyTheme(theme, {
                                    target: e.parentElement,
                                    dark: app.settings.ui.isDark,
                                });
                            }
                            for(var e of document.querySelectorAll("div.color-dot")){
                                e.style.boxShadow = e.computedStyleMap().get('background-color').toString().replace('rgb','rgba').replace(')',', 0.6) 0px 2px 6px')
                            }
                        };
                        setTimeout(()=>modelOnload(),500)
                    },
                    deep: true,
                },
                selectModel: function (val) {
                    localStorage.setItem("selectModel", val);
                    localStorage.setItem("modelInfo", val);
                },
            },
            methods: {
                saveSettings: saveSettings,
                addUserModels: addUserModels,
                removeUserModels: removeUserModels,
            },
        });
        
        window.sysmocapApp = app;
        
        // Get GPU info from WebGL
        remote.app.getGPUInfo("complete").then((info) => {
            app.glRenderer = info.gpuDevice[0].description;
        });
        
        // Browser file chooser
        document.getElementById("chooseFile").onclick = function () {
            // In browser mode, we'll use HTML5 file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/mp4,video/webm';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    app.videoPath = url;
                }
            };
            input.click();
        };
        
        // Get cameras
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            var cameras = devices.filter((e) => e.kind == "videoinput");
            app.cameras = cameras.map((e) => ({ label: e.label, id: e.deviceId }));
            
            const lastChoosed = localStorage.getItem("camera");
            if (app.cameras?.find((e) => e.id == lastChoosed)) {
                app.camera = lastChoosed;
            }
        });
        
        app.$nextTick(() => {
            new mdui.Select("#demo-js-3");
        });
        
        // Color picking function (browser equivalent)
        setTimeout(async function () {
            var themes = [];
            for (var e of document.querySelectorAll(".my-img")) {
                if (e.src.includes("framework.html")) continue;
                var theme = await themeFromImage(e);
                applyTheme(theme, {
                    target: e.parentElement,
                    dark: darkMode,
                });
            }
        }, 500);
        
        mdui.mutation();
    }
}

var isMocaping = false;

const iframeWindow = document.getElementById("foo").contentWindow;

// IPC listeners - only for Electron mode
if (ipcRenderer && !isBrowserMode) {
    ipcRenderer.on("sendRenderDataForward", (ev, data) => {
        if (iframeWindow.onMocapData) iframeWindow.onMocapData(data);
    });

    ipcRenderer.on("switch-tab", (ev, data) => {
        window.sysmocapApp.tab = data;
    });
}

window.startMocap = async function (e) {
    // Check camera permissions (Electron only)
    if (!isBrowserMode && process.platform == "darwin" && app.videoSource == "camera")
        if (
            remote.systemPreferences.getMediaAccessStatus("camera") !==
            "granted"
        ) {
            if (!(await remote.systemPreferences.askForMediaAccess("camera"))) {
                alert("需要授予摄像头使用权限");
                return;
            }
        }
    if (e.innerHTML.indexOf(app.language.tabMocap.start) != -1) {
        isMocaping = true;
        localStorage.setItem("modelInfo", app.selectModel);
        localStorage.setItem("useCamera", app.videoSource);
        localStorage.setItem("cameraId", app.camera);
        localStorage.setItem("videoFile", app.videoPath[0]);

        if (!isBrowserMode && window.sysmocapApp.settings.performance.useDescrertionProcess) {
            const win = remote.getCurrentWindow();
            const bw = win.getBrowserView();
            var winWidth = parseInt(win.getSize()[0]);
            bw.setBounds({
                x: parseInt(winWidth / 2),
                y: parseInt(
                    document.querySelector("#foo").getBoundingClientRect().y
                ),
                width: parseInt(winWidth / 2) - 20,
                height: parseInt(((winWidth - 40) * 10) / 32),
            });
            bw.webContents.loadFile("mocap/mocap.html");
            if (window.sysmocapApp.settings.dev.openDevToolsWhenMocap)
                bw.webContents.openDevTools({ mode: "detach" });
            document.getElementById("foo").src = "../render/render.html";
        } else {
            document.getElementById("foo").src = "../mocaprender/render.html";
        }

        e.innerHTML =
            '<i class="mdui-icon material-icons">stop</i>' +
            app.language.tabMocap.stop;
    } else {
        isMocaping = false;
        if (!isBrowserMode && window.sysmocapApp.settings.performance.useDescrertionProcess) {
            const win = remote.getCurrentWindow();
            const bw = win.getBrowserView();
            bw.setBounds({ x: 0, y: 0, width: 0, height: 0 });
            bw.webContents.loadURL("about:blank");
        }
        document.getElementById("foo").src = "about:blank";

        if (!isBrowserMode && window.sysmocapApp.settings.forward.enableForwarding)
            ipcRenderer.send("stopWebServer");

        e.innerHTML =
            '<i class="mdui-icon material-icons">play_arrow</i>' +
            app.language.tabMocap.start;
    }
};

if (!isBrowserMode && window.sysmocapApp.settings.performance.useDescrertionProcess)
    window.addEventListener(
        "resize",
        function () {
            if (!isMocaping) return;
            const win = remote.getCurrentWindow();
            const bw = win.getBrowserView();
            var winWidth = parseInt(win.getSize()[0]);
            bw.setBounds({
                x: parseInt(winWidth / 2),
                y: parseInt(
                    document.querySelector("#foo").getBoundingClientRect().y
                ),
                width: parseInt(winWidth / 2) - 20,
                height: parseInt(((winWidth - 40) * 10) / 32),
            });
        },
        false
    );

// require modules - Electron only
if (!isBrowserMode) {
    const versionCheck = require("github-version-checker");
    
    window.checkUpdate = () => {
        if (window.sysmocapApp.checkingUpdate || window.sysmocapApp.isLatest) return;
        window.sysmocapApp.checkingUpdate = true;

        // version check options (for details see below)
        const options = {
            repo: 'SysMocap',                    // repository name
            owner: 'xianfei',                               // repository owner
            currentVersion: 'v' + window.sysmocapApp.appVersion,                       // your app's current version
        };
        
        versionCheck(options, function (error, update) { // callback function
            window.sysmocapApp.updateError = null
            if (error) {
                window.sysmocapApp.updateError = error
                window.sysmocapApp.checkingUpdate = false
                return
            }
            if (update) { // print some update info if an update is available
                console.log('An update is available! ' + update.name);
                window.sysmocapApp.hasUpdate = update
            } else {
                window.sysmocapApp.isLatest = true
            }

            window.sysmocapApp.checkingUpdate = false
            // start your app
            // console.log('Check update finish');
            //...
        });
    };

    window.openInGithub = () =>
        remote.shell.openExternal("https://github.com/xianfei/SysMocap/releases");
    window.openInIEEE = () =>
        remote.shell.openExternal("https://ieeexplore.ieee.org/document/9974484");

    if(!window.sysmocapApp.disableAutoUpdate) window.checkUpdate()
} else {
    // Browser mode - use window.open
    window.openInGithub = () =>
        window.open("https://github.com/xianfei/SysMocap/releases", "_blank");
    window.openInIEEE = () =>
        window.open("https://ieeexplore.ieee.org/document/9974484", "_blank");
}

window.addEventListener('scroll',function(e){
    if(window.pageYOffset > 10){
        window.sysmocapApp.showLine = true
    }else{
        window.sysmocapApp.showLine = false
    }
  })
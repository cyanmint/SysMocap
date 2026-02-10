/**
 *  Video-based Motion Capture and 3D Model Render Part
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
const isBrowserMode = typeof window !== 'undefined' && !isNwjs && !isElectron;

let globalSettings, ipcRenderer;

if (isBrowserMode) {
    // Browser mode - use browser-compatible settings
    if (typeof window.settingUtils !== 'undefined') {
        globalSettings = window.settingUtils.globalSettings;
    } else {
        // Fallback settings for browser
        globalSettings = {
            forward: {
                enableForwarding: false,
                port: "8080",
                supportForWebXR: "false"
            }
        };
    }
    
    // Browser IPC shim
    ipcRenderer = {
        send: function(channel, ...args) {
            window.dispatchEvent(new CustomEvent('ipc-' + channel, { detail: args }));
        },
        on: function(channel, callback) {
            window.addEventListener('ipc-' + channel, (e) => {
                callback(e, e.detail);
            });
        }
    };
} else if (isNwjs) {
    // NW.js mode - import setting utils and use shim
    const settingUtils = require("../utils/setting.js");
    globalSettings = settingUtils.globalSettings;
    
    // NW.js IPC shim
    ipcRenderer = {
        send: function(channel, ...args) {
            window.dispatchEvent(new CustomEvent('ipc-' + channel, { detail: args }));
        },
        on: function(channel, callback) {
            window.addEventListener('ipc-' + channel, (e) => {
                callback(e, e.detail);
            });
        }
    };
} else {
    // Electron mode - import setting utils
    const settingUtils = require("../utils/setting.js");
    globalSettings = settingUtils.globalSettings;
    
    // import mocap web server
    ipcRenderer = require("electron").ipcRenderer;
}

// Whether mediapipe ready
var started = false;

var modelObj = JSON.parse(localStorage.getItem("modelInfo"));
var modelPath = modelObj.path;


var fileType = modelPath
    .substring(modelPath.lastIndexOf(".") + 1)
    .toLowerCase();


// init server
if (globalSettings.forward.enableForwarding)
    ipcRenderer.send(
        "startWebServer",
        parseInt(globalSettings.forward.port),
        JSON.stringify(modelObj),
        globalSettings.forward.supportForWebXR
    );


/* VRM Character Animator */
const animateVRM = (vrm, results) => {
    // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
    let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

    const faceLandmarks = results.faceLandmarks;
    // Pose 3D Landmarks are with respect to Hip distance in meters
    const pose3DLandmarks = results.za;
    // Pose 2D landmarks are with respect to videoWidth and videoHeight
    const pose2DLandmarks = results.poseLandmarks;
    // Be careful, hand landmarks may be reversed
    const leftHandLandmarks = results.rightHandLandmarks;
    const rightHandLandmarks = results.leftHandLandmarks;

    if (faceLandmarks) {
        riggedFace = Kalidokit.Face.solve(faceLandmarks, {
            runtime: "mediapipe",
            video: videoElement,
        });
    }

    if (pose2DLandmarks && pose3DLandmarks) {
        riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
            runtime: "mediapipe",
            video: videoElement,
        });
    }

    if (leftHandLandmarks) {
        riggedLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, "Left");
    }

    if (rightHandLandmarks && fileType == "vrm") {
        riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, "Right");
    }

    if (globalSettings.forward.enableForwarding)
        ipcRenderer.send(
            "sendBoradcastNew",
            {
                type: "xf-sysmocap-data",
                riggedPose: riggedPose,
                riggedLeftHand: riggedLeftHand,
                riggedRightHand: riggedRightHand,
                riggedFace: riggedFace,
            }
        );
        else ipcRenderer.send(
            "sendRenderData",
            {
                type: "xf-sysmocap-data",
                riggedPose: riggedPose,
                riggedLeftHand: riggedLeftHand,
                riggedRightHand: riggedRightHand,
                riggedFace: riggedFace,
            }
        );

};

let videoElement = document.querySelector(".input_video"),
    guideCanvas = document.querySelector("canvas.guides");

const onResults = (results) => {
    // Draw landmark guides
    if (globalSettings.preview.showSketelonOnInput) drawResults(results);
    // Animate model
    animateVRM(null, results);
    if (!started) {
        if (localStorage.getItem("useCamera") == "file") videoElement.play();
        started = true;
    }
};

const holistic = new Holistic({
    locateFile: (file) => {
        if (typeof require != "undefined")
            return __dirname + `/../node_modules/@mediapipe/holistic/${file}`;
        else return `../node_modules/@mediapipe/holistic/${file}`;
    },
});

holistic.setOptions({
    modelComplexity: parseInt(globalSettings.mediapipe.modelComplexity),
    smoothLandmarks: globalSettings.mediapipe.smoothLandmarks,
    minDetectionConfidence: parseFloat(
        globalSettings.mediapipe.minDetectionConfidence
    ),
    minTrackingConfidence: parseFloat(
        globalSettings.mediapipe.minTrackingConfidence
    ),
    refineFaceLandmarks: globalSettings.mediapipe.refineFaceLandmarks,
});
// Pass holistic a callback function
holistic.onResults(onResults);

const drawResults = (results) => {
    // Set canvas internal dimensions to match its displayed size to prevent stretching
    // Use offsetWidth/offsetHeight to get the CSS-rendered size
    const displayWidth = guideCanvas.offsetWidth;
    const displayHeight = guideCanvas.offsetHeight;
    
    // Only update canvas dimensions if they changed (to avoid unnecessary redraws)
    if (guideCanvas.width !== displayWidth || guideCanvas.height !== displayHeight) {
        guideCanvas.width = displayWidth;
        guideCanvas.height = displayHeight;
    }
    
    let canvasCtx = guideCanvas.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    // Use `Mediapipe` drawing functions
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00cff7",
        lineWidth: 4,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#ff0364",
        lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
        color: "#C0C0C070",
        lineWidth: 1,
    });
    if (results.faceLandmarks && results.faceLandmarks.length === 478) {
        //draw pupils
        drawLandmarks(
            canvasCtx,
            [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
            {
                color: "#ffe603",
                lineWidth: 2,
            }
        );
    }
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
        color: "#eb1064",
        lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
        color: "#00cff7",
        lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
        color: "#22c3e3",
        lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
        color: "#ff0364",
        lineWidth: 2,
    });
};

// switch use camera or video file
if (localStorage.getItem("useCamera") == "camera") {
    // Get camera constraints - allow mobile cameras to use their native resolution
    const cameraId = localStorage.getItem("cameraId");
    const videoConstraints = cameraId 
        ? { deviceId: cameraId } 
        : { facingMode: 'user' }; // Default to front camera on mobile
    
    navigator.mediaDevices
        .getUserMedia({ video: videoConstraints })
        .then(function (stream) {
            videoElement.srcObject = stream;
            videoElement.play();
            var videoFrameCallback = async () => {
                // videoElement.pause()
                await holistic.send({ image: videoElement });
                videoElement.requestVideoFrameCallback(videoFrameCallback);
                // videoElement.play()
            };

            videoElement.requestVideoFrameCallback(videoFrameCallback);
        })
        .catch(function (err0r) {
            alert(err0r);
        });
} else {
    // path of video file
    videoElement.src = localStorage.getItem("videoFile");
    videoElement.loop = true;
    videoElement.controls = true;

    videoElement.style.transform = "";
    guideCanvas.style.transform = "";

    var videoFrameCallback = async () => {
        // videoElement.pause()
        await holistic.send({ image: videoElement });
        videoElement.requestVideoFrameCallback(videoFrameCallback);
        // videoElement.play()
    };

    videoElement.requestVideoFrameCallback(videoFrameCallback);
}
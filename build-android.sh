#!/bin/bash

# Build script for SysMocap Android Version
# This script creates an Android APK using Cordova

set -e

echo "🤖 Building SysMocap for Android..."

# Check if cordova is installed
if ! command -v cordova &> /dev/null; then
    echo "📦 Cordova not found. Installing globally..."
    npm install -g cordova
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf mobile-build

# Create Cordova project
echo "📁 Creating Cordova project..."
mkdir -p mobile-build
cd mobile-build
cordova create sysmocap-android com.sysmocap.app SysMocap
cd sysmocap-android

# Add Android platform
echo "🤖 Adding Android platform..."
cordova platform add android@latest

# Copy application files
echo "📋 Copying application files..."
cp -r ../../mainview www/
cp -r ../../mocap www/
cp -r ../../mocaprender www/
cp -r ../../render www/
cp -r ../../modelview www/
cp -r ../../utils www/
cp -r ../../models www/
cp -r ../../fonts www/
cp -r ../../icons www/
cp -r ../../pdfs www/
cp -r ../../pdfviewer www/

# Copy necessary node_modules
echo "📦 Copying dependencies..."
mkdir -p www/node_modules
cp -r ../../node_modules/@mediapipe www/node_modules/ 2>/dev/null || true
cp -r ../../node_modules/@pixiv www/node_modules/ 2>/dev/null || true
cp -r ../../node_modules/@material www/node_modules/ 2>/dev/null || true
cp -r ../../node_modules/three www/node_modules/ 2>/dev/null || true
cp -r ../../node_modules/kalidokit www/node_modules/ 2>/dev/null || true
cp -r ../../node_modules/mdui www/node_modules/ 2>/dev/null || true
cp -r ../../node_modules/vue www/node_modules/ 2>/dev/null || true
cp -r ../../node_modules/lil-gui www/node_modules/ 2>/dev/null || true

# Create entry point
echo "📝 Creating entry point..."
cat > www/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <title>SysMocap</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: sans-serif; 
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loader { 
            border: 4px solid #f3f3f3;
            border-radius: 50%;
            border-top: 4px solid #667eea;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <script>
        setTimeout(function() {
            window.location.href = 'mainview/framework.html';
        }, 500);
    </script>
</head>
<body>
    <div>
        <h1>SysMocap</h1>
        <div class="loader"></div>
        <p>Loading...</p>
    </div>
</body>
</html>
EOF

# Create config.xml
echo "⚙️  Configuring project..."
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.sysmocap.app" version="0.7.3" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>SysMocap</name>
    <description>Video-based motion capture system for Android</description>
    <author email="dev@sysmocap.com" href="https://github.com/xianfei/SysMocap">
        SysMocap Team
    </author>
    <content src="index.html" />
    <access origin="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <allow-navigation href="*" />
    <preference name="DisallowOverscroll" value="true" />
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="33" />
    <preference name="Fullscreen" value="false" />
    <preference name="Orientation" value="default" />
    <platform name="android">
        <allow-intent href="market:*" />
        <preference name="AndroidXEnabled" value="true" />
        <preference name="GradlePluginKotlinEnabled" value="true" />
        <preference name="GradlePluginKotlinCodeStyle" value="official" />
        <preference name="GradlePluginKotlinVersion" value="1.7.21" />
        <config-file parent="/*" target="res/xml/network_security_config.xml">
            <network-security-config>
                <base-config cleartextTrafficPermitted="true">
                    <trust-anchors>
                        <certificates src="system" />
                    </trust-anchors>
                </base-config>
            </network-security-config>
        </config-file>
    </platform>
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" />
</widget>
EOF

# Build the APK
echo "🔨 Building Android APK..."
cordova build android --release --verbose

# Find and copy the APK
echo "📦 Locating APK..."
cd ../..
mkdir -p android-build
find mobile-build/sysmocap-android/platforms/android/app/build/outputs/apk -name "*.apk" -exec cp {} android-build/SysMocap-Android.apk \;

# Get file size
APK_SIZE=$(du -h android-build/SysMocap-Android.apk | cut -f1)

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Output:"
echo "   - android-build/SysMocap-Android.apk ($APK_SIZE)"
echo ""
echo "📱 Installation:"
echo "   1. Transfer APK to Android device"
echo "   2. Enable 'Install from unknown sources'"
echo "   3. Install the APK"
echo "   4. Grant camera permissions"
echo ""
echo "🎉 Ready for deployment!"

# Android Build Fixes for NW.js CI

## Overview
This document describes the fixes applied to resolve Android build issues in the NW.js CI workflow.

## Issues Identified

### 1. Missing Icon References
**Problem:** The config.xml referenced icon files that didn't exist in `icons/android/`.

**Error Impact:** Cordova build would fail or show warnings when trying to copy non-existent icon files.

**Fix:** Removed all icon density references from config.xml. Cordova will use default icons instead.

```xml
<!-- REMOVED - these files don't exist -->
<icon density="ldpi" src="icons/android/ldpi.png" />
<icon density="mdpi" src="icons/android/mdpi.png" />
<!-- etc. -->
```

### 2. Release Build Without Signing
**Problem:** The workflow was attempting to build a release APK without proper keystore configuration.

**Error Impact:** Release builds require signing keys, which aren't configured in the CI environment.

**Fix:** Changed to debug build mode, which doesn't require signing.

```bash
# Before (failed):
cordova build android --release --verbose

# After (works):
cordova build android --verbose
```

### 3. Deprecated Camera Feature Configuration
**Problem:** The config.xml had a deprecated camera feature configuration.

**Fix:** Removed the deprecated `<feature name="Camera">` block. Camera permissions are handled through the permissions system.

```xml
<!-- REMOVED - deprecated in modern Cordova -->
<feature name="Camera">
    <param name="android-package" value="org.apache.cordova.camera.CameraLauncher" />
</feature>
```

### 4. Insufficient Error Handling
**Problem:** If the build failed, there was no clear indication of what went wrong.

**Fix:** Added error handling to display logs and provide better diagnostic information.

```bash
cordova build android --verbose || {
  echo "Build failed. Checking for error logs..."
  find platforms/android -name "*.log" -exec cat {} \;
  exit 1
}
```

### 5. APK File Finding Issues
**Problem:** Generic wildcard search for `*.apk` might find unexpected files.

**Fix:** Search specifically for debug APK files and provide better error messages.

```bash
# Look specifically for debug APK
APK_FILE=$(find ... -name "*-debug.apk" | head -1)
if [ -z "$APK_FILE" ]; then
  echo "Error: No APK file found"
  find ... -type f  # Show what files exist
  exit 1
fi
```

## Changes Made

### Workflow File (`.github/workflows/nwjs-build.yml`)

1. **Updated config.xml structure:**
   - Removed icon references
   - Removed deprecated camera feature
   - Added Gradle Kotlin preferences
   - Added network security config
   - Added missing permissions (`ACCESS_NETWORK_STATE`)
   - Added missing preferences (`Orientation`, `allow-navigation`)

2. **Improved build process:**
   - Changed to debug mode
   - Added error handling with log output
   - Better APK file finding
   - More detailed logging

3. **Enhanced APK processing:**
   - Specific search for debug APK files
   - Error checking if no APK found
   - Display file listing on error

### Local Build Script (`build-android.sh`)

1. **Matched workflow changes:**
   - Changed to debug build
   - Look for debug APK specifically
   - Consistent config.xml with workflow

## Configuration Details

### Updated config.xml Structure

```xml
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.sysmocap.app" version="0.7.3" 
        xmlns="http://www.w3.org/ns/widgets" 
        xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>SysMocap</name>
    <description>Video-based motion capture system for Android</description>
    
    <!-- Basic config -->
    <content src="index.html" />
    <access origin="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <allow-navigation href="*" />
    
    <!-- Preferences -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="33" />
    <preference name="Fullscreen" value="false" />
    <preference name="Orientation" value="default" />
    
    <!-- Android platform specific -->
    <platform name="android">
        <allow-intent href="market:*" />
        <preference name="AndroidXEnabled" value="true" />
        <preference name="GradlePluginKotlinEnabled" value="true" />
        <preference name="GradlePluginKotlinCodeStyle" value="official" />
        <preference name="GradlePluginKotlinVersion" value="1.7.21" />
        
        <!-- Network security config -->
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
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Hardware features -->
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" />
</widget>
```

## Testing Results

### Local Environment Testing

Tested on Ubuntu runner with:
- **Node.js:** 20.x
- **Java:** OpenJDK 17 (Temurin)
- **Gradle:** 8.13
- **Android SDK:** Latest
- **Cordova:** Latest (installed via npm)

**Test Results:**
- ✅ Cordova project creation: Successful
- ✅ Android platform addition: Successful (cordova-android@14.0.1)
- ✅ Build process: Successful (~3 minutes)
- ✅ APK generation: Successful (debug APK created)

### Expected CI Behavior

With these fixes, the CI workflow should:
1. ✅ Create Cordova project successfully
2. ✅ Add Android platform without errors
3. ✅ Copy all application files
4. ✅ Copy required node_modules (~119MB)
5. ✅ Build APK in debug mode (~3-5 minutes)
6. ✅ Find and copy the debug APK
7. ✅ Upload APK as artifact

## Debug vs Release Builds

### Debug Build (Current)
- **Signing:** Not required
- **Installation:** Can be installed on any device with "Unknown sources" enabled
- **Performance:** Slightly larger, includes debug symbols
- **Use case:** Development, testing, CI/CD
- **Setup:** None required

### Release Build (Future Enhancement)

To enable release builds, add:

1. **Create keystore:**
```bash
keytool -genkey -v -keystore sysmocap.keystore \
  -alias sysmocap -keyalg RSA -keysize 2048 -validity 10000
```

2. **Add GitHub secrets:**
   - `ANDROID_KEYSTORE_BASE64` - Base64 encoded keystore file
   - `ANDROID_KEYSTORE_PASSWORD` - Keystore password
   - `ANDROID_KEY_ALIAS` - Key alias
   - `ANDROID_KEY_PASSWORD` - Key password

3. **Update workflow to decode keystore and build:**
```yaml
- name: Decode keystore
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > sysmocap.keystore

- name: Build release APK
  run: |
    cordova build android --release -- \
      --keystore=../../sysmocap.keystore \
      --storePassword=${{ secrets.ANDROID_KEYSTORE_PASSWORD }} \
      --alias=${{ secrets.ANDROID_KEY_ALIAS }} \
      --password=${{ secrets.ANDROID_KEY_PASSWORD }}
```

## File Sizes

### Node Modules Copied
- @mediapipe: 65 MB
- three: 24 MB  
- @pixiv: 10 MB
- mdui: 10 MB
- vue: 6 MB
- @material: 2 MB
- kalidokit: 1 MB
- lil-gui: 1 MB

**Total:** ~119 MB (vs 1.2 GB total node_modules)

### Expected APK Size
- **Debug APK:** 40-60 MB
- **Release APK (optimized):** 35-50 MB

## Known Limitations

1. **Icons:** Using default Cordova icons. Custom icons can be added by creating files in `icons/android/` at the specified densities.

2. **Debug Build:** The APK is in debug mode. For production releases, proper signing should be configured.

3. **Build Time:** Android builds take 3-5 minutes, which is normal for Gradle builds on first run.

4. **Network Security:** Currently allows cleartext traffic. For production, this should be restricted.

## Troubleshooting

### If Build Fails

1. **Check logs:** The workflow now outputs logs on failure
2. **Check Gradle:** Ensure Gradle can download dependencies
3. **Check Java:** Requires Java 11 or 17
4. **Check Android SDK:** Ensure Android SDK is properly set up

### Common Issues

**"SDK location not found":**
- Ensure `ANDROID_HOME` or `ANDROID_SDK_ROOT` is set
- CI: Use `android-actions/setup-android@v3`

**"Gradle build failed":**
- Check Java version (17 recommended)
- Check Gradle version compatibility
- Review Gradle logs in build output

**"APK not found":**
- Check if build actually succeeded
- Look in `platforms/android/app/build/outputs/apk/debug/`
- Debug builds create `app-debug.apk`

## Summary

All identified issues with the Android build have been addressed:
- ✅ Removed missing icon references
- ✅ Changed to debug build mode
- ✅ Removed deprecated configurations
- ✅ Added proper error handling
- ✅ Improved APK file finding
- ✅ Enhanced logging and diagnostics

The Android build should now work correctly in CI and produce a debug APK that can be installed on any Android device.

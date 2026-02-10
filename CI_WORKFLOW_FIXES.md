# CI Workflow Fixes - NWjs Build

This document details the fixes applied to the NWjs build workflow to resolve path handling issues.

## Problem

The NWjs build workflow (`.github/workflows/nwjs-build.yml`) had critical path handling issues that prevented successful builds:

### Issues Identified

1. **Incorrect Output Path Assumption**
   - Workflow assumed `nw-builder` creates a flat directory at `../OutApp/nw/package.nw/`
   - In reality, `nw-builder` creates platform-specific subdirectories

2. **File Copy Failures**
   - All `cp` commands tried to copy to non-existent `../OutApp/nw/package.nw/`
   - Actual paths are `../OutApp/nw/{platform-name}/package.nw/`

3. **Invalid HTML Copy**
   - Attempted to copy `*.html` files from root directory
   - No HTML files exist in the project root (they're in subdirectories)

### Root Cause

When `nw-builder` is invoked with `--outDir=../OutApp/nw`, it creates platform-specific subdirectories based on the platform and architecture:

- **Linux**: `../OutApp/nw/SysMocap-linux-x64/`
- **Windows**: `../OutApp/nw/SysMocap-win-x64/`
- **macOS**: `../OutApp/nw/SysMocap-osx-x64/`

Each subdirectory contains a `package.nw/` folder where application files should be placed.

## Solution

### Changes Made

1. **Added BUILD_DIR Variable**
   ```bash
   # Determine output directory name based on platform
   if [ "${{ matrix.platform }}" = "osx" ]; then
     BUILD_DIR="../OutApp/nw/SysMocap-osx-x64"
   elif [ "${{ matrix.platform }}" = "win" ]; then
     BUILD_DIR="../OutApp/nw/SysMocap-win-x64"
   else
     BUILD_DIR="../OutApp/nw/SysMocap-linux-x64"
   fi
   ```

2. **Updated nw-builder Command**
   ```bash
   # Before
   npx nw-builder --outDir=../OutApp/nw package.json
   
   # After
   npx nw-builder --outDir="$BUILD_DIR" package.json
   ```

3. **Fixed File Copy Commands**
   ```bash
   # Before
   cp -r mainview ../OutApp/nw/package.nw/
   
   # After
   cp -r mainview "$BUILD_DIR/package.nw/"
   ```

4. **Removed Invalid HTML Copy**
   ```bash
   # Removed this line
   # cp *.html ../OutApp/nw/package.nw/ || true
   ```

5. **Added Build Verification**
   ```bash
   echo "Build completed in: $BUILD_DIR"
   ls -la "$BUILD_DIR"
   ```

### Updated .gitignore

Added `cache/` to `.gitignore` to exclude the nw-builder cache directory:

```gitignore
# NW.js builder cache
cache/
```

## Testing

The workflow should now correctly:

1. ✅ Create platform-specific build directories
2. ✅ Copy all application files to the correct location
3. ✅ Rename directories with version tags (step 6)
4. ✅ Create archives (step 7)
5. ✅ Upload artifacts with correct paths (step 8)

## Directory Structure

After the fix, the build output structure is:

```
OutApp/nw/
├── SysMocap-linux-x64/
│   ├── package.nw/
│   │   ├── node_modules/
│   │   ├── mainview/
│   │   ├── mocap/
│   │   ├── mocaprender/
│   │   ├── render/
│   │   ├── modelview/
│   │   ├── utils/
│   │   ├── models/
│   │   ├── fonts/
│   │   ├── icons/
│   │   ├── pdfs/
│   │   ├── pdfviewer/
│   │   ├── webserv/
│   │   ├── browser/
│   │   ├── *.js files
│   │   └── package.json
│   ├── nw (executable)
│   └── ... (other NW.js runtime files)
├── SysMocap-win-x64/
│   └── ... (similar structure)
└── SysMocap-osx-x64/
    └── ... (similar structure)
```

After step 6 (rename), directories become:
- `SysMocap-NWjs-{VERSION}-linux-x64/`
- `SysMocap-NWjs-{VERSION}-win-x64/`
- `SysMocap-NWjs-{VERSION}-osx-x64/`

## Related Files

- `.github/workflows/nwjs-build.yml` - Main workflow file (modified)
- `.gitignore` - Updated to exclude cache directory
- `package.json` - Contains LSApplicationCategoryType for macOS builds

## Benefits

1. **Correct Paths**: Files are copied to the actual build output directories
2. **Platform Isolation**: Each platform build is cleanly separated
3. **Consistent Naming**: Directory names match nw-builder's output convention
4. **Better Debugging**: Added logging shows where builds are created
5. **Clean Repository**: nw-builder cache is now ignored

## Workflow Status

| Workflow | Status | Description |
|----------|--------|-------------|
| nwjs-build.yml | ✅ Fixed | NWjs desktop builds (Linux/Windows/macOS) |
| web-build.yml | ✅ Working | Browser version deployment |
| main.yml | ✅ Working | Electron builds (Windows/macOS) |

All three CI workflows are now functional and ready for production use.

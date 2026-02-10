# NWjs Windows Build Fix - Missing Icon File

## Issue Summary

The NWjs Windows build was failing with an ENOENT error because the required icon file `icons/sysmocap.png` was missing.

## Error Details

```
Error: ENOENT: no such file or directory, open 'D:\a\SysMocap\SysMocap\icons\sysmocap.png'
    at async setWinConfig (file:///D:/a/SysMocap/SysMocap/node_modules/nw-builder/src/bld.js:318:24)
    at async bld (file:///D:/a/SysMocap/SysMocap/node_modules/nw-builder/src/bld.js:186:5)
    at async nwbuild (file:///D:/a/SysMocap/SysMocap/node_modules/nw-builder/src/index.js:131:7)
```

## Root Cause

The `package.json` file references an icon file that didn't exist:

**package.json (line 9):**
```json
"icon": "icons/sysmocap.png"
```

**Actual files in icons/ directory:**
- ✓ `icons/sysmocap-icon.png` (678,382 bytes)
- ✓ `icons/sysmocap-icon-ikun.png` (736,440 bytes)
- ✓ `icons/sysmocap.ico` (355,359 bytes) - Windows icon
- ✓ `icons/sysmocap.icns` (1,557,621 bytes) - macOS icon
- ✗ `icons/sysmocap.png` - **MISSING**

The NWjs builder (`nw-builder`) specifically looks for the file referenced in package.json's `window.icon` property when building for Windows.

## Solution

Created the missing `icons/sysmocap.png` file by copying from the existing `icons/sysmocap-icon.png`:

```bash
cp icons/sysmocap-icon.png icons/sysmocap.png
```

## Changes Made

### File Added
- **`icons/sysmocap.png`** - PNG icon file (678,382 bytes)
  - Copied from `icons/sysmocap-icon.png`
  - Required by nw-builder for Windows packages
  - Referenced by package.json window.icon property

### Commit
- **Hash:** `8f235ca`
- **Message:** "Add missing icons/sysmocap.png for NWjs builds"
- **Status:** Committed and pushed to origin

## Why This Fix Works

1. **nw-builder reads package.json** to get the icon path
2. **Windows builds specifically** need the icon file for:
   - Application window icon
   - Taskbar icon
   - Executable icon configuration
3. **The file must exist** before nw-builder starts processing
4. **Creating the file** allows nw-builder to continue with the build process

## Verification

```bash
# File exists
✓ icons/sysmocap.png present
✓ Size: 678,382 bytes
✓ Matches sysmocap-icon.png

# Committed
✓ File tracked in Git
✓ Pushed to remote repository
```

## Expected Outcome

The Windows NWjs build will now:
1. ✅ Find `icons/sysmocap.png` when nw-builder looks for it
2. ✅ Complete the build process without ENOENT errors
3. ✅ Continue to the file copy step
4. ✅ Successfully create Windows NWjs packages

## Impact

This fix enables:
- **Windows desktop builds** to succeed via nw-builder
- **CI/CD pipeline** to complete for Windows platform
- **Automated releases** to include Windows NWjs packages

## Related Files

- `package.json` - Contains the icon reference
- `icons/sysmocap-icon.png` - Source file for the icon
- `icons/sysmocap.png` - Newly created file (this fix)
- `.github/workflows/nwjs-build.yml` - Build workflow that was failing

## Notes

- The icon file is required only during the build process
- The same PNG file works for NWjs window icon display
- Other platforms (Linux, macOS) have their own icon formats (.ico, .icns)
- This is a minimal fix - the file could alternatively be renamed or the package.json could be updated to reference the existing file

## Previous Related Fixes

This builds on previous workflow fixes:
- `d63b3b2` - Fix NWjs build workflow path handling
- `a0579f0` - Add debugging and error handling to NWjs workflow

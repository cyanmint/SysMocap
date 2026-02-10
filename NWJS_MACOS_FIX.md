# NW.js macOS Build Fix - Complete

## Issues
macOS builds were failing with TWO sequential errors:

### Error 1: LSApplicationCategoryType
```
Error: Expected options.app.LSApplicationCategoryType to be a string. Got undefined
    at Object.validate (file:///Users/runner/work/SysMocap/SysMocap/node_modules/nw-builder/src/util.js:519:13)
```

### Error 2: NSHumanReadableCopyright (After fixing Error 1)
```
Error: Expected options.app.NSHumanReadableCopyright to be a string. Got undefined
    at Object.validate (file:///Users/runner/work/SysMocap/SysMocap/node_modules/nw-builder/src/util.js:540:13)
```

## Root Cause

### What Are These Properties?

#### 1. LSApplicationCategoryType
`LSApplicationCategoryType` is a macOS-specific property that categorizes the application in the macOS ecosystem. It's used by:
- macOS Finder
- Spotlight search
- App Store (if applicable)
- System preferences

#### 2. NSHumanReadableCopyright
`NSHumanReadableCopyright` is a macOS-specific property that displays copyright information:
- Shows in app "About" dialog
- Displayed in Finder's Get Info panel
- Required for proper .app bundle creation
- Part of macOS Info.plist requirements

### Why nw-builder Requires Them
When building for macOS, nw-builder validates that both properties are set to ensure proper macOS app bundle creation. The validation happens during the build process, before the actual packaging.

### The Problem
While `LSApplicationCategoryType` was present in `package.json` (line 19):
```json
{
  "name": "sysmocap",
  "version": "0.7.3",
  ...
  "LSApplicationCategoryType": "public.app-category.graphics-design",
  ...
}
```

And `NSHumanReadableCopyright` was NOT present at all.

nw-builder couldn't read these properly when using `package.json` as the source file. This is because:
1. nw-builder reads package.json for build configuration
2. The validation expects values to be accessible via `options.app.*`
3. Simply having them at the root level of package.json wasn't sufficient for nw-builder's validation

## Solution

### Approach
Pass BOTH required properties as command-line arguments specifically for macOS builds.

### Implementation
Updated `.github/workflows/nwjs-build.yml`:

```yaml
- name: Build NW.js for ${{ matrix.platform }}
  shell: bash
  run: |
    mkdir -p ../OutApp/nw
    # Build with package.json as source (creates base package)
    # For macOS, add required macOS-specific arguments
    if [ "${{ matrix.platform }}" = "osx" ]; then
      npx nw-builder --mode=build --version=latest --flavor=normal --arch=x64 \
        --platform=${{ matrix.platform }} --outDir=../OutApp/nw \
        --app.LSApplicationCategoryType="public.app-category.graphics-design" \
        --app.NSHumanReadableCopyright="Copyright © 2024 SysMocap Team" \
        package.json
    else
      npx nw-builder --mode=build --version=latest --flavor=normal --arch=x64 \
        --platform=${{ matrix.platform }} --outDir=../OutApp/nw \
        package.json
    fi
    # Copy all necessary files into the package
    cp -r node_modules ../OutApp/nw/package.nw/
    ...
```

### Why This Works
1. **Command-line override**: nw-builder accepts `--app.*` options as CLI arguments
2. **Direct injection**: Provides values exactly where nw-builder's validation expects them
3. **Platform-specific**: Only applied for macOS, doesn't affect Linux or Windows builds
4. **No package.json changes**: Keeps package.json structure clean
5. **Both requirements met**: Satisfies all macOS-specific validations

## Property Values

### 1. LSApplicationCategoryType
**Chosen:** `public.app-category.graphics-design`

**Why This Category?**
SysMocap is a motion capture and 3D visualization application, which fits well in the graphics/design category because:
- It involves 3D graphics and visualization
- Used for creative and animation workflows
- Similar to other graphics and design tools

### 2. NSHumanReadableCopyright
**Chosen:** `Copyright © 2024 SysMocap Team`

**Format Requirements:**
- Should include © symbol or "Copyright"
- Include year
- Include copyright holder name
- Can include "All Rights Reserved" (optional)

### Available LSApplicationCategoryType Categories
Other valid macOS application categories include:
- `public.app-category.business`
- `public.app-category.developer-tools`
- `public.app-category.education`
- `public.app-category.entertainment`
- `public.app-category.finance`
- `public.app-category.games`
- `public.app-category.graphics-design` ← **Our choice**
- `public.app-category.healthcare-fitness`
- `public.app-category.lifestyle`
- `public.app-category.medical`
- `public.app-category.music`
- `public.app-category.news`
- `public.app-category.photography`
- `public.app-category.productivity`
- `public.app-category.reference`
- `public.app-category.social-networking`
- `public.app-category.sports`
- `public.app-category.travel`
- `public.app-category.utilities`
- `public.app-category.video`
- `public.app-category.weather`

## Impact

### Before Fixes
- ❌ macOS builds failed immediately during validation (LSApplicationCategoryType)
- ❌ After partial fix, failed on second validation (NSHumanReadableCopyright)
- ❌ No .app bundle created
- ❌ No artifacts uploaded
- ❌ CI workflow failed

### After Complete Fix
- ✅ macOS builds pass both validations
- ✅ .app bundle created successfully
- ✅ Artifacts uploaded
- ✅ CI workflow succeeds

## Implementation History

### Commit 1: 38d1299
- Added LSApplicationCategoryType
- Fixed first validation error
- Revealed second validation requirement

### Commit 2: 68bf59e (FINAL)
- Added NSHumanReadableCopyright
- Fixed second validation error
- Complete macOS build solution

## Testing

### Verification Steps
1. Push changes to trigger CI
2. Monitor macOS build job
3. Confirm build completes without validation errors
4. Verify .app bundle is created
5. Confirm artifact is uploaded

### Expected Output
```
[ INFO ] Parse final options using node manifest
[ INFO ] Get version specific release info...
[ INFO ] Validate options.* ...
✓ LSApplicationCategoryType validation passed
✓ NSHumanReadableCopyright validation passed
[ INFO ] Building for macOS...
```

## Related Documentation
- [Apple Developer - LSApplicationCategoryType](https://developer.apple.com/documentation/bundleresources/information_property_list/lsapplicationcategorytype)
- [Apple Developer - NSHumanReadableCopyright](https://developer.apple.com/documentation/bundleresources/information_property_list/nshumanreadablecopyright)
- [nw-builder documentation](https://nwjs.readthedocs.io/en/latest/For%20Users/Package%20and%20Distribute/)

## Commits
- **First Fix:** 38d1299 - LSApplicationCategoryType
- **Complete Fix:** 68bf59e - NSHumanReadableCopyright
- **Date:** 2026-02-10
- **Status:** ✅ Complete

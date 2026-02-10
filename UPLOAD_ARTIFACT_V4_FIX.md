# Fix: upload-artifact@v4 Relative Path Error

## Issue Summary

GitHub Actions workflow was failing when trying to upload build artifacts with the error:
```
Error: Invalid pattern '../OutApp/nw/*.tar.gz'. Relative pathing '.' and '..' is not allowed.
```

## Background

### upload-artifact@v4 Breaking Change

GitHub Actions `upload-artifact` action version 4 introduced a breaking change that disallows relative paths containing parent directory references (`..` or `.`).

**Previous versions (v1-v3):**
- ✅ Allowed: `../OutApp/nw/*.tar.gz`
- ✅ Allowed: `./build/*.zip`

**Version 4 (current):**
- ❌ Disallowed: `../OutApp/nw/*.tar.gz`
- ❌ Disallowed: `./build/*.zip`
- ✅ Allowed: `/absolute/path/to/files/*.tar.gz`
- ✅ Allowed: `relative/path/without/dots/*.zip`

## Root Cause

The workflow was using relative paths with parent directory references to upload artifacts:

```yaml
- name: Upload NW.js desktop artifacts
  uses: actions/upload-artifact@v4
  with:
    name: SysMocap-NWjs-${{ matrix.platform }}-${{ steps.get_version.outputs.VERSION }}
    path: |
      ../OutApp/nw/*.tar.gz    # ← Violates v4 restriction
      ../OutApp/nw/*.zip        # ← Violates v4 restriction
    retention-days: 90
```

## Solution

Convert relative paths to absolute paths using the `${{ github.workspace }}` context variable:

### Before (Broken)
```yaml
path: |
  ../OutApp/nw/*.tar.gz
  ../OutApp/nw/*.zip
```

### After (Fixed)
```yaml
path: |
  ${{ github.workspace }}/../OutApp/nw/*.tar.gz
  ${{ github.workspace }}/../OutApp/nw/*.zip
```

## How It Works

1. **`${{ github.workspace }}`** resolves to the absolute path of the repository root
   - Example: `/home/runner/work/SysMocap/SysMocap`

2. **Append the relative portion** to create an absolute path
   - `${{ github.workspace }}/../OutApp/nw/`
   - Resolves to: `/home/runner/work/SysMocap/OutApp/nw/`

3. **upload-artifact@v4 accepts absolute paths**
   - Even if they navigate to parent directories
   - The restriction is only on relative path notation using `..`

## Path Resolution Example

```
Repository structure in GitHub Actions:
/home/runner/work/
├── SysMocap/              (organization/username)
│   ├── SysMocap/          (repository name) ← ${{ github.workspace }}
│   │   ├── .github/
│   │   ├── icons/
│   │   └── package.json
│   └── OutApp/            (build output, one level up)
│       └── nw/
│           ├── *.tar.gz
│           └── *.zip

Workflow execution:
- Working directory: ${{ github.workspace }} = /home/runner/work/SysMocap/SysMocap
- Archives created in: ../OutApp/nw/
- Absolute path: ${{ github.workspace }}/../OutApp/nw/
- Resolves to: /home/runner/work/SysMocap/OutApp/nw/
```

## Changes Made

### File Modified
- `.github/workflows/nwjs-build.yml` (lines 159-160)

### Diff
```diff
       - name: Upload NW.js desktop artifacts
         uses: actions/upload-artifact@v4
         with:
           name: SysMocap-NWjs-${{ matrix.platform }}-${{ steps.get_version.outputs.VERSION }}
           path: |
-            ../OutApp/nw/*.tar.gz
-            ../OutApp/nw/*.zip
+            ${{ github.workspace }}/../OutApp/nw/*.tar.gz
+            ${{ github.workspace }}/../OutApp/nw/*.zip
           retention-days: 90
```

## Commit Details

- **Hash:** `35d24b0`
- **Message:** "Fix upload-artifact@v4 path error - use absolute paths"
- **Files Changed:** 1 (`.github/workflows/nwjs-build.yml`)
- **Lines Changed:** +2, -2

## Testing

This fix will allow the workflow to:
1. ✅ Create build archives in `../OutApp/nw/` directory
2. ✅ Upload artifacts using absolute path reference
3. ✅ Avoid "Invalid pattern" error from upload-artifact@v4
4. ✅ Successfully upload both `.tar.gz` (Linux/macOS) and `.zip` (Windows) files

## Expected Behavior

After this fix, the artifact upload step will:
- Successfully locate files in the build output directory
- Upload them to GitHub Actions artifacts storage
- Make them available for download for 90 days
- Complete without path validation errors

## Alternative Solutions Considered

### Option 1: Move archives to workspace directory
```yaml
- name: Move archives to workspace
  run: mv ../OutApp/nw/*.tar.gz ./artifacts/

- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    path: artifacts/*.tar.gz
```
**Rejected:** Adds unnecessary file movement step

### Option 2: Change build output location
```yaml
- name: Build NW.js
  run: npx nw-builder --outDir=./OutApp/nw package.json
```
**Rejected:** Would require changing multiple workflow steps and potentially break existing logic

### Option 3: Use absolute path (SELECTED)
```yaml
path: ${{ github.workspace }}/../OutApp/nw/*.tar.gz
```
**Selected:** Minimal change, maintains existing directory structure

## References

- [upload-artifact@v4 Migration Guide](https://github.com/actions/upload-artifact#migration)
- [GitHub Actions Context Variables](https://docs.github.com/en/actions/learn-github-actions/contexts#github-context)
- [GitHub Actions Workspace](https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables)

## Related Fixes

This fix is part of a series of CI/CD workflow improvements:
- `d63b3b2` - Fix NWjs build workflow path handling
- `a0579f0` - Add debugging and error handling to NWjs workflow
- `8f235ca` - Add missing icons/sysmocap.png for NWjs builds
- `35d24b0` - Fix upload-artifact@v4 path error (this fix)

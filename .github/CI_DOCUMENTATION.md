# CI/CD Workflows Documentation

This document explains the GitHub Actions workflows for building and releasing SysMocap across all platforms and runtime modes.

## Workflows Overview

### 1. Desktop Build Workflow (`main.yml`)

**Trigger:** When a version tag is pushed (e.g., `v1.0.0`)

**Builds:**
- Windows x64 (portable + installer) - **Electron**
- Windows ARM64 (portable + installer) - **Electron**
- macOS x64 (DMG) - **Electron**
- macOS ARM64 (DMG) - **Electron**

**Outputs:**
- 7z archives (Windows portable)
- MSI installers (Windows)
- DMG images (macOS)

### 2. Web Build Workflow (`web-build.yml`)

**Triggers:**
- Version tag pushed (e.g., `v1.0.0`) → Creates release
- Push to main branch → Builds only, no release
- Pull request → Builds only, no release
- Manual workflow dispatch → Builds only, no release

**Builds:**
- Browser/Web version (tar.gz + zip) - **Browser Mode**

**Outputs:**
- `SysMocap-Web-Build.tar.gz` - Compressed web build
- `SysMocap-Web-Build.zip` - Zip archive web build

### 3. NW.js Build Workflow (`nwjs-build.yml`) - NEW

**Triggers:**
- Version tag pushed (e.g., `v1.0.0`) → Creates release
- Push to main branch → Builds only, no release
- Pull request → Builds only, no release
- Manual workflow dispatch → Builds only, no release

**Builds:**
- NW.js Desktop (Windows, macOS, Linux) - **NW.js Mode**
- Android APK via Cordova - **Mobile**

**Outputs:**
- Desktop: tar.gz/zip for each platform
- Mobile: `SysMocap-Android-*.apk`

**Build Matrix:**
| Platform | Runner | Output Format |
|----------|--------|---------------|
| Windows | windows-latest | .zip |
| macOS | macos-latest | .tar.gz |
| Linux | ubuntu-latest | .tar.gz |
| Android | ubuntu-latest | .apk |

## Release Creation Rules

### Desktop Builds (`main.yml`)
- ✅ **Creates release**: When pushing tags matching `v*.*.*`
- ❌ **No release**: On any other push or PR

### Web Builds (`web-build.yml`)
- ✅ **Creates release**: When pushing tags matching `v*.*.*`
- ❌ **No release**: On main branch push, PRs, or manual triggers
- ℹ️ **Artifacts always uploaded**: Available for download from Actions tab

## Triggering Builds

### Creating a Release (All Platforms)

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# This triggers ALL workflows:
# - main.yml: Builds Electron desktop versions
# - web-build.yml: Builds browser version
# - nwjs-build.yml: Builds NW.js desktop + Android
```

### Testing Builds (No Release)

```bash
# Push to main branch
git push origin main

# Or create a PR
# Both will build but NOT create a release
```

### Manual Builds

```bash
# Go to GitHub Actions tab
# Select desired workflow
# Click "Run workflow"
# Select branch and run
```

## Build Outputs by Mode

### Electron (Desktop Only)
```
Release Assets:
├── SysMocap-Windows-x64-v1.0.0.7z
├── SysMocap-Windows-x64-installer-v1.0.0.msi
├── SysMocap-Windows-arm64-v1.0.0.7z
├── SysMocap-Windows-arm64-installer-v1.0.0.msi
├── SysMocap-macOS-x64-v1.0.0.dmg
└── SysMocap-macOS-arm64-v1.0.0.dmg
```

### Browser (Web - Desktop & Mobile)
```
Release Assets:
├── SysMocap-Web-Build.tar.gz
└── SysMocap-Web-Build.zip

Artifacts:
├── SysMocap-Web-Directory-v1.0.0/
└── SysMocap-Web-Archives-v1.0.0/
```

### NW.js (Desktop & Mobile)
```
Release Assets:
├── SysMocap-NWjs-v1.0.0-linux-x64.tar.gz
├── SysMocap-NWjs-v1.0.0-windows-x64.zip
├── SysMocap-NWjs-v1.0.0-osx-x64.tar.gz
└── SysMocap-Android-v1.0.0.apk

Artifacts:
├── SysMocap-NWjs-linux-v1.0.0/
├── SysMocap-NWjs-windows-v1.0.0/
├── SysMocap-NWjs-osx-v1.0.0/
└── SysMocap-Android-v1.0.0/
```
# Click "Run workflow"
# Select branch and run
```

## Artifacts

All workflows upload artifacts that can be downloaded from the Actions tab:

### Desktop Build Artifacts
- `windows-2019` - Windows builds
- `macos-13` - macOS builds

### Web Build Artifacts
The web build workflow uploads **two types** of artifacts:

1. **SysMocap-Web-Directory-\<version\>**
   - Uncompressed web-build directory
   - All files ready to use
   - Easy to browse and inspect
   - Best for: Quick testing, development

2. **SysMocap-Web-Archives-\<version\>**
   - Contains both tar.gz and zip files
   - Compressed for distribution
   - Best for: Downloads, deployment, sharing

**Retention:** 90 days

### Downloading Artifacts

**From GitHub Actions:**
1. Go to repository → Actions tab
2. Click on a workflow run
3. Scroll to "Artifacts" section
4. Download desired artifact

**From Releases:**
- Only available when version tag is pushed
- Contains compressed archives only
- Permanent storage (not deleted after 90 days)

## Environment Variables

### Secrets Required

- `GITHUB_TOKEN` - Automatically provided by GitHub
- `SECRET_TOKEN` - Optional, for additional features (desktop build)

### Variables Set by Workflows

- `VERSION_TAG` - Git tag name
- `VERSION` - Formatted version string

## Workflow Files Location

```
.github/
  workflows/
    main.yml         # Desktop builds (Win/Mac)
    web-build.yml    # Web builds
```

## Build Scripts

### Local Development

**Desktop:**
```bash
npm start  # Run Electron app
```

**Web:**
```bash
npm run browser  # Start dev server
npm run build:web  # Build for production (Linux/Mac)
npm run build:web:win  # Build for production (Windows)
```

### Script Files

- `browser-serve.js` - Development server
- `build-web.sh` - Linux/Mac build script
- `build-web.bat` - Windows build script

## GitHub Pages Deployment

The web build can optionally deploy to GitHub Pages:

**When:** Push to main branch (not on tags or PRs)

**Branch:** Deploys to `gh-pages` branch

**URL:** `https://username.github.io/SysMocap/`

**To enable:**
1. Ensure workflow has write permissions
2. Enable GitHub Pages in repository settings
3. Select `gh-pages` branch as source

**To disable:**
Comment out or remove the "Deploy to GitHub Pages" step in `web-build.yml`

## Troubleshooting

### Release Not Created

**Check:**
- Is the tag in format `v*.*.*`? (e.g., v1.0.0)
- Did you push the tag? `git push origin v1.0.0`
- Check workflow run logs in Actions tab

### Build Failed

**Check:**
- Workflow logs in Actions tab
- Dependencies installed correctly
- Syntax errors in code
- Permissions for GitHub token

### Artifacts Missing

**Check:**
- Workflow completed successfully
- Artifacts retention period (90 days)
- Download from Actions tab, not Releases

## Best Practices

### Version Tagging

```bash
# Semantic versioning: MAJOR.MINOR.PATCH
git tag v1.0.0  # Major release
git tag v1.1.0  # Minor update
git tag v1.1.1  # Patch/bugfix
```

### Pre-release Testing

```bash
# Test builds without creating releases:
# 1. Push to a feature branch
# 2. Create a PR to main
# 3. Review build artifacts
# 4. Only merge and tag when ready
```

### Release Workflow

```bash
# 1. Prepare release
git checkout main
git pull

# 2. Update version in code if needed
# Edit package.json, version files, etc.

# 3. Commit changes
git add .
git commit -m "Prepare v1.0.0 release"

# 4. Create and push tag
git tag v1.0.0
git push origin main
git push origin v1.0.0

# 5. Wait for workflows to complete
# 6. Check releases page for downloads
```

## Customization

### Modify Build Process

Edit workflow files in `.github/workflows/`:

**Desktop builds:** `main.yml`
- Change OS versions
- Modify package commands
- Add/remove platforms

**Web builds:** `web-build.yml`
- Modify included files
- Change archive formats
- Update deployment settings

### Add New Platforms

Example: Add Linux AppImage

```yaml
# In main.yml
- name: build linux app
  if: matrix.os == 'ubuntu-latest'
  run: |
    npm run package:linux
```

## Monitoring

### Check Build Status

- **GitHub Actions tab**: See all workflow runs
- **Commit status**: See checkmarks on commits
- **Email notifications**: Configure in GitHub settings

### Build Badges

Add to README.md:

```markdown
![Desktop Build](https://github.com/user/repo/workflows/Build%20SysMocap%20Desktop/badge.svg)
![Web Build](https://github.com/user/repo/workflows/Build%20SysMocap%20Web%20Version/badge.svg)
```

## Support

For issues with CI/CD:
1. Check workflow logs
2. Review this documentation
3. Check GitHub Actions documentation
4. Open an issue with workflow run link

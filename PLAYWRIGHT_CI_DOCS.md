# Playwright Mobile Test CI Workflow

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Trigger                    │
│  • Push to main/master/develop                              │
│  • Pull Request                                             │
│  • Manual workflow_dispatch                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Setup Environment                           │
│  1. Checkout code                                           │
│  2. Setup Node.js 18                                        │
│  3. Install npm dependencies (npm ci)                       │
│  4. Install Playwright Chromium browser                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Start Application                           │
│  • node browser-serve.js &                                  │
│  • Wait for server on localhost:3000                        │
│  • Timeout: 30 seconds                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Run Playwright Mobile Test                      │
│  1. Launch Chromium in mobile viewport (375x812)           │
│  2. Navigate to http://localhost:3000/browser/             │
│  3. Click "mocap" tab                                       │
│  4. Take screenshot (mobile-before-start.png)              │
│  5. Click "Start" button                                    │
│  6. Handle camera permission dialog                         │
│  7. Wait 5 seconds for app to load                         │
│  8. Take screenshot (mobile-after-start.png)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Upload Artifacts & Summary                   │
│  • Upload screenshots as artifacts (30 days)                │
│  • Embed screenshots in job summary                         │
│  • Stop server (cleanup)                                    │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
SysMocap/
├── .github/
│   └── workflows/
│       └── playwright-test.yml      # CI workflow configuration
├── tests/
│   ├── playwright-mobile.spec.js   # Mobile test script
│   └── README.md                    # Test documentation
├── screenshots/                     # Generated screenshots (gitignored)
│   ├── mobile-before-start.png     # Before clicking start
│   ├── mobile-after-start.png      # After clicking start
│   └── mobile-error.png            # On test failure
└── package.json                     # Added playwright & test script
```

## Key Features

### 1. Mobile Viewport Testing
- **Size**: 375x812 (iPhone SE)
- **User Agent**: iOS Safari
- **Headless**: True (for CI)

### 2. Screenshot Capture
- Before clicking Start button
- After app loads
- On error/failure

### 3. GitHub Integration
- Automatic trigger on push/PR
- Manual trigger available
- Screenshots in job summary
- 30-day artifact retention

### 4. Error Handling
- Graceful failure with error screenshots
- Dialog acceptance (camera permissions)
- Server cleanup on failure

## Usage Examples

### Local Development
```bash
# Terminal 1: Start server
npm run browser

# Terminal 2: Run test
npm run test:mobile

# View screenshots
ls -la screenshots/
```

### CI/CD
```bash
# Push code - triggers automatically
git push origin main

# Or manually trigger via GitHub UI:
# Actions → Playwright Mobile Test → Run workflow
```

## Viewing Results

### In GitHub Actions:
1. Go to Actions tab
2. Select "Playwright Mobile Test" workflow
3. Click on latest run
4. View job summary for embedded screenshots
5. Download full screenshots from Artifacts section

### Screenshots in Job Summary:
The workflow automatically embeds screenshots in the GitHub job summary:
- ✅ Before Start (mobile UI)
- ✅ After Start (loaded app)
- ⚠️ Error (if test fails)

## Technical Details

### Dependencies
- `playwright`: ^1.40.0 (browser automation)
- Node.js: 18.x (runtime)
- Chromium: Latest (via Playwright)

### Timeouts
- Page load: 30 seconds
- Button wait: 10 seconds
- App load: 5 seconds
- Server start: 30 seconds

### Network
- Server: http://localhost:3000
- Endpoint: /browser/
- No external dependencies

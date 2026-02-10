# Playwright Tests

This directory contains Playwright tests for the SysMocap application.

## Mobile Test

The `playwright-mobile.spec.js` test runs the application in mobile view and:
1. Opens the browser in mobile viewport (375x812 - iPhone SE size)
2. Navigates to the mocap tab
3. Clicks the start button
4. Takes screenshots before and after clicking start
5. Handles camera permission dialogs

## Running Tests Locally

1. Install dependencies:
```bash
npm install
npx playwright install chromium
```

2. Start the server:
```bash
npm run browser
```

3. In another terminal, run the test:
```bash
npm run test:mobile
```

Screenshots will be saved in the `screenshots/` directory.

## CI Integration

The test runs automatically on GitHub Actions via the `playwright-test.yml` workflow:
- Runs on every push to main/master/develop branches
- Runs on pull requests
- Can be triggered manually via workflow_dispatch

Screenshots are uploaded as artifacts and displayed in the job summary.

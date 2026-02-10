const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Playwright test for mobile view
 * This test:
 * 1. Starts the app in mobile viewport (375x812)
 * 2. Navigates to the mocap tab
 * 3. Clicks the start button
 * 4. Takes a screenshot
 */

async function runMobileTest() {
    console.log('Starting Playwright mobile test...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 375, height: 812 }, // iPhone SE size
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    });
    
    const page = await context.newPage();
    
    try {
        console.log('Navigating to http://localhost:3000/browser/...');
        await page.goto('http://localhost:3000/browser/', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        console.log('Waiting for page to load...');
        await page.waitForTimeout(2000);
        
        console.log('Clicking mocap tab...');
        // Click on the mocap tab
        await page.click('text=mocap');
        await page.waitForTimeout(1000);
        
        console.log('Looking for Start button...');
        // Wait for the start button to be visible
        await page.waitForSelector('button:has-text("Start")', { timeout: 10000 });
        
        console.log('Taking screenshot before clicking Start...');
        const screenshotsDir = path.join(__dirname, '..', 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'mobile-before-start.png'),
            fullPage: true 
        });
        
        console.log('Clicking Start button...');
        await page.click('button:has-text("Start")');
        
        // Handle potential alert dialog (camera permission)
        page.on('dialog', async dialog => {
            console.log('Dialog detected:', dialog.message());
            await dialog.accept();
        });
        
        console.log('Waiting for app to load...');
        await page.waitForTimeout(5000);
        
        console.log('Taking final screenshot...');
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'mobile-after-start.png'),
            fullPage: true 
        });
        
        console.log('Test completed successfully!');
        console.log('Screenshots saved to:', screenshotsDir);
        
    } catch (error) {
        console.error('Test failed:', error);
        
        // Take screenshot on error
        const screenshotsDir = path.join(__dirname, '..', 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'mobile-error.png'),
            fullPage: true 
        });
        
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
runMobileTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

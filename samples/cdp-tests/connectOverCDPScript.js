/**
 * Connect Over CDP - Microsoft Playwright Service
 * 
 * Simple example showing how to connect to a remote browser via CDP.
 * This demonstrates a NON-TESTING scenario for manual browser automation.
 * 
 * Prerequisites:
 *   npm install playwright
 * 
 * Environment Variables:
 *   PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
 *   PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your_access_token
 * 
 * Usage:
 *   node connectOverCDPScript.js
 */

import { chromium } from 'playwright';
import { getCdpEndpoint } from './playwrightServiceClient.js';

async function main() {
  console.log('🔗 Connecting to Microsoft Playwright Service...');
  
  // Step 1: Get CDP endpoint from the service
  const cdpUrl = await getCdpEndpoint();
  console.log('✅ Got CDP endpoint');
  
  // Step 2: Connect to remote browser using Playwright
  const browser = await chromium.connectOverCDP(
    cdpUrl,
    { headers: { 'User-Agent': 'Chrome-DevTools-Protocol/1.3' } }
  );
  console.log('✅ Connected to remote browser');
  
  // Step 3: Use the browser
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Example: Navigate and take screenshot
  console.log('📄 Navigating to example.com...');
  await page.goto('https://example.com');
  
  const title = await page.title();
  console.log(`📌 Page title: ${title}`);
  
  // Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });
  console.log('📸 Screenshot saved to screenshot.png');
  
  // Example: Extract content
  const heading = await page.locator('h1').textContent();
  console.log(`📝 Page heading: ${heading}`);
  
  // Example: Click a link
  await page.click('a');
  await page.waitForLoadState('networkidle');
  console.log(`🔗 Navigated to: ${page.url()}`);
  
  // Cleanup
  await context.close();
  await browser.close();
  console.log('✅ Done!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

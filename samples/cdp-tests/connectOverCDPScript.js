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
import { randomUUID } from 'crypto';
import https from 'https';

async function main() {
  // Generate a unique run ID
  const runId = process.env.PLAYWRIGHT_RUN_ID || randomUUID();
  
  // Create test run for tracking
  const match = process.env.PLAYWRIGHT_SERVICE_URL?.match(/^wss:\/\/([^\.]+)\.api\.playwright\.microsoft\.com\/playwrightworkspaces\/([^\/]+)\//);
  if (match) {
    const url = new URL(`https://${match[1]}.reporting.api.playwright.microsoft.com/playwrightworkspaces/${match[2]}/test-runs/${runId}?api-version=2025-09-01`);
    const payload = JSON.stringify({ displayName: runId, ciConfig: { providerName: 'GITHUB' } });
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
        'Authorization': `Bearer ${process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Test run created: ${runId}`);
        } else {
          console.log(`⚠️  Test run creation failed: ${res.statusCode} - ${data}`);
        }
      });
    });
    req.on('error', err => console.log(`⚠️  Test run creation error: ${err.message}`));
    req.write(payload);
    req.end();
  }
  
  console.log('🔗 Connecting to Microsoft Playwright Service...');
  console.log(`📊 Run ID: ${runId}`);
  
  // Step 1: Get CDP endpoint from the service with run ID
  // This step will be simplified once OSS redirect support is added
  let cdpUrl = await getCdpEndpoint();
  // Append run ID to track this session
  const separator = cdpUrl.includes('?') ? '&' : '?';
  cdpUrl = `${cdpUrl}${separator}runId=${runId}`;
  console.log('✅ Got CDP endpoint');
  
  // Step 2: Connect to remote browser using Playwright
  // User-Agent header override will be removed after service fix
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

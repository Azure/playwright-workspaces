/**
 * Puppeteer over CDP - Microsoft Playwright Service
 *
 * Connects puppeteer-core to a remote Chromium on PWW over CDP.
 *
 * Install:
 *   npm install puppeteer-core
 *
 * Environment Variables:
 *   PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
 *   PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your_access_token
 *
 * Usage:
 *   node puppeteerScript.js
 */

import puppeteer from 'puppeteer-core';
import { getCdpEndpoint } from './playwrightServiceClient.js';

async function main() {
  const cdpUrl = await getCdpEndpoint();

  const browser = await puppeteer.connect({
    browserWSEndpoint: cdpUrl,
    defaultViewport: null,
  });

  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  console.log('Page title:', await page.title());

  await context.close();
  await browser.disconnect();
}

// Opt-in proxy variant. Not invoked by default — change the entry point at
// the bottom of this file to `mainWithProxy()` to use it. Requires
// PROXY_SERVER / PROXY_USERNAME / PROXY_PASSWORD in your env.
async function mainWithProxy() {
  const cdpUrl = await getCdpEndpoint();

  const browser = await puppeteer.connect({
    browserWSEndpoint: cdpUrl,
    defaultViewport: null,
  });

  const context = await browser.createBrowserContext({
    proxyServer: process.env.PROXY_SERVER,
  });
  const page = await context.newPage();
  await page.authenticate({
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
  });

  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  console.log('Page title (via proxy):', await page.title());

  await context.close();
  await browser.disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

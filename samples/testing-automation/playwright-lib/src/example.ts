import { chromium, devices } from 'playwright';
import { randomUUID } from 'crypto';
import https from 'https';


// Define your runId, os, and apiVersion
const runId = process.env['PLAYWRIGHT_RUN_ID'] || randomUUID(); // Use env variable or fallback to random UUID
const os = 'linux'; // Replace with your desired OS linux or windows
const apiVersion = '2025-09-01'; // DONOT change

// implement getConnectOption to generate wsendpoint
async function getConnectOptions() {
  // Get the connection options

  return {
    wsEndpoint: `${process.env['PLAYWRIGHT_SERVICE_URL']}?runId=${encodeURIComponent(runId)}&os=${os}&api-version=${apiVersion}`,
    options: {
      headers: {
        Authorization: `Bearer ${process.env['PLAYWRIGHT_SERVICE_ACCESS_TOKEN'] || ''}`,
      },
      timeout: 3 * 60 * 1000, // 3 minutes
      exposeNetwork: '<loopback>', // Use loopback to expose network
    },
  };
}

(async () => {
  // create test run
  async function createTestRun() {
    console.log(`Creating test run with ID: ${runId}`);
    const serviceUrl = process.env['PLAYWRIGHT_SERVICE_URL'];
    if (!serviceUrl) {
      throw new Error('PLAYWRIGHT_SERVICE_URL is not defined');
    }

    // Extract domain, region, and workspaceId from serviceUrl, serviceurl - wss://eastus.api.playwright.microsoft.com/playwrightworkspaces/{workspaceId/browsers
    const urlPattern = /^wss:\/\/([^\.]+)\.api\.playwright\.microsoft\.com\/playwrightworkspaces\/([^\/]+)\//;
    const match = serviceUrl.match(urlPattern);
    if (!match) {
      throw new Error('PLAYWRIGHT_SERVICE_URL is not in the expected format');
    }
    const region = match[1];
    const workspaceId = match[2];

    const accessToken = process.env['PLAYWRIGHT_SERVICE_ACCESS_TOKEN'] || '';
    const runPayload = JSON.stringify({
      displayName: runId,
      ciConfig: {
        providerName: "GITHUB"
      }
    });

    let url = new URL(`https://${region}.reporting.api.playwright.microsoft.com/playwrightworkspaces/${workspaceId}/test-runs/${runId}?api-version=${apiVersion}`);
    const options = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    await new Promise<void>((resolve, reject) => {
      const req = https.request(url, options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Failed to create test run: ${res.statusCode} ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(runPayload);
      req.end();
    });
  }

  await createTestRun();
  // Setup
  const { wsEndpoint, options } = await getConnectOptions();
  const browser = await chromium.connect(wsEndpoint, options);
  const context = await browser.newContext(devices['iPhone 11']);
  const page = await context.newPage();

  // The actual interesting bit
  await context.route('**.jpg', route => route.abort());
  await page.goto('https://example.com/');
  console.log('Page title:', await page.title());

  // Teardown
  await context.close();
  await browser.close();
})();
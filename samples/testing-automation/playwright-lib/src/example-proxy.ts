import { chromium, devices } from 'playwright';
import { randomUUID } from 'crypto';

/**
 * Opt-in proxy variant of example.ts.
 *
 * Same `chromium.connect()` flow against PWW, but every BrowserContext is
 * created with a `proxy:` option so all traffic from this run is routed
 * through your authenticated HTTP forward proxy. Playwright transparently
 * answers the 407 challenge with the supplied credentials.
 *
 * Required env vars (in addition to PLAYWRIGHT_SERVICE_URL +
 * PLAYWRIGHT_SERVICE_ACCESS_TOKEN):
 *   PROXY_SERVER     e.g. http://<your-proxy>:8080
 *   PROXY_USERNAME
 *   PROXY_PASSWORD
 *   PROXY_ONLY_URL   the URL to fetch through the proxy
 *
 * Run:
 *   npx ts-node src/example-proxy.ts
 */
const runId = process.env['PLAYWRIGHT_RUN_ID'] || randomUUID();
const os = 'linux';
const apiVersion = '2025-09-01';

const wsEndpoint =
  `${process.env['PLAYWRIGHT_SERVICE_URL']}` +
  `?runId=${encodeURIComponent(runId)}&os=${os}&api-version=${apiVersion}`;

const connectOptions = {
  headers: { Authorization: `Bearer ${process.env['PLAYWRIGHT_SERVICE_ACCESS_TOKEN'] || ''}` },
  timeout: 3 * 60 * 1000,
  exposeNetwork: '<loopback>',
};

const proxy = {
  server: process.env['PROXY_SERVER']!,
  username: process.env['PROXY_USERNAME'],
  password: process.env['PROXY_PASSWORD'],
};

(async () => {
  const browser = await chromium.connect(wsEndpoint, connectOptions);
  const context = await browser.newContext({ ...devices['Desktop Chrome'], proxy });
  const page = await context.newPage();

  const target = process.env['PROXY_ONLY_URL']!;
  const response = await page.goto(target);
  console.log(`status: ${response?.status()}`);
  console.log('title :', await page.title());

  await context.close();
  await browser.close();
})();

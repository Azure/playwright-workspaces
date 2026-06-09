import { defineConfig } from '@playwright/test';
import { createAzurePlaywrightConfig, ServiceOS } from '@azure/playwright';
import { DefaultAzureCredential } from '@azure/identity';
import config from './playwright.config';

/**
 * Opt-in PWW service config that routes every test context through an
 * authenticated HTTP forward proxy.
 *
 * Required env vars (in addition to PLAYWRIGHT_SERVICE_URL):
 *   PROXY_SERVER     e.g. http://<your-proxy>:8080
 *   PROXY_USERNAME
 *   PROXY_PASSWORD
 *
 * Run only the proxy-tagged specs:
 *   npx playwright test --config=playwright.service.proxy.config.ts
 *
 * The default `npx playwright test --config=playwright.service.config.ts`
 * is unaffected.
 */
export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    exposeNetwork: '<loopback>',
    connectTimeout: 3 * 60 * 1000,
    os: ServiceOS.LINUX,
    credential: new DefaultAzureCredential(),
  }),
  {
    testDir: './tests-proxy',
    use: {
      proxy: {
        server: process.env.PROXY_SERVER!,
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD,
      },
    },
  }
);

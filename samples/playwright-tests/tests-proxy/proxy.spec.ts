import { test, expect } from '@playwright/test';

/**
 * Opt-in spec — only runs under the `proxy` project in playwright.config.ts.
 * Invoke with:
 *   npx playwright test --config=playwright.service.config.ts --project=proxy
 *
 * Set PROXY_ONLY_URL to a host reachable through your proxy
 * (e.g. a private intranet origin). The spec is skipped if unset.
 */
test('fetches PROXY_ONLY_URL through the proxied PWW context', async ({ page }) => {
  const target = process.env.PROXY_ONLY_URL;
  test.skip(!target, 'PROXY_ONLY_URL is not set');

  const response = await page.goto(target!);
  expect(response?.ok()).toBeTruthy();

  const body = await page.locator('body').innerText();
  console.log(`--- PROXIED -> ${target} ---`);
  console.log(body);
  expect(body.length).toBeGreaterThan(0);
});

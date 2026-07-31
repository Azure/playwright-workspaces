import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html>
      <head><title>Playwright Sample</title></head>
      <body><h1>Playwright</h1></body>
    </html>
  `);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html>
      <body><a href="/intro">Get started</a></body>
    </html>
  `);

  await expect(page.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/intro');
});

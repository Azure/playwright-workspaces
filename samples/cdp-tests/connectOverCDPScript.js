import { chromium } from 'playwright';

(async () => {
  try {
    console.log('🔌 Connecting to CDP server...');
    const browser = await chromium.connectOverCDP('ENTER YOUR CDP WEBSOCKET URL HERE',
    {headers:{'User-Agent': 'Chrome-DevTools-Protocol/1.3'}});
    console.log('✅ Connected successfully!');
    
    const contexts = browser.contexts();
    let context;
    if (contexts.length > 0) {
      context = contexts[0];
    } else {
      context = await browser.newContext();
    }
    
    const pages = context.pages();
    let page;
    if (pages.length > 0) {
      page = pages[0];
    } else {
      page = await context.newPage();
    }
    
    console.log('🌐 Navigating to Google...');
    await page.goto('https://google.com');
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Don't close browser to keep it alive
    await browser.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
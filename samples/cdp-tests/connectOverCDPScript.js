import { chromium } from 'playwright';

const WORKSPACE_ID = process.env.PLAYWRIGHT_SERVICE_WORKSPACE_ID;
const REGION = process.env.PLAYWRIGHT_SERVICE_REGION;
const AUTH_TOKEN = process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN;

async function getRemoteBrowserWebSocketUrl() {
  const apiUrl = `https://${REGION}.api.playwright.microsoft.com/playwrightworkspaces/${WORKSPACE_ID}/browsers?os=linux&browser=chromium&playwrightVersion=cdp`;
  const headers = {
    "Authorization": `Bearer ${AUTH_TOKEN}`,
    "Accept": "application/json",
    "User-Agent": "PlaywrightService-CDP-Client/1.0"
  };

  const response = await fetch(apiUrl, { headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.wsEndpoint;
} 

(async () => {
  try {
    console.log('🔍 Fetching CDP WebSocket URL...');
    const cdpUrl = await getRemoteBrowserWebSocketUrl();
    console.debug('✅ Got WebSocket URL:', cdpUrl);
    
    console.log('🔌 Connecting to CDP server...');
    const browser = await chromium.connectOverCDP(cdpUrl,
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
    await page.goto('https://playwright.dev');
    const title = await page.title();
    console.log('📄 Page title:', title);
   
    await browser.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();

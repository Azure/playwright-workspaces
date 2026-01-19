import { chromium } from 'playwright';

const SERVICE_URL = process.env.PLAYWRIGHT_SERVICE_URL;
const ACCESS_TOKEN = process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN;

// Parse region and workspaceId from PLAYWRIGHT_SERVICE_URL
// Format: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
function parseServiceUrl(url: string) {
  if (!url) {
    throw new Error('PLAYWRIGHT_SERVICE_URL environment variable is not set');
  }
  
  const urlPattern = /wss:\/\/(\w+)\.api\.playwright\.microsoft\.com\/playwrightworkspaces\/([^\/]+)\/browsers/;
  const match = url.match(urlPattern);
  
  if (!match) {
    throw new Error('Invalid PLAYWRIGHT_SERVICE_URL format. Expected: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers');
  }
  
  return {
    region: match[1],
    workspaceId: match[2]
  };
}

async function getRemoteBrowserWebSocketUrl() {
  if (!ACCESS_TOKEN) {
    throw new Error('PLAYWRIGHT_SERVICE_ACCESS_TOKEN environment variable is not set');
  }

  const { region, workspaceId } = parseServiceUrl(SERVICE_URL!);
  
  const apiUrl = `https://${region}.api.playwright.microsoft.com/playwrightworkspaces/${workspaceId}/browsers?os=linux&browser=chromium&playwrightVersion=cdp`;
  const headers = {
    "Authorization": `Bearer ${ACCESS_TOKEN}`,
    "Accept": "application/json",
    "User-Agent": "PlaywrightService-CDP-Client/1.0"
  };

  const response = await fetch(apiUrl, { headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.endpoint;  // ✅ Fixed: use 'endpoint' not 'wsEndpoint'
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
    
    console.log('🌐 Navigating to playwright.dev...');
    await page.goto('https://playwright.dev');
    const title = await page.title();
    console.log('📄 Page title:', title);
   
    await browser.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
})();

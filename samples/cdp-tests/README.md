# Microsoft Playwright Service - CDP Samples

Samples for connecting to Microsoft Playwright Service via CDP (Chrome DevTools Protocol) in both Python and JavaScript.

## 📁 Files

| File | Language | Use Case | Description |
|------|----------|----------|-------------|
| `playwright_service_client.py` | Python | Core Module | Shared Python client for all samples |
| `playwrightServiceClient.js` | JavaScript | Core Module | Shared JavaScript client |
| `connectOverCDPScript.py` | Python | **Manual** | Simple connect_over_cdp example |
| `connectOverCDPScript.js` | JavaScript | **Manual** | Simple connectOverCDP example |
| `test_runner.py` | Python | **Testing** | Test runner with helpers |
| `Browser-Use-Remote.py` | Python | **AI Agent** | Browser-Use + Azure OpenAI |

## 🚀 Quick Start

### Python

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export PLAYWRIGHT_SERVICE_URL="wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers"
export PLAYWRIGHT_SERVICE_ACCESS_TOKEN="your_access_token"

# Run samples
python connectOverCDPScript.py        # Basic CDP connection
python test_runner.py                 # Run example tests
pytest test_runner.py -v              # With pytest
python Browser-Use-Remote.py          # AI agent (requires Azure OpenAI)
```

### JavaScript

```bash
# Install dependencies
npm install playwright

# Set environment variables
export PLAYWRIGHT_SERVICE_URL="wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers"
export PLAYWRIGHT_SERVICE_ACCESS_TOKEN="your_access_token"

# Run sample
node connectOverCDPScript.js          # Basic CDP connection
```

## 📖 Usage Examples

### Basic CDP Connection (Python)
```python
from playwright.async_api import async_playwright
from playwright_service_client import get_cdp_endpoint

cdp_url = await get_cdp_endpoint()
async with async_playwright() as p:
    browser = await p.chromium.connect_over_cdp(
        cdp_url,
        headers={'User-Agent': 'Chrome-DevTools-Protocol/1.3'}
    )
    page = await browser.new_page()
    await page.goto("https://example.com")
```

### Basic CDP Connection (JavaScript)
```javascript
import { chromium } from 'playwright';
import { getCdpEndpoint } from './playwrightServiceClient.js';

const cdpUrl = await getCdpEndpoint();
const browser = await chromium.connectOverCDP(
  cdpUrl,
  { headers: { 'User-Agent': 'Chrome-DevTools-Protocol/1.3' } }
);
const page = await browser.newPage();
await page.goto('https://example.com');
```

### Test Automation (Python)
```python
from test_runner import remote_page

async with remote_page() as page:
    await page.goto("https://example.com")
    assert await page.title() == "Example Domain"
```

### AI Agent (Python)
```python
from playwright_service_client import get_cdp_endpoint
from browser_use.browser.profile import BrowserProfile

cdp_url = await get_cdp_endpoint()
profile = BrowserProfile(cdp_url=cdp_url)
```

## 🔧 Environment Variables

Set the following environment variables (or copy `.env.example` to `.env` for Python):

```bash
PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your_access_token

# For AI agent example only
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_API_VERSION=2023-07-01-preview
```

## 📚 Resources

- [Microsoft Playwright Service](https://learn.microsoft.com/azure/playwright-testing/)
- [Playwright Python](https://playwright.dev/python/)
- [Playwright JavaScript](https://playwright.dev/)
- [Browser-Use](https://github.com/browser-use/browser-use)


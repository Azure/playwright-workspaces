# Microsoft Playwright Service - Python CDP Samples

Python samples for connecting to Microsoft Playwright Service via CDP.

## 📁 Files

| File | Use Case | Description |
|------|----------|-------------|
| `playwright_service_client.py` | Core Module | Shared client for all samples |
| `test_runner.py` | **Testing** | Test runner with helpers |
| `connectOverCDPScript.py` | **Manual** | Simple connect_over_cdp example |
| `Browser-Use-Remote.py` | **AI Agent** | Browser-Use + Azure OpenAI |

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Copy .env.example to .env and fill in your values
cp .env.example .env

# Run samples
python connectOverCDPScript.py        # Basic CDP connection
python test_runner.py                 # Run example tests
pytest test_runner.py -v              # With pytest
python Browser-Use-Remote.py          # AI agent (requires Azure OpenAI)
```

## 📖 Usage Examples

### Basic CDP Connection
```python
from playwright.async_api import async_playwright
from playwright_service_client import get_cdp_endpoint

cdp_url = await get_cdp_endpoint()
async with async_playwright() as p:
    browser = await p.chromium.connect_over_cdp(cdp_url)
    page = await browser.new_page()
    await page.goto("https://example.com")
```

### Test Automation
```python
from test_runner import remote_page

async with remote_page() as page:
    await page.goto("https://example.com")
    assert await page.title() == "Example Domain"
```

### AI Agent
```python
from playwright_service_client import get_cdp_endpoint
from browser_use.browser.profile import BrowserProfile

cdp_url = await get_cdp_endpoint()
profile = BrowserProfile(cdp_url=cdp_url)
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

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
- [Browser-Use](https://github.com/browser-use/browser-use)


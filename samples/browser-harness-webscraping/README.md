# Parallel Web Scraping with Browser-Harness + Playwright Workspaces

This sample demonstrates how to use [browser-harness](https://github.com/browser-use/browser-harness) with [Playwright Workspaces (PWW)](https://aka.ms/pww/docs) to run 10+ parallel remote browser sessions for web scraping, with LiveView for real-time debuggability.

## Overview

When you need to scrape data from many pages simultaneously — product prices, inventory levels, competitor catalogs — you need parallel browser sessions. This sample shows how to:

1. **Connect browser-harness** to PWW's remote CDP endpoint
1. **Spawn 10+ parallel browser sessions** — each with its own isolated browser
1. **Scrape product data** from multiple pages concurrently

## Prerequisites

- **Azure subscription** with permissions to create Playwright Workspaces
- **Playwright Workspace** & a **Playwright Service Access Token**. [Information on how to create a workspace](https://learn.microsoft.com/en-us/azure/app-testing/playwright-workspaces/quickstart-run-end-to-end-tests?tabs=playwrightcli&pivots=playwright-test-runner) and [how to create an access token](https://learn.microsoft.com/en-us/azure/app-testing/playwright-workspaces/how-to-manage-access-tokens)
- **Python 3.10+**
- **Git** installed

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Copy `.env.template` to `.env` and fill in your values:

```bash
cp .env.template .env
```

Required variables:
```
PLAYWRIGHT_SERVICE_URL=<playwright-service-url>
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<playwright-service-access-token>
```


### Use the setup prompt to setup browser-harness to connect to Playwright Service Browsers 

In a coding agent of your choice like Codex/Claude Code, use the following prompt:

```text
Set up https://github.com/browser-use/browser-harness for me.

Read `install.md` and follow the steps to install browser-harness and connect it to my Playwright Workspaces remote browsers.

Get the SERVICE_URL needed for provisioning remote browsers by running `get_cdp_browsers_endpoint()` method from `playwright_service_client.py`

Then update your skill to Follow the two-step connection flow for playwright remote browsers:

1. HTTP GET the SERVICE_URL (allow 60-90s for the browser to spin up). Parse the JSON response to extract the `sessionUrl` (a wss:// WebSocket URL).
2. Set BU_CDP_WS to the resolved sessionUrl in .env, then restart the daemon ONCE.

IMPORTANT:

- Do NOT kill or restart the daemon after the session is connected — the remote browser is destroyed when the WebSocket connection closes.
- Do NOT set shouldRedirect=true; use shouldRedirect=false and manually resolve the sessionUrl.
- The cold start takes 30-90s. Use a generous timeout on the initial HTTP GET.
- After connecting, verify with: browser-harness <<'PY'\nprint(page_info())\nPY                                                         

Once connected, confirm with a screenshot that the remote browser is alive. 
```

#### Start scraping with the power of browser-harness and Playwright Remote Browsers

Once this done, you can ask your agent to use browser-harness with playwright remote browsers to perform web scraping. Use a prompt similar to something like this:

```text
Go to ecommerce websites (Website1, Website2) and search for gifts under 500 for 10 year old kids which is useful, reusable and not single time use. Delivery in Bengaluru should be within 3 days. It should be such that 5 pieces of the item are available. Create independent Playwright Service remote browser sessions per website and use one sub-agent per website to browse in parallel using browser harness. Clone each remote session after scraping.
```

## More Resources

- [Playwright Workspaces Documentation](https://aka.ms/pww/docs)
- [Browser-Harness GitHub](https://github.com/browser-use/browser-harness)
- [PWW Pricing](https://aka.ms/pww/pricing)

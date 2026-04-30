# Parallel Web Scraping with Browser-Harness + Playwright Workspaces

This sample demonstrates how to use [browser-harness](https://github.com/browser-use/browser-harness) with [Playwright Workspaces (PWW)](https://aka.ms/pww/docs) to run 10+ parallel remote browser sessions for web scraping, with LiveView for real-time debuggability.

## Overview

When you need to scrape data from many pages simultaneously — product prices, inventory levels, competitor catalogs — you need parallel browser sessions. This sample shows how to:

1. **Create a Playwright Workspace** — managed cloud browsers on Azure
2. **Connect browser-harness** to PWW's remote CDP endpoint
3. **Spawn 10+ parallel browser sessions** — each with its own isolated browser
4. **Scrape product data** from multiple pages concurrently
5. **Debug in real-time** using PWW's LiveView

## Architecture

```
┌─────────────────┐     ┌───────────────────────────┐
│  Coding Agent   │     │  Playwright Workspaces    │
│  (Claude Code / │────▶│  (Azure-managed browsers) │
│   Codex)        │ CDP │                           │
│                 │ WSS │  ┌───────┐ ┌───────┐     │
│  browser-harness│────▶│  │ Tab 1 │ │ Tab 2 │ ... │
└─────────────────┘     │  └───────┘ └───────┘     │
        │               └───────────────────────────┘
        │                           │
        ▼                           ▼
┌─────────────────┐     ┌───────────────────────────┐
│  Aggregated     │     │  LiveView (real-time)     │
│  Scraped Data   │     │  Watch any session live   │
└─────────────────┘     └───────────────────────────┘
```

## Prerequisites

- **Azure subscription** with permissions to create Playwright Workspaces
- **Python 3.10+**
- **Git** installed
- **Azure CLI** authenticated (`az login`)
- Familiarity with Jupyter notebooks

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Browser-Harness

```bash
git clone https://github.com/browser-use/browser-harness
cd browser-harness
uv tool install -e .
```

### 3. Set Up Environment Variables

Copy `.env.template` to `.env` and fill in your values:

```bash
cp .env.template .env
```

Required variables:
```
SUBSCRIPTION_ID=<your-azure-subscription-id>
RESOURCE_GROUP=<your-resource-group>
LOCATION=eastus
PLAYWRIGHT_WORKSPACE_NAME=<your-workspace-name>
```

### 4. Run the Notebook

Open `parallel_webscraping.ipynb` and follow the step-by-step instructions.

## What You'll Learn

- How to create and manage Playwright Workspaces programmatically
- How to connect browser-harness to remote CDP endpoints (PWW)
- The two-step connection flow (HTTP GET → resolve `sessionUrl` → set `BU_CDP_WS`)
- How to run 10+ parallel browser sessions for scraping
- How to use LiveView for real-time debugging of remote browser sessions

## Files in This Sample

| File | Description |
|------|-------------|
| `README.md` | This file |
| `requirements.txt` | Python dependencies |
| `.env.template` | Environment variable template |
| `parallel_webscraping.ipynb` | Step-by-step notebook |
| `helpers/live_view_watcher.py` | LiveView session watcher utility |

## Important Notes

- **Do NOT restart the daemon** after connecting to PWW — the remote browser is destroyed when the WebSocket closes
- **Cold start latency**: The initial browser provisioning takes 30-90 seconds
- **Session lifetime**: The browser stays alive as long as the daemon holds the WebSocket connection
- **Connect immediately**: After resolving the `sessionUrl`, connect the daemon right away — the session URL is ephemeral and expires quickly
- **Token limits**: PWW workspaces have a maximum number of access tokens. Delete unused tokens before creating new ones
- **CLI usage**: On Windows, browser-harness requires the `-c` flag: `browser-harness -c "print(page_info())"`
- The scraping target (`books.toscrape.com`) is a public demo site designed for scraping practice

## More Resources

- [Playwright Workspaces Documentation](https://aka.ms/pww/docs)
- [Browser-Harness GitHub](https://github.com/browser-use/browser-harness)
- [PWW Pricing](https://aka.ms/pww/pricing)

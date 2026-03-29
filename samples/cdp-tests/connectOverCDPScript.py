"""
Connect Over CDP - Microsoft Playwright Service

Simple example showing how to connect to a remote browser via CDP.
This demonstrates a NON-TESTING scenario for manual browser automation.

----------------------------------------
📌 Prerequisites
----------------------------------------
1️⃣ Python environment with the following packages installed:
   pip install playwright aiohttp python-dotenv

2️⃣ Playwright Remote Browser Setup
   - Sign up for Microsoft Playwright Service.
   - Obtain your service URL and access token.
   - Copy .env.example to .env and fill in your values:

     PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
     PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your_access_token

----------------------------------------
📌 How to Use
----------------------------------------
1️⃣ Run the script:
    python connectOverCDPScript.py

2️⃣ The script will:
   - Connect to the remote browser
   - Navigate to example.com
   - Take a screenshot
   - Extract page content
   - Click a link
"""

import asyncio
import os
import uuid
import aiohttp
from playwright.async_api import async_playwright
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from playwright_service_client import get_cdp_endpoint, _parse_url


async def main():
    """Connect to a remote browser via CDP and perform basic operations."""
    
    # Generate a unique run ID
    run_id = os.getenv('PLAYWRIGHT_RUN_ID', str(uuid.uuid4()))
    
    # Create test run for tracking
    region, workspace_id = _parse_url(os.getenv('PLAYWRIGHT_SERVICE_URL', ''))
    url = f'https://{region}.reporting.api.playwright.microsoft.com/playwrightworkspaces/{workspace_id}/test-runs/{run_id}?api-version=2025-09-01'
    payload = {'displayName': run_id, 'ciConfig': {'providerName': 'GITHUB'}}
    headers = {'Content-Type': 'application/merge-patch+json', 'Authorization': f'Bearer {os.getenv("PLAYWRIGHT_SERVICE_ACCESS_TOKEN", "")}'}
    async with aiohttp.ClientSession() as session:
        response = await session.patch(url, json=payload, headers=headers)
        if response.status >= 200 and response.status < 300:
            print(f'✅ Test run created: {run_id}')
        else:
            text = await response.text()
            print(f'⚠️  Test run creation failed: {response.status} - {text}')
    
    print('🔗 Connecting to Microsoft Playwright Service...')
    print(f'📊 Run ID: {run_id}')
    
    # Step 1: Get CDP endpoint from the service with run ID
    # This step will be simplified once OSS redirect support is added
    cdp_url = await get_cdp_endpoint()
    # Append run ID to track this session
    separator = '&' if '?' in cdp_url else '?'
    cdp_url = f"{cdp_url}{separator}runId={run_id}"
    print(f'✅ Got CDP endpoint')
    
    # Step 2: Connect to remote browser using Playwright
    # User-Agent header override will be removed after service fix
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            cdp_url,
            headers={"User-Agent": "Chrome-DevTools-Protocol/1.3"}
        )
        print(f"✅ Connected to remote browser")
        
        # Step 3: Use the browser
        context = await browser.new_context()
        page = await context.new_page()
        
        # Example: Navigate and take screenshot
        print("📄 Navigating to example.com...")
        await page.goto("https://example.com")
        
        title = await page.title()
        print(f"📌 Page title: {title}")
        
        # Take a screenshot
        await page.screenshot(path="screenshot.png")
        print("📸 Screenshot saved to screenshot.png")
        
        # Example: Extract content
        heading = await page.locator("h1").text_content()
        print(f"📝 Page heading: {heading}")
        
        # Example: Click a link
        await page.click("a")
        await page.wait_for_load_state("networkidle")
        print(f"🔗 Navigated to: {page.url}")
        
        # Cleanup
        await context.close()
        await browser.close()
        print("✅ Done!")


if __name__ == "__main__":
    asyncio.run(main())

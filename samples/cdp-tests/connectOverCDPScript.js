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
from playwright.async_api import async_playwright
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from playwright_service_client import get_cdp_endpoint


async def main():
    """Connect to a remote browser via CDP and perform basic operations."""
    
    print("🔗 Connecting to Microsoft Playwright Service...")
    
    # Step 1: Get CDP endpoint from the service
    cdp_url = await get_cdp_endpoint()
    print(f"✅ Got CDP endpoint")
    
    # Step 2: Connect to remote browser using Playwright
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

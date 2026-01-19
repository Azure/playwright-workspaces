"""
Playwright Testing Example - Microsoft Playwright Service

Run Playwright tests on remote browsers via CDP (Chrome DevTools Protocol).

----------------------------------------
📌 Prerequisites
----------------------------------------
1️⃣ Python environment with the following packages installed:
   pip install playwright aiohttp pytest pytest-asyncio python-dotenv

2️⃣ Playwright Remote Browser Setup
   - Sign up for Microsoft Playwright Service.
   - Obtain your service URL and access token.
   - Copy .env.example to .env and fill in your values:

     PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
     PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your_access_token

----------------------------------------
📌 How to Use
----------------------------------------
1️⃣ Run as a standalone script:
    python test_runner.py

2️⃣ Run with pytest:
    pytest test_runner.py -v

3️⃣ Import and use in your own tests:
    from test_runner import remote_page
    
    async with remote_page() as page:
        await page.goto("https://example.com")
        assert await page.title() == "Example Domain"
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from playwright.async_api import async_playwright, Browser, Page
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import the shared module
from playwright_service_client import get_cdp_endpoint


# ============================================================================
# Context Managers for Easy Test Setup
# ============================================================================

@asynccontextmanager
async def remote_browser() -> AsyncGenerator[Browser, None]:
    """
    Context manager for quick access to a remote browser.
    
    Example:
        async with remote_browser() as browser:
            page = await browser.new_page()
            await page.goto("https://example.com")
    """
    cdp_url = await get_cdp_endpoint()
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(cdp_url)
        try:
            yield browser
        finally:
            await browser.close()


@asynccontextmanager
async def remote_page() -> AsyncGenerator[Page, None]:
    """
    Context manager for quick access to a remote page.
    
    Example:
        async with remote_page() as page:
            await page.goto("https://example.com")
            assert await page.title() == "Example Domain"
    """
    async with remote_browser() as browser:
        context = await browser.new_context()
        page = await context.new_page()
        try:
            yield page
        finally:
            await context.close()


# ============================================================================
# Example Tests
# ============================================================================

async def test_example_domain():
    """Test that example.com loads correctly."""
    async with remote_page() as page:
        await page.goto("https://example.com")
        
        title = await page.title()
        assert title == "Example Domain", f"Expected 'Example Domain', got '{title}'"
        
        heading = await page.locator("h1").text_content()
        assert heading == "Example Domain"
        
        print("✅ test_example_domain passed!")


async def test_navigation():
    """Test basic navigation functionality."""
    async with remote_page() as page:
        await page.goto("https://example.com")
        initial_url = page.url
        
        # Click the "More information..." link
        await page.click("a")
        await page.wait_for_load_state("networkidle")
        
        assert page.url != initial_url, "URL should have changed after clicking link"
        print("✅ test_navigation passed!")


async def test_screenshot():
    """Test taking a screenshot."""
    async with remote_page() as page:
        await page.goto("https://example.com")
        
        screenshot = await page.screenshot()
        assert len(screenshot) > 0, "Screenshot should not be empty"
        
        print(f"✅ test_screenshot passed! ({len(screenshot)} bytes)")


# ============================================================================
# Test Runner
# ============================================================================

async def run_all_tests():
    """Run all example tests."""
    print("=" * 50)
    print("🧪 Running Playwright Service Tests")
    print("=" * 50)
    
    tests = [
        ("Example Domain", test_example_domain),
        ("Navigation", test_navigation),
        ("Screenshot", test_screenshot),
    ]
    
    passed = failed = 0
    
    for name, test_func in tests:
        print(f"\n📋 {name}")
        print("-" * 30)
        try:
            await test_func()
            passed += 1
        except Exception as e:
            print(f"❌ Failed: {e}")
            failed += 1
    
    print(f"\n{'=' * 50}")
    print(f"📊 Results: {passed} passed, {failed} failed")
    print("=" * 50)
    
    return failed == 0


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    print("🧪 Playwright Testing - Microsoft Playwright Service\n")
    success = asyncio.run(run_all_tests())
    exit(0 if success else 1)

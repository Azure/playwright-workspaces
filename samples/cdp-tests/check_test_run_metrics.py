"""
Scrape Test Run Metrics from Azure Portal - Microsoft Playwright Service

Uses CDP to scrape the Azure Portal and extract:
- Duration
- Max Concurrent Sessions

Prerequisites:
- PLAYWRIGHT_SERVICE_URL and PLAYWRIGHT_SERVICE_ACCESS_TOKEN set
- Azure Portal credentials (will prompt for login)

Usage:
    python check_test_run_metrics.py --run-id 60ada697-419f-499f-93f3-d971e125ecff
"""

import asyncio
import sys
import os
import re
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()
from playwright_service_client import get_cdp_endpoint, _parse_url


async def scrape_test_run_metrics(run_id: str, workspace_id: str, region: str, use_saved_state: bool = True):
    """
    Connect via CDP and scrape Azure Portal for test run metrics.
    """
    print(f"🔗 Connecting to browser via CDP...")
    
    # Get CDP endpoint
    cdp_url = await get_cdp_endpoint()
    
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            cdp_url,
            headers={"User-Agent": "Chrome-DevTools-Protocol/1.3"}
        )
        print("✅ Connected to remote browser\n")
        
        # Use browser context with saved authentication state if available
        auth_file = "azure_auth_state.json"
        context_options = {}
        
        if use_saved_state and os.path.exists(auth_file):
            print(f"🔑 Loading saved authentication state from {auth_file}")
            context_options["storage_state"] = auth_file
        
        context = await browser.new_context(**context_options)
        page = await context.new_page()
        
        # Navigate to Azure Portal test runs page
        portal_url = f"https://portal.azure.com/#view/Microsoft_Azure_PlaywrightTesting/PlaywrightTestingResourceBlade/~/testRuns/resourceId/%2Fsubscriptions%2F<subscription>%2FresourceGroups%2F<resourceGroup>%2Fproviders%2FMicrosoft.AzurePlaywrightService%2Faccounts%2F{workspace_id}"
        
        print(f"🌐 Navigating to Azure Portal...")
        print(f"   URL: Test Runs page")
        
        try:
            # Try to navigate to the portal
            await page.goto("https://portal.azure.com", timeout=60000)
            
            # Check if we need to log in
            print("\n🔍 Checking authentication status...")
            
            # Wait a bit for redirect or login page
            await asyncio.sleep(3)
            
            current_url = page.url
            print(f"   Current URL: {current_url}")
            
            # If we're on a login page, wait for user to complete login
            if 'login.microsoftonline.com' in current_url or 'login.live.com' in current_url:
                print("\n🔐 LOGIN REQUIRED!")
                print("=" * 70)
                print("Please log in to Azure Portal in the browser window.")
                print("The script will wait for you to complete the login process.")
                print("=" * 70)
                
                # Wait for navigation away from login page (up to 5 minutes)
                try:
                    print("\n⏳ Waiting for login to complete...")
                    await page.wait_for_url("https://portal.azure.com/**", timeout=300000)
                    print("✅ Login successful!")
                except:
                    print("⚠️ Timeout waiting for login. Continuing anyway...")
                
                # Additional wait for portal to fully load
                await asyncio.sleep(5)
            else:
                print("✅ Already authenticated!")
            
            await page.wait_for_load_state("networkidle", timeout=30000)
            
            # Wait for Azure Portal to load
            await page.wait_for_selector('body', timeout=60000)
            
            print("\n🔍 Looking for test run data...")
            print(f"   Run ID: {run_id}")
            print("\n💡 TIP: You can manually navigate to your test runs page in the browser")
            print("   The script will search for the run ID on whatever page you're on.")
            
            # Give user time to navigate if needed
            print("\n⏸️ Waiting 10 seconds for you to navigate to the test runs page...")
            print("   (or press Ctrl+C to skip)")
            try:
                await asyncio.sleep(10)
            except KeyboardInterrupt:
                print("\n   Skipped. Continuing...")
            
            # Search for the run ID on the current page
            await page.keyboard.press('Control+F')
            await asyncio.sleep(1)
            await page.keyboard.type(run_id)
            await asyncio.sleep(2)
            
            # Try to extract Duration and Max Concurrent Sessions
            # These selectors may need adjustment based on actual portal HTML
            
            # Method 1: Try to find by text content
            page_content = await page.content()
            
            # Look for Duration pattern
            duration_match = re.search(r'Duration[:\\s]*([\\d:]+)', page_content, re.IGNORECASE)
            max_sessions_match = re.search(r'Max Concurrent Sessions[:\\s]*(\\d+)', page_content, re.IGNORECASE)
            
            # Method 2: Try to find in table
            try:
                # Wait for table to load
                await page.wait_for_selector('table, [role="grid"]', timeout=10000)
                
                # Get all table rows
                rows = await page.locator('tr, [role="row"]').all()
                
                duration = None
                max_concurrent = None
                
                for row in rows:
                    text = await row.inner_text()
                    if run_id in text:
                        print(f"\n✅ Found test run row:")
                        print(f"   {text}")
                        
                        # Extract duration (format: HH:MM:SS or MM:SS)
                        duration_match = re.search(r'(\\d{2}:\\d{2}:\\d{2}|\\d{2}:\\d{2})', text)
                        if duration_match:
                            duration = duration_match.group(1)
                        
                        # Extract max concurrent sessions (single digit or more)
                        max_match = re.search(r'\\b(\\d+)\\b', text.split('Duration')[-1] if 'Duration' in text else text)
                        if max_match:
                            max_concurrent = max_match.group(1)
                        
                        break
                
                if duration or max_concurrent:
                    print(f"\n{'='*70}")
                    print("📊 TEST RUN METRICS")
                    print(f"{'='*70}")
                    print(f"📋 Run ID:               {run_id}")
                    if duration:
                        print(f"⏱️  Duration:             {duration}")
                    if max_concurrent:
                        print(f"🔝 Max Concurrent Sessions: {max_concurrent}")
                    print(f"{'='*70}\n")
                else:
                    print("\n⚠️  Could not extract metrics from the page")
                    print("   The portal structure may have changed")
                    
            except Exception as e:
                print(f"\n⚠️  Could not locate table: {e}")
                print("   Trying alternative extraction methods...")
                
                # Method 3: Take screenshot for manual inspection
                screenshot_path = "test_run_page.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                print(f"\n📸 Screenshot saved to: {screenshot_path}")
                print("   Please check the screenshot to verify the page loaded correctly")
            
            # Keep browser open for inspection
            print("\n⏸️  Browser will stay open for 10 seconds for inspection...")
            await asyncio.sleep(10)
            
            # Save authentication state for next time
            auth_file = "azure_auth_state.json"
            await context.storage_state(path=auth_file)
            print(f"💾 Saved authentication state to {auth_file}")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            
            # Take screenshot on error
            try:
                screenshot_path = "error_screenshot.png"
                await page.screenshot(path=screenshot_path)
                print(f"📸 Error screenshot saved to: {screenshot_path}")
            except:
                pass
        
        finally:
            await context.close()
            await browser.close()
            print("\n✅ Done")


async def main():
    import argparse
    parser = argparse.ArgumentParser(description='Scrape test run metrics from Azure Portal via CDP')
    parser.add_argument('--run-id', required=True, help='Test run ID to look up')
    parser.add_argument('--login', action='store_true', help='Force fresh login (ignore saved credentials)')
    args = parser.parse_args()
    
    # Check environment
    service_url = os.getenv("PLAYWRIGHT_SERVICE_URL")
    access_token = os.getenv("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")
    
    if not service_url:
        print("❌ Error: PLAYWRIGHT_SERVICE_URL not set")
        sys.exit(1)
    if not access_token:
        print("❌ Error: PLAYWRIGHT_SERVICE_ACCESS_TOKEN not set")
        sys.exit(1)
    
    # Parse workspace info
    region, workspace_id = _parse_url(service_url)
    
    # Use saved auth unless --login flag is specified
    use_saved_state = not args.login
    
    await scrape_test_run_metrics(args.run_id, workspace_id, region, use_saved_state)


if __name__ == "__main__":
    asyncio.run(main())

"""
Microsoft Playwright Service - Python Client

Get a CDP endpoint URL to connect to remote browsers.

----------------------------------------
📌 Prerequisites
----------------------------------------
pip install aiohttp python-dotenv

----------------------------------------
📌 Environment Variables
----------------------------------------
PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your_access_token

----------------------------------------
📌 How to Use
----------------------------------------
    from playwright_service_client import get_cdp_endpoint
    
    cdp_url = await get_cdp_endpoint()
    browser = await playwright.chromium.connect_over_cdp(cdp_url)
"""

import re
import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()


class PlaywrightServiceError(Exception):
    """Exception for Playwright Service errors."""
    pass


# URL pattern: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
_URL_PATTERN = re.compile(
    r'wss://(\w+)\.api\.playwright\.microsoft\.com/playwrightworkspaces/([^/]+)/browsers'
)


def _parse_url(url: str) -> tuple[str, str]:
    """Extract region and workspace ID from service URL."""
    match = _URL_PATTERN.match(url)
    if not match:
        raise PlaywrightServiceError(
            f"Invalid PLAYWRIGHT_SERVICE_URL format: {url}\n"
            f"Expected: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers"
        )
    return match.group(1), match.group(2)


async def get_cdp_endpoint(
    service_url: str | None = None,
    access_token: str | None = None,
    os_name: str = "Linux",
    api_version: str = "2025-09-01"
) -> str:
    """
    Get a CDP endpoint URL from Microsoft Playwright Service.
    
    Args:
        service_url: Service URL (defaults to PLAYWRIGHT_SERVICE_URL env var)
        access_token: Access token (defaults to PLAYWRIGHT_SERVICE_ACCESS_TOKEN env var)
        os_name: Browser OS - "Linux" or "Windows" (default: Linux)
        api_version: API version (default: 2025-09-01)
        
    Returns:
        WebSocket URL for CDP connection
        
    Example:
        cdp_url = await get_cdp_endpoint()
        browser = await playwright.chromium.connect_over_cdp(cdp_url)
    """
    # Get credentials from env vars if not provided
    service_url = service_url or os.getenv("PLAYWRIGHT_SERVICE_URL")
    access_token = access_token or os.getenv("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")
    
    if not service_url:
        raise PlaywrightServiceError(
            "PLAYWRIGHT_SERVICE_URL environment variable is not set.\n"
            "Expected: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers"
        )
    if not access_token:
        raise PlaywrightServiceError(
            "PLAYWRIGHT_SERVICE_ACCESS_TOKEN environment variable is not set."
        )
    
    # Parse URL to get region and workspace ID
    region, workspace_id = _parse_url(service_url)
    
    # Build API URL
    api_url = (
        f"https://{region}.api.playwright.microsoft.com"
        f"/playwrightworkspaces/{workspace_id}/browsers"
        f"?api-version={api_version}&os={os_name}"
    )
    
    # Make request
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(api_url, headers=headers) as response:
            if response.status == 401:
                raise PlaywrightServiceError("Authentication failed. Check your access token.")
            if response.status == 403:
                raise PlaywrightServiceError("Access forbidden. Check your permissions.")
            if response.status != 200:
                text = await response.text()
                raise PlaywrightServiceError(f"Failed to get browser endpoint: HTTP {response.status}\n{text}")
            
            data = await response.json()
            return data["endpoint"]

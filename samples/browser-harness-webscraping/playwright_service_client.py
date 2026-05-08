"""
Microsoft Playwright Service - Python Client

Get a Service URL to connect to get remote CDP browsers.

----------------------------------------
📌 Prerequisites
----------------------------------------
pip install python-dotenv

----------------------------------------
📌 Environment Variables
----------------------------------------
PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your_access_token

----------------------------------------
📌 How to Use
----------------------------------------
    from playwright_service_client import get_cdp_browsers_endpoint
    
    endpoint = get_cdp_browsers_endpoint()
"""

import re
import os
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


def get_cdp_browsers_endpoint(
    service_url: str | None = None,
    access_token: str | None = None
) -> str:
    """
    Get the SERVICE_URL that an agent can use to get browsers that it can connect to via CDP
    Args:
        service_url: Service URL (defaults to PLAYWRIGHT_SERVICE_URL env var)
        access_token: Access token (defaults to PLAYWRIGHT_SERVICE_ACCESS_TOKEN env var)
        
    Returns:
        URL for getting CDP browsers
        
    Example:
        SERVICE_URL = get_cdp_browsers_endpoint()
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
        f"?os=linux&browser=chromium&playwrightVersion=cdp&shouldRedirect=false&accessKey={access_token}")

    return api_url
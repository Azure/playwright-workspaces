"""
Global pytest configuration and fixtures for Playwright tests.
"""
import pytest
from playwright.sync_api import Page, expect
import os

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, use system env vars only


@pytest.fixture(scope="session")
def connect_options():
    """Configure connection to Playwright Service for remote browsers."""
    service_url = os.getenv("PLAYWRIGHT_SERVICE_URL")
    if service_url:
        import uuid
        
        # Generate a unique run ID for this test session
        run_id = os.getenv("PLAYWRIGHT_SERVICE_RUN_ID", str(uuid.uuid4()))
        
        # Get OS information
        os_name = 'linux'
        
        # API version
        api_version = "2025-09-01"
        
        # Construct the WebSocket endpoint with query parameters
        ws_endpoint = f"{service_url}?runId={run_id}&os={os_name}&api-version={api_version}"
        
        print(f"🔗 WebSocket endpoint: {ws_endpoint}")
        
        connect_opts = {
            "ws_endpoint": ws_endpoint,
            "headers": {
                "Authorization": f"Bearer {os.getenv('PLAYWRIGHT_SERVICE_ACCESS_TOKEN', '')}"
            },
            "timeout": 3 * 60 * 1000,  # 3 minutes
            "expose_network": "<loopback>",  # Use loopback to expose network
        }
        return connect_opts
    else:
        print("🖥️  Using local browsers (PLAYWRIGHT_SERVICE_URL not set)")
        return None


def pytest_configure(config):
    """Create test results directory."""
    os.makedirs("test-results", exist_ok=True)
    os.makedirs("test-results/screenshots", exist_ok=True)
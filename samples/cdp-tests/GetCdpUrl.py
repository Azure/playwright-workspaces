import aiohttp
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

WORKSPACE_ID = os.getenv("PLAYWRIGHT_SERVICE_WORKSPACE_ID")
REGION = os.getenv("PLAYWRIGHT_SERVICE_REGION")
AUTH_TOKEN = os.getenv("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")

if not all([WORKSPACE_ID, REGION, AUTH_TOKEN]):
    raise RuntimeError(
        "Missing required environment variables: "
        "PLAYWRIGHT_SERVICE_WORKSPACE_ID, PLAYWRIGHT_SERVICE_REGION, PLAYWRIGHT_SERVICE_ACCESS_TOKEN"
    )

async def get_remote_browser_websocket_url():
    api_url = (
        f"https://{REGION}.api.playwright.microsoft.com/"
        f"playwrightworkspaces/{WORKSPACE_ID}/browsers"
        "?os=linux&browser=chromium&playwrightVersion=cdp&shouldRedirect=false"
    )
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Accept": "application/json",
        "User-Agent": "PlaywrightService-CDP-Client/1.0"
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(api_url, headers=headers) as response:
            data = await response.json()
            ws_url = data.get('sessionUrl') or data.get('url')
            if ws_url and ws_url.startswith('wss://'):
                return ws_url
            # If the first call returns an HTTP URL, make a second call
            async with session.get(ws_url, headers=headers) as response2:
                data2 = await response2.json()
                final_ws_url = (
                    data2.get('sessionUrl') or
                    data2.get('url') or
                    data2.get('webSocketUrl') or
                    data2.get('wsEndpoint')
                )
                return final_ws_url

# Usage example
async def main():
    ws_url = await get_remote_browser_websocket_url()
    print("WebSocket URL:", ws_url)

if __name__ == "__main__":
    asyncio.run(main())

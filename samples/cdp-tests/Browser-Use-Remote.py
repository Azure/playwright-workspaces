"""
Amazon Product Search with Browser-Use + Hosted LLM (Azure OpenAI)

This script lets you search Amazon for products using a remote Playwright browser
(Microsoft Playwright Cloud) and a hosted LLM (Azure OpenAI).

----------------------------------------
📌 Prerequisites
----------------------------------------
1️⃣ Python environment with the following packages installed:
   pip install aiohttp pydantic browser-use

2️⃣ Hosted LLM Setup (Azure OpenAI)
   - Create an Azure OpenAI resource in the Azure Portal.
   - Deploy a model (e.g., gpt-35-turbo).
   - Set the following environment variables:

     export AZURE_OPENAI_API_KEY="your_api_key_here"
     export AZURE_OPENAI_ENDPOINT="https://<your-resource-name>.openai.azure.com/"
     export AZURE_OPENAI_API_VERSION="2023-07-01-preview"

3️⃣ Playwright Remote Browser Setup
   - Sign up for Microsoft Playwright Cloud.
   - Obtain your service URL and access token.
   - Set the following environment variables:

     export PLAYWRIGHT_SERVICE_URL="wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers"
     export PLAYWRIGHT_SERVICE_ACCESS_TOKEN="your_access_token"

----------------------------------------
📌 How to Use
----------------------------------------
1️⃣ Run the script:
    python Browser-Use-Remote.py

2️⃣ Enter product keywords when prompted.
   (Default is "wireless mouse" if you press Enter.)

3️⃣ The script will connect to the remote browser and hosted LLM to perform
   the search and print structured results in the terminal.
"""

import asyncio
import aiohttp
import os
import re
from pydantic import BaseModel, Field
from browser_use import Agent
from browser_use.llm import AzureChatOpenAI
from browser_use.browser.session import BrowserSession
from browser_use.browser.profile import BrowserProfile

# --- Azure OpenAI Setup ---
def get_llm():
    """Initialize the hosted Azure OpenAI LLM."""
    return AzureChatOpenAI(
        model_name="gpt-35-turbo",
        openai_api_key=os.environ["AZURE_OPENAI_API_KEY"],
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        deployment_name="gpt-35-turbo",
        max_tokens=3000,
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    )

# --- Remote Playwright Browser ---
def parse_service_url(service_url: str) -> tuple[str, str]:
    """
    Parse the Playwright Service URL to extract region and workspace ID.
    Expected format: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers
    """
    pattern = r'wss://(\w+)\.api\.playwright\.microsoft\.com/playwrightworkspaces/([^/]+)/browsers'
    match = re.match(pattern, service_url)
    if not match:
        raise ValueError(
            f"Invalid PLAYWRIGHT_SERVICE_URL format. Expected: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers"
        )
    return match.group(1), match.group(2)  # region, workspaceId

async def create_remote_browser_session():
    """
    Create a remote Playwright browser session.
    Fetches the WebSocket URL internally and returns a BrowserSession.
    """
    SERVICE_URL = os.getenv("PLAYWRIGHT_SERVICE_URL")
    ACCESS_TOKEN = os.getenv("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")

    if not SERVICE_URL:
        raise ValueError("PLAYWRIGHT_SERVICE_URL environment variable is not set")
    if not ACCESS_TOKEN:
        raise ValueError("PLAYWRIGHT_SERVICE_ACCESS_TOKEN environment variable is not set")

    # Parse region and workspace ID from the service URL
    region, workspace_id = parse_service_url(SERVICE_URL)

    api_url = f"https://{region}.api.playwright.microsoft.com/playwrightworkspaces/{workspace_id}/browsers?os=linux&browser=chromium&playwrightVersion=cdp"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Accept": "application/json",
        "User-Agent": "PlaywrightService-CDP-Client/1.0"
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(api_url, headers=headers) as response:
            if response.status != 200:
                text = await response.text()
                raise Exception(f"Failed to get remote browser URL: {response.status}, {text}")
            data = await response.json()
            ws_url = data['endpoint']  # API returns 'endpoint', not 'wsEndpoint'

    profile = BrowserProfile(cdp_url=ws_url)
    return BrowserSession(browser_profile=profile)

# --- Data Models ---
class Product(BaseModel):
    name: str
    price: str
    rating: str | None = None
    reviews: str | None = None
    url: str

class ProductSearchResults(BaseModel):
    items: list[Product] = []

# --- Amazon Search Function ---
async def search_amazon_remote(keywords: str = 'wireless mouse'):
    """Search Amazon using remote browser + hosted Azure OpenAI LLM"""
    print(f"🎯 Searching Amazon for: {keywords}")
    print("🔧 Using: Remote Playwright Browser + Azure OpenAI LLM")

    browser_session = await create_remote_browser_session()
    llm = get_llm()

    agent = Agent(
        task=f"""
        Go to Amazon (https://www.amazon.com) and search for "{keywords}".
        Collect the top 5 product results.
        For each product, extract:
        - Product name
        - Price
        - Rating (stars)
        - Number of reviews
        - Product page URL
        Return structured output.
        """,
        llm=llm,
        browser_session=browser_session,
        output_model_schema=ProductSearchResults,
    )

    print("🎯 Starting Amazon search...")
    result = await agent.run()
    print("✅ Search completed successfully!")
    return result

# --- Main ---
async def main():
    print("🛒 Amazon Product Search with Browser-Use + Azure OpenAI")
    print("=" * 50)
    
    keywords = input('Enter product keywords (default "wireless mouse"): ').strip() or 'wireless mouse'

    try:
        result = await search_amazon_remote(keywords)

        if result and result.structured_output:
            products = result.structured_output
            print(f'\n{"=" * 70}')
            print(f'Amazon Search Results for "{keywords}"')
            print(f'{"=" * 70}\n')
            for i, item in enumerate(products.items, 1):
                print(f'{i}. Name: {item.name}')
                print(f'   Price: {item.price}')
                if item.rating: print(f'   Rating: {item.rating}')
                if item.reviews: print(f'   Reviews: {item.reviews}')
                print(f'   URL: {item.url}')
                print(f'{"-" * 70}')
        else:
            print("❌ No products found or search failed")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    asyncio.run(main())

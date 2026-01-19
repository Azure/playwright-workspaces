"""
Amazon Product Search with Browser-Use + Hosted LLM (Azure OpenAI)

This script lets you search Amazon for products using a remote Playwright browser
(Microsoft Playwright Cloud) and a hosted LLM (Azure OpenAI).

----------------------------------------
📌 Prerequisites
----------------------------------------
1️⃣ Python environment with the following packages installed:
   pip install aiohttp pydantic browser-use python-dotenv

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
    python example_ai_agent.py

2️⃣ Enter product keywords when prompted.
   (Default is "wireless mouse" if you press Enter.)

3️⃣ The script will connect to the remote browser and hosted LLM to perform
   the search and print structured results in the terminal.
"""

import asyncio
import os
from pydantic import BaseModel
from dotenv import load_dotenv
from browser_use import Agent
from browser_use.llm import AzureChatOpenAI
from browser_use.browser.session import BrowserSession
from browser_use.browser.profile import BrowserProfile

# Load environment variables from .env file
load_dotenv()

# Import the shared module
from playwright_service_client import get_cdp_endpoint


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
async def create_remote_browser_session() -> BrowserSession:
    """
    Create a remote Playwright browser session.
    Returns a BrowserSession configured for browser-use.
    """
    cdp_url = await get_cdp_endpoint()
    print(f"🔗 Connected to Playwright Service")
    
    profile = BrowserProfile(cdp_url=cdp_url)
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

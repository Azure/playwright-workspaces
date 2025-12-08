import asyncio
import aiohttp
import os
from pydantic import BaseModel, Field
from browser_use import Agent
from browser_use.llm import ChatOllama
from browser_use.browser.session import BrowserSession
from browser_use.browser.profile import BrowserProfile

# Remote browser connection details
WORKSPACE_ID = os.getenv("PLAYWRIGHT_SERVICE_WORKSPACE_ID")
REGION = os.getenv("PLAYWRIGHT_SERVICE_REGION")
AUTH_TOKEN = os.getenv("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")


async def get_remote_browser_websocket_url() -> str:
    """Get the WebSocket URL for the remote Playwright browser"""
    api_url = f"https://{REGION}.api.playwright.microsoft.com/playwrightworkspaces/{WORKSPACE_ID}/browsers?os=linux&browser=chromium&playwrightVersion=cdp"
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Accept": "application/json",
        "User-Agent": "PlaywrightService-CDP-Client/1.0"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(api_url, headers=headers) as response:
            if response.status != 200:
                response_text = await response.text()
                raise Exception(f"API call failed with status {response.status}: {response_text}")
            
            data = await response.json()
            return data['wsEndpoint']


async def create_remote_browser_session(ws_url: str):
    """Create remote browser session using WebSocket URL"""
    profile = BrowserProfile(cdp_url=ws_url)
    return BrowserSession(browser_profile=profile)


class Product(BaseModel):
    """A single Amazon product"""
    name: str = Field(..., description='Product name')
    price: str = Field(..., description='Displayed price text')
    rating: str | None = Field(None, description='Rating stars')
    reviews: str | None = Field(None, description='Number of reviews')
    url: str = Field(..., description='Product page URL')


class ProductSearchResults(BaseModel):
    """All found products"""
    items: list[Product] = Field(default_factory=list, description='List of found products')


async def search_amazon_remote(keywords: str = 'wireless mouse'):
    """Search Amazon using remote Playwright browser + local Ollama LLM"""
    print(f"🎯 Searching Amazon for: {keywords}")
    print("🔧 Using: Remote Playwright Browser + Local Ollama LLM")
    
    # Get remote browser WebSocket URL
    print("📡 Getting remote browser WebSocket URL...")
    ws_url = await get_remote_browser_websocket_url()
    
    # Create remote browser session
    print("🔌 Creating remote browser session...")
    browser_session = await create_remote_browser_session(ws_url)
    
    # Initialize Ollama LLM
    print("🤖 Initializing Ollama LLM...")
    llm = ChatOllama(
        model="llama3.2:3b",
        host="http://localhost:11434"
    )
    
    # Create agent
    print("🤖 Creating Agent...")
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
        Return structured output with all the details.
        """,
        llm=llm,
        browser_session=browser_session,
        output_model_schema=ProductSearchResults,
    )
    
    print("🎯 Starting Amazon search...")
    result = await agent.run()
    print("✅ Search completed successfully!")
    return result


async def search_amazon_local(keywords: str = 'wireless mouse'):
    """Search Amazon using local browser as fallback"""
    print(f"🎯 Searching Amazon for: {keywords}")
    print("🔧 Using: Local Browser + Ollama LLM")
    
    # Initialize Ollama LLM
    llm = ChatOllama(
        model="llama3.2:3b",
        host="http://localhost:11434"
    )
    
    # Create agent with local browser
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
        output_model_schema=ProductSearchResults,
    )
    
    print("🎯 Starting search...")
    result = await agent.run()
    print("✅ Search completed successfully!")
    return result


async def main():
    print("🛒 Amazon Product Search with Browser-Use + Ollama")
    print("=" * 50)
    
    # Get user input
    keywords = input('Enter product keywords (or press Enter for "wireless mouse"): ').strip()
    if not keywords:
        keywords = 'wireless mouse'
    
    # Ask user for browser choice
    print("\nChoose browser option:")
    print("1. Remote Browser (Microsoft Playwright Cloud)")
    print("2. Local Browser")
    
    choice = input("Enter choice (1 or 2, default=2): ").strip()
    
    try:
        if choice == '1':
            result = await search_amazon_remote(keywords)
        else:
            result = await search_amazon_local(keywords)

        # Display results
        if result and result.structured_output:
            products = result.structured_output
            print(f'\n{"=" * 70}')
            print(f'Amazon Search Results for "{keywords}"')
            print(f'{"=" * 70}\n')

            for i, item in enumerate(products.items, 1):
                print(f'{i}. Name: {item.name}')
                print(f'   Price: {item.price}')
                if item.rating:
                    print(f'   Rating: {item.rating}')
                if item.reviews:
                    print(f'   Reviews: {item.reviews}')
                print(f'   URL: {item.url}')
                print(f'{"-" * 70}')
        else:
            print("❌ No products found or search failed")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == '__main__':
    asyncio.run(main())

from playwright.sync_api import sync_playwright
from playwright_service import get_connect_options

with sync_playwright() as p:
    wsEndpoint, headers = get_connect_options()
    browser = p.chromium.connect(
        ws_endpoint=wsEndpoint,
        headers=headers,
        timeout=30000,
        expose_network="<loopback>",
    )
    page = browser.new_page()
    page.goto("https://playwright.dev")
    print(page.title())
    browser.close()
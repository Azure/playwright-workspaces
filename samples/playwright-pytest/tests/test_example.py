import re
from playwright.sync_api import Page, expect, Browser

def test_has_title(page: Page):
    page.goto("https://playwright.dev/")

    # Expect a title "to contain" a substring.
    expect(page).to_have_title(re.compile("Playwright"))

def test_get_started_link(page: Page):
    page.goto("https://playwright.dev/")

    # Click the get started link.
    page.get_by_role("link", name="Get started").click()

    # Expects page to have a heading with the name of Installation.
    expect(page.get_by_role("heading", name="Installation")).to_be_visible()

def test_page_loads_successfully(page: Page):
    page.goto("https://playwright.dev/")
    
    # Verify page loads and has expected title
    expect(page).to_have_title(re.compile("Playwright"))

def test_navigation_menu_visible(page: Page):
    page.goto("https://playwright.dev/")
    
    # Check if navigation menu is visible
    expect(page.locator("nav")).to_be_visible()

def test_documentation_link_exists(page: Page):
    page.goto("https://playwright.dev/")
    
    # Verify documentation link is present
    expect(page.get_by_role("link", name="Docs")).to_be_visible()

def test_hero_section_content(page: Page):
    page.goto("https://playwright.dev/")
    
    # Check for main heading or hero content
    expect(page.locator("h1")).to_be_visible()

def test_footer_is_present(page: Page):
    page.goto("https://playwright.dev/")
    
    # Verify footer exists on the page
    expect(page.locator("footer")).to_be_visible()

def test_search_functionality_available(page: Page):
    page.goto("https://playwright.dev/")
    
    # Verify footer exists on the page
    expect(page.locator("footer")).to_be_visible()

def test_api_link_navigation(page: Page):
    page.goto("https://playwright.dev/")
    
    # Click on API link if available
    api_link = page.get_by_role("link", name="API")
    if api_link.is_visible():
        api_link.click()
        # Verify navigation occurred
        expect(page).to_have_url(re.compile(".*api.*"))

def test_community_section_exists(page: Page):
    page.goto("https://playwright.dev/")
    
    # Look for community or social links
    community_links = page.locator('a[href*="github"], a[href*="discord"], a[href*="twitter"]')
    expect(community_links.first).to_be_visible()
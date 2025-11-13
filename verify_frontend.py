
from playwright.sync_api import sync_playwright

def verify_frontend(page):
    page.goto("http://localhost:8000")

    # Click the button to enter the studio
    page.click("#cta-button")

    # Manually remove the hero overlay using JavaScript execution in the browser context
    page.evaluate("document.getElementById('hero-overlay').remove()")

    # Take a screenshot
    page.screenshot(path="screenshot.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_frontend(page)
        finally:
            browser.close()

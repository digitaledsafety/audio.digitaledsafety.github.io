from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Wait for the button and click it
        cta_button = page.locator("#cta-button")
        expect(cta_button).to_be_visible()
        cta_button.click()

        # Wait for the main editor to be visible, which means the overlay is gone
        rete_container = page.locator("#rete-container")
        expect(rete_container).to_be_visible()

        # A small extra wait for the nodes to render
        page.wait_for_timeout(1000)

        page.screenshot(path="verification.png")
        browser.close()

if __name__ == "__main__":
    run()

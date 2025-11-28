from playwright.sync_api import sync_playwright, TimeoutError

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:8000", timeout=30000)

            # Wait for the overlay to exist, then forcefully remove it.
            page.wait_for_selector("#hero-overlay", state="attached", timeout=10000)
            page.evaluate("document.getElementById('hero-overlay').remove()")

            # Now, wait for the main editor container to be ready
            rete_container = page.locator("#rete-container")
            rete_container.wait_for(state="visible", timeout=10000)

            # A small delay to ensure rendering is complete before screenshot
            page.wait_for_timeout(2000)

            page.screenshot(path="/app/verification.png")
            print("Screenshot taken successfully.")
        except TimeoutError as e:
            print(f"A timeout error occurred: {e}")
            print("Page content at time of error:")
            print(page.content())
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()

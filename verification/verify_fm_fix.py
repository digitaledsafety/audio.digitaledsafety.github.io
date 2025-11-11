
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:8000")

            # Wait for the editor to be ready
            await expect(page.locator("#rete")).to_be_visible(timeout=10000)

            # Click the play button to start the audio context
            # Using a more robust locator
            await page.locator("button:has-text('▶️ Play')").click()

            # Wait a moment for the visualizer to update with the audio signal
            await page.wait_for_timeout(2000)

            await page.screenshot(path="verification/fm_fix_verification.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

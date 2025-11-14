
import asyncio
from playwright.async_api import async_playwright, expect
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for all console events and print them for debugging
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type}: {msg.text}"))

        try:
            print("Navigating to page...")
            await page.goto("http://localhost:8000/")

            print("Removing overlay and starting audio...")
            await page.evaluate("document.getElementById('hero-overlay').remove()")
            await page.evaluate("startAudio()")
            await page.wait_for_timeout(1000) # Give audio context time to initialize

            print("Opening settings...")
            await page.click("#settingsToggle")
            await expect(page.locator("#settingsDropdown")).to_be_visible()

            print("Waiting for PeerJS ID to be assigned...")
            peer_id_locator = page.locator("#peerIdDisplay")
            await expect(peer_id_locator).not_to_have_text(re.compile(r'\.\.\.'), timeout=15000)

            peer_id = await peer_id_locator.text_content()
            print(f"PeerJS ID assigned: {peer_id}")

            print("Capturing initial state screenshot...")
            await page.screenshot(path="verification/01_initial_state.png")

            print("Creating a session...")
            await page.click("#createSessionBtn")

            print("Waiting for UI to update after session creation...")
            await expect(page.locator("#disconnectBtn")).to_be_visible()
            await expect(page.locator("#connectedUsersList li")).to_contain_text("(You)")

            print("Capturing session created screenshot...")
            await page.screenshot(path="verification/02_session_created.png")

            print("Disconnecting from the session...")
            await page.click("#disconnectBtn")

            print("Waiting for UI to revert after disconnection...")
            await expect(page.locator("#createSessionBtn")).to_be_visible()
            await expect(page.locator("#disconnectBtn")).to_be_hidden()
            await expect(page.locator("#connectedUsersList li")).to_have_count(0)

            print("Capturing disconnected state screenshot...")
            await page.screenshot(path="verification/03_disconnected.png")

            print("Verification script completed successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

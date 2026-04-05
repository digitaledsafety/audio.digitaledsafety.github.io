import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        page.on("pageerror", lambda exc: print(f"ERROR: {exc}"))

        await page.goto('http://localhost:8000/debug_app.html')
        await asyncio.sleep(2)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

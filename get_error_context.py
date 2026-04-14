import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        errors = []
        page.on("pageerror", lambda exc: errors.append(exc))

        try:
            await page.goto('http://localhost:8000/debug_app.html')
            await asyncio.sleep(2)
        except Exception as e:
            print(f"Error: {e}")

        for err in errors:
            print(f"Error Message: {err.message}")
            if hasattr(err, 'stack'):
                print(f"Stack Trace: {err.stack}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

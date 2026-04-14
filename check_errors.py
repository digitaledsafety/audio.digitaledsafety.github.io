import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        errors = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))

        try:
            # We must use debug_app.html because it is the pre-rendered version of _layouts/default.html
            await page.goto('http://localhost:8000/debug_app.html')
            await asyncio.sleep(2)
        except Exception as e:
            print(f"Error: {e}")

        if errors:
            print("Captured Page Errors:")
            for err in errors:
                print(err)
        else:
            print("No Page Errors found.")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

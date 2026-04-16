import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        try:
            await page.goto('http://localhost:8000/')
            print(f"Page title: {await page.title()}")
            content = await page.content()
            print(f"Content length: {len(content)}")
            # print(f"First 500 chars: {content[:500]}")

            # Check for CTA button
            cta = await page.query_selector('#cta-button')
            print(f"CTA button found: {cta is not None}")

            # Check for JS errors in page context
            errors = await page.evaluate("() => window.__js_errors || []")
            print(f"Pre-captured errors: {errors}")

        except Exception as e:
            print(f"Error: {e}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

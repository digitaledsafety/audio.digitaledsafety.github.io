import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 1280})
        page = await context.new_page()

        await page.goto('http://localhost:8000/debug_app.html')

        # Click buttons to add nodes
        await page.evaluate("""() => {
            document.getElementById('addArpeggiatorNodeBtn').click();
            document.getElementById('addSequencerNodeBtn').click();
        }""")

        await asyncio.sleep(2)

        # Interact with Arpeggiator to show custom pattern
        await page.evaluate("""() => {
            const selects = Array.from(document.querySelectorAll('select'));
            const patternSelect = selects.find(s => s.options[s.selectedIndex].text === 'Up' || s.innerHTML.includes('Alberti Bass'));
            if (patternSelect) {
                patternSelect.value = 'Custom';
                patternSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }""")

        await asyncio.sleep(1)

        # Interact with Sequencer to show dice settings
        await page.evaluate("""() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const diceBtn = buttons.find(b => b.textContent.includes('🎲 Settings'));
            if (diceBtn) {
                diceBtn.click();
            }
        }""")

        await asyncio.sleep(1)

        # Check for Arpeggiator custom pattern text field - search all text controls
        arp_info = await page.evaluate("""() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const patternLabel = labels.find(l => l.textContent.includes('Pattern Indices'));
            const customInput = patternLabel ? patternLabel.parentElement.querySelector('input') : null;
            return {
                patternLabelFound: !!patternLabel,
                customInputFound: !!customInput
            };
        }""")
        print(f"Arpeggiator check: {arp_info}")

        # Check for Sequencer Dice Settings
        seq_info = await page.evaluate("""() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const randomModeLabel = labels.find(l => l.textContent.includes('Random Mode'));
            return {
                randomModeLabelFound: !!randomModeLabel
            };
        }""")
        print(f"Sequencer check: {seq_info}")

        # Take a screenshot to see them
        await page.screenshot(path='/home/jules/verification/screenshots/nodes_detail.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

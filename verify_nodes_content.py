import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 1280})
        page = await context.new_page()

        await page.goto('http://localhost:8000/debug_app.html')
        await page.wait_for_selector('#rete-container', timeout=10000)

        # Add Arpeggiator and Sequencer using window properties
        # Wrap in a loop to wait for window properties to be set
        await page.evaluate("""async () => {
            async function waitProperty(prop) {
                while (!window[prop]) {
                    await new Promise(r => setTimeout(r, 100));
                }
                return window[prop];
            }
            const editor = await waitProperty('editor');
            const ArpNode = await waitProperty('ArpeggiatorNode');
            const SeqNode = await waitProperty('SequencerNode');

            const arp = new ArpNode();
            const seq = new SeqNode();
            arp.position = { x: 50, y: 50 };
            seq.position = { x: 450, y: 50 };
            await editor.addNode(arp);
            await editor.addNode(seq);
        }""")

        await asyncio.sleep(2)

        # Check for Arpeggiator custom pattern text field
        arp_info = await page.evaluate("""() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const customInput = inputs.find(i => i.placeholder === '0 1 2 3');
            const buttons = Array.from(document.querySelectorAll('button'));
            const diceBtn = buttons.find(b => b.textContent.includes('🎲'));
            return {
                customInputFound: !!customInput,
                diceBtnFound: !!diceBtn
            };
        }""")
        print(f"Arpeggiator check: {arp_info}")

        # Check for Sequencer Dice Settings
        seq_info = await page.evaluate("""() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const diceSettingsBtn = buttons.find(b => b.textContent.includes('Dice Settings'));
            return {
                diceSettingsBtnFound: !!diceSettingsBtn
            };
        }""")
        print(f"Sequencer check: {seq_info}")

        # Take a screenshot to see them
        await page.screenshot(path='/home/jules/verification/screenshots/nodes_detail.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

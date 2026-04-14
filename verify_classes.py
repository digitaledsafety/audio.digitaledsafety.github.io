import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        await page.goto('http://localhost:8000/debug_app.html')
        await page.wait_for_selector('#rete-container', timeout=5000)

        # Add a node
        await page.evaluate("""() => {
            const editor = window.editor;
            const area = window.area;
            async function addNode(name, x, y) {
                const component = Array.from(editor.getComponents()).find(c => c.name === name);
                const node = new Rete.Node(name);
                node.position = [x, y];
                await editor.addNode(node);
                // In v2 we might need area.translate(node.id, { x, y })
            }
            // Use the actual component creation logic from the app
            const component = editor.getComponents().find(c => c.name === 'Arpeggiator');
            component.createNode().then(node => {
                node.position = [50, 50];
                editor.addNode(node);
            });
        }""")

        await asyncio.sleep(2)

        html_structure = await page.evaluate("""() => {
            const container = document.getElementById('rete-container');
            return container.innerHTML;
        }""")
        # print(html_structure) # Too long

        nodes_found = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('*'))
                .filter(el => el.classList.length > 0)
                .map(el => Array.from(el.classList).join(' '))
                .filter(cls => cls.includes('node') || cls.includes('rete'));
        }""")
        print(f"Classes found: {list(set(nodes_found))}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

import { test, expect } from '@playwright/test';

test.describe('Multiplayer Synchronization', () => {
  test('should synchronize node movement between players', async ({ context }) => {
    // Player 1 (Host)
    const page1 = await context.newPage();
    await page1.goto('http://localhost:8000');

    // Click "Enter the Studio" to remove the overlay
    await page1.click('#cta-button');
    await expect(page1.locator('#hero-overlay')).not.toBeVisible();

    // Clear editor to have a clean state
    await page1.evaluate(async () => {
        if (window.clearEditor) await window.clearEditor();
    });

    // Add a node manually
    await page1.click('#addNodeToggle');
    await page1.click('#addToneGeneratorNodeBtn');

    // Target the specific node we just added
    const toneNode1 = page1.locator('[data-node-label="Tone Generator"]').first();
    await expect(toneNode1).toBeVisible({ timeout: 10000 });

    // Start hosting
    await page1.click('#settingsToggle');
    await page1.click('#createSessionBtn');

    // Wait for the session URL to be available in the input
    const sessionUrlInput = page1.locator('#shareLinkInput');
    await expect(sessionUrlInput).not.toHaveValue('', { timeout: 10000 });
    const sessionUrl = await sessionUrlInput.inputValue();

    // Player 2 (Client)
    const page2 = await context.newPage();
    await page2.goto(sessionUrl);

    // Click "Enter the Studio" on player 2
    await page2.click('#cta-button');
    await expect(page2.locator('#hero-overlay')).not.toBeVisible();

    // Wait for nodes to load on Player 2
    const toneNode2 = page2.locator('[data-node-label="Tone Generator"]').first();
    await expect(toneNode2).toBeVisible({ timeout: 25000 });

    // Give some time for PeerJS connection to stabilize
    await page1.waitForTimeout(3000);

    // Get initial position of the node on Player 2
    const box2Before = await toneNode2.boundingBox();
    console.log('Player 2 node position before:', box2Before);

    // Drag the node on Player 1
    const box1 = await toneNode1.boundingBox();
    await page1.mouse.move(box1.x + box1.width / 2, box1.y + 10);
    await page1.mouse.down();
    await page1.mouse.move(box1.x + box1.width / 2 + 200, box1.y + 150, { steps: 20 });
    await page1.mouse.up();

    console.log('Drag completed on Player 1');

    // Wait for synchronization
    await expect.poll(async () => {
      const box = await toneNode2.boundingBox();
      if (!box) return false;
      // Check if it moved significantly from the initial position
      return Math.abs(box.x - box2Before.x) > 50 || Math.abs(box.y - box2Before.y) > 50;
    }, {
      message: 'Node position should change on Player 2',
      timeout: 20000,
    }).toBeTruthy();

    const box2After = await toneNode2.boundingBox();
    console.log('Player 2 node position after:', box2After);

    expect(box2After.x).not.toBeCloseTo(box2Before.x, 1);
    expect(box2After.y).not.toBeCloseTo(box2Before.y, 1);
  });
});

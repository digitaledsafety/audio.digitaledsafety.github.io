import { test, expect } from '@playwright/test';

test.describe('Extended Multiplayer Synchronization', () => {
  test('should synchronize workspace, movement, controls, and transport', async ({ context }) => {
    // Player 1 (Host)
    const page1 = await context.newPage();
    page1.on('console', msg => console.log('PAGE 1:', msg.text()));
    await page1.goto('http://localhost:8000');
    await page1.click('#cta-button');
    await expect(page1.locator('#hero-overlay')).not.toBeVisible();

    // Clear editor and add a Tone Generator
    await page1.evaluate(async () => {
        if (window.editor) await window.editor.clear();
    });
    await page1.click('#addNodeToggle');
    await page1.click('#addToneGeneratorNodeBtn');
    const toneNode1 = page1.locator('[data-node-label="Tone Generator"]').first();
    await expect(toneNode1).toBeVisible();

    // Start hosting
    await page1.click('#settingsToggle');
    await page1.click('#createSessionBtn');
    const sessionUrlInput = page1.locator('#shareLinkInput');
    await expect(sessionUrlInput).not.toHaveValue('', { timeout: 10000 });
    const sessionUrl = await sessionUrlInput.inputValue();

    // Player 2 (Client)
    const page2 = await context.newPage();
    page2.on('console', msg => console.log('PAGE 2:', msg.text()));
    await page2.goto(sessionUrl);
    await page2.click('#cta-button');
    await expect(page2.locator('#hero-overlay')).not.toBeVisible();

    // 1. Test Initial Workspace Sync
    const toneNode2 = page2.locator('[data-node-label="Tone Generator"]').first();
    await expect(toneNode2).toBeVisible({ timeout: 25000 });
    console.log('Initial workspace synchronized');

    // 2. Test Node Movement Sync
    // Give PeerJS some time to establish data channel
    await page1.waitForTimeout(5000);

    const box2BeforeMove = await toneNode2.boundingBox();
    const box1 = await toneNode1.boundingBox();
    console.log('Moving node on Player 1 from', box1.x, box1.y);

    await page1.mouse.move(box1.x + box1.width / 2, box1.y + 20);
    await page1.mouse.down();
    await page1.mouse.move(box1.x + box1.width / 2 + 200, box1.y + 200, { steps: 20 });
    await page1.mouse.up();
    console.log('Move finished on Player 1');

    await expect.poll(async () => {
      const box = await toneNode2.boundingBox();
      console.log('Current box on Player 2:', box.x, box.y);
      return Math.abs(box.x - box2BeforeMove.x) > 50 || Math.abs(box.y - box2BeforeMove.y) > 50;
    }, {
        message: 'Node should move on Player 2',
        timeout: 30000
    }).toBeTruthy();
    console.log('Node movement synchronized');

    // 3. Test Control Update Sync (Slider)
    const freqSlider1 = toneNode1.locator('input[type="range"]').first();
    const valueDisplay2 = toneNode2.locator('.value-display').first();

    // Tone Generator frequency is logarithmic (20-20000Hz).
    // We set the linear slider (0-100) to a value that's easy to check.
    // Value 50 should be sqrt(20 * 20000) = 632.46
    await freqSlider1.fill('50');
    await expect(valueDisplay2).toHaveText('632.46', { timeout: 15000 });
    console.log('Control update (slider) synchronized');

    // 4. Test Transport Sync
    const playStopBtn1 = page1.locator('#playStopBtn');
    const playStopBtn2 = page2.locator('#playStopBtn');

    await playStopBtn1.click();
    await expect(playStopBtn2).toHaveText('⏹️', { timeout: 10000 });
    console.log('Transport Start synchronized');

    await playStopBtn1.click();
    await expect(playStopBtn2).toHaveText('▶️', { timeout: 10000 });
    console.log('Transport Stop synchronized');

    // 5. Test Incremental Node Addition
    await page1.click('#addNodeToggle');
    await page1.click('#addNoiseGeneratorNodeBtn');
    const noiseNode2 = page2.locator('[data-node-label="Noise Generator"]').first();
    await expect(noiseNode2).toBeVisible({ timeout: 10000 });
    console.log('Incremental node addition synchronized');

    // 6. Test Incremental Node Removal
    // We'll use page1.evaluate to remove the node because clicking the 'x' might be tricky in Rete v2 without a specific selector
    const noiseNodeId = await page1.evaluate(() => {
        const node = window.editor.getNodes().find(n => n.label === 'Noise Generator');
        return node.id;
    });

    await page1.evaluate((id) => {
        window.editor.removeNode(id);
    }, noiseNodeId);

    await expect(noiseNode2).not.toBeVisible({ timeout: 10000 });
    console.log('Incremental node removal synchronized');

    // 7. Test Connection Synchronization
    // Add another node to connect to
    await page1.click('#addNodeToggle');
    await page1.click('#addMasterGainOutputNodeBtn');
    const masterNode2 = page2.locator('[data-node-label="Master"]').first();
    await expect(masterNode2).toBeVisible({ timeout: 10000 });

    // Create connection on Player 1
    await page1.evaluate(async () => {
        const nodes = Array.from(window.editor.getNodes());
        const toneNode = nodes.find(n => n.label === 'Tone Generator');
        const masterNode = nodes.find(n => n.label === 'Master');
        await window.editor.addConnection(new window.Rete.ClassicPreset.Connection(toneNode, 'audio', masterNode, 'audio'));
    });

    // Verify connection on Player 2
    await expect.poll(async () => {
        return await page2.evaluate(() => window.editor.getConnections().length);
    }, { timeout: 10000 }).toBe(1);
    console.log('Connection addition synchronized');

    // Remove connection on Player 1
    await page1.evaluate(async () => {
        const conn = window.editor.getConnections()[0];
        await window.editor.removeConnection(conn.id);
    });

    // Verify removal on Player 2
    await expect.poll(async () => {
        return await page2.evaluate(() => window.editor.getConnections().length);
    }, { timeout: 10000 }).toBe(0);
    console.log('Connection removal synchronized');
  });
});

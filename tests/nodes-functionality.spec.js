const { test, expect } = require('@playwright/test');

test.describe('Additional Nodes Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Enter the studio
    await page.locator('#cta-button').click();
  });

  test('should add and interact with a Filter node', async ({ page }) => {
    // Open Add Node dropdown
    await page.locator('#addNodeToggle').click();
    await page.locator('#addFilterNodeBtn').click();

    // Verify Filter node exists
    const filterNode = page.locator('text=Filter').first();
    await expect(filterNode).toBeVisible();

    // Find the frequency slider in the Filter node
    const freqSlider = page.locator('.rete-node:has-text("Filter") input[type="range"]').first();
    await expect(freqSlider).toBeVisible();

    // Change slider value
    await freqSlider.fill('1000');

    // Verify value display update
    const valueDisplay = page.locator('.rete-node:has-text("Filter") .value-display').first();
    await expect(valueDisplay).toHaveText(/1000/);
  });

  test('should add and interact with a Reverb node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addReverbNodeBtn').click();

    const reverbNode = page.locator('text=Reverb').first();
    await expect(reverbNode).toBeVisible();

    const durationSlider = page.locator('.rete-node:has-text("Reverb") .control:has-text("Duration") input[type="range"]');
    await expect(durationSlider).toBeVisible();
    await durationSlider.fill('5');

    const valueDisplay = page.locator('.rete-node:has-text("Reverb") .control:has-text("Duration") .value-display');
    await expect(valueDisplay).toHaveText(/5/);
  });

  test('should add and interact with a Bitcrusher node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addBitcrusherNodeBtn').click();

    const bitcrusherNode = page.locator('text=Bitcrusher').first();
    await expect(bitcrusherNode).toBeVisible();

    const bitsSlider = page.locator('.rete-node:has-text("Bitcrusher") .control:has-text("Bit Depth") input[type="range"]');
    await expect(bitsSlider).toBeVisible();
    await bitsSlider.fill('4');

    const valueDisplay = page.locator('.rete-node:has-text("Bitcrusher") .control:has-text("Bit Depth") .value-display');
    await expect(valueDisplay).toHaveText(/4/);
  });
});

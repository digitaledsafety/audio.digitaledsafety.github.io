const { test, expect } = require('@playwright/test');

test.describe('Drum Machine and Mastering Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#cta-button');
  });

  test('Drum Machine should have ADSR controls and Envelope toggle', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('button:has-text("Drum Machine")').first().click();
    const node = page.locator('[data-node-label="Drum Machine"]').first();
    await expect(node).toBeVisible();

    const envToggle = node.locator('button:has-text("Envelope")');
    await expect(envToggle).toBeVisible();

    // ADSR sliders should be hidden initially
    const attackSlider = node.locator('label:has-text("Attack (s)")');
    await expect(attackSlider).toBeHidden();

    // Toggle Envelope
    await envToggle.click();

    // ADSR sliders should be visible now
    await expect(attackSlider).toBeVisible();
    await expect(node.locator('label:has-text("Decay (s)")')).toBeVisible();
    await expect(node.locator('label:has-text("Sustain")')).toBeVisible();
    await expect(node.locator('label:has-text("Release (s)")')).toBeVisible();
  });

  test('Master node should have Stereo Width control', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('button:has-text("Master")').first().click();
    const node = page.locator('[data-node-label="Master"]').first();
    await expect(node).toBeVisible();

    const widthSlider = node.locator('input[type="range"]').nth(1); // 0 is Gain, 1 is Width
    await expect(node.locator('label:has-text("Stereo Width")')).toBeVisible();

    await widthSlider.fill('1.5');
    await expect(widthSlider).toHaveValue('1.5');
  });

  test('Sequencer randomization settings visibility', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('button:has-text("Sequencer")').first().click();
    const node = page.locator('[data-node-label="Sequencer"]').first();
    await expect(node).toBeVisible();

    const randToggle = node.locator('button:has-text("Randomize Settings")');
    await expect(randToggle).toBeVisible();

    const modeSelect = node.locator('label:has-text("Random Mode")');
    await expect(modeSelect).toBeHidden();

    await randToggle.click();
    await expect(modeSelect).toBeVisible();
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Vocoder Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close overlay if it exists
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure Vocoder node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addVocoderNodeBtn').click();

    const vocoderNode = page.locator('[data-node-label="Vocoder"]').first();
    await expect(vocoderNode).toBeVisible();

    // Check Carrier Wave select
    const waveSelect = vocoderNode.locator('select').first();
    await expect(waveSelect).toBeVisible();
    await waveSelect.selectOption('square');
    await expect(waveSelect).toHaveValue('square');

    // Check sliders (frequency, bands, formant shift, unvoiced, modulator gain)
    const sliders = vocoderNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(5);

    // Test a slider change
    const freqSlider = sliders.nth(0);
    await freqSlider.fill('500');
    // The value display should update
    const valueDisplay = vocoderNode.locator('.value-display').nth(0);
    await expect(valueDisplay).toHaveText('500.00');
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Mixer Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close overlay if it exists
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure Mixer node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addMixerNodeBtn').click();

    const mixerNode = page.locator('[data-node-label="Mixer"]').first();
    await expect(mixerNode).toBeVisible();

    // Mixer has 4 gain sliders
    const sliders = mixerNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(4);

    // Change Gain 1
    const gain1Slider = sliders.nth(0);
    await gain1Slider.fill('0.5');

    const valueDisplay1 = mixerNode.locator('.value-display').nth(0);
    await expect(valueDisplay1).toHaveText('0.50');

    // Change Gain 4
    const gain4Slider = sliders.nth(3);
    await gain4Slider.fill('0.2');

    const valueDisplay4 = mixerNode.locator('.value-display').nth(3);
    await expect(valueDisplay4).toHaveText('0.20');
  });
});

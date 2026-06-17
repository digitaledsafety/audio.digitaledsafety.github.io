const { test, expect } = require('@playwright/test');

test.describe('Stereo Widener Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure Stereo Widener node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addStereoWidenerNodeBtn').click();

    const widenerNode = page.locator('[data-node-label="Stereo Widener"]').first();
    await expect(widenerNode).toBeVisible();

    const sliders = widenerNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(2); // Width, Mix

    // Test Width slider
    const widthSlider = sliders.nth(0);
    await widthSlider.fill('2.5');
    await expect(widenerNode.locator('.value-display').nth(0)).toHaveText('2.50');

    // Test Mix slider
    const mixSlider = sliders.nth(1);
    await mixSlider.fill('0.5');
    await expect(widenerNode.locator('.value-display').nth(1)).toHaveText('0.50');
  });

  test('should have audio input and output', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addStereoWidenerNodeBtn').click();

    const widenerNode = page.locator('[data-node-label="Stereo Widener"]').first();

    await expect(widenerNode.locator('.input-title:has-text("Audio In")')).toBeVisible();
    await expect(widenerNode.locator('.output-title:has-text("Audio Out")')).toBeVisible();
  });
});

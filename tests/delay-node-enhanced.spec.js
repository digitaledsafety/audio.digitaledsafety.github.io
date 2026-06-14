const { test, expect } = require('@playwright/test');

test.describe('Enhanced Delay Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure enhanced Delay node', async ({ page }) => {
    // Add Delay Node
    await page.locator('#addNodeToggle').click();
    await page.locator('#addDelayNodeBtn').click();

    const delayNode = page.locator('[data-node-label="Delay"]').first();
    await expect(delayNode).toBeVisible();

    // Check for sliders: Delay Time, Feedback, Mix
    const sliders = delayNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(3);

    // Test Delay Time slider
    const timeSlider = sliders.nth(0);
    await timeSlider.fill('2.5');
    await expect(delayNode.locator('.value-display').nth(0)).toHaveText('2.50');

    // Test Feedback slider
    const feedbackSlider = sliders.nth(1);
    await feedbackSlider.fill('0.85');
    await expect(delayNode.locator('.value-display').nth(1)).toHaveText('0.85');

    // Test Mix slider
    const mixSlider = sliders.nth(2);
    await mixSlider.fill('0.3');
    await expect(delayNode.locator('.value-display').nth(2)).toHaveText('0.30');
  });

  test('should have Delay CV input', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addDelayNodeBtn').click();

    const delayNode = page.locator('[data-node-label="Delay"]').first();
    await expect(delayNode.locator('.input-title:has-text("Delay CV")')).toBeVisible();
  });
});

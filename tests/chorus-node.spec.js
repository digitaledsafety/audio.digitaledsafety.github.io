const { test, expect } = require('@playwright/test');

test.describe('Chorus Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close overlay if it exists
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure Chorus node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addChorusNodeBtn').click();

    const chorusNode = page.locator('[data-node-label="Chorus"]').first();
    await expect(chorusNode).toBeVisible();

    // Chorus has 4 sliders: Rate, Depth, Delay, Mix
    const sliders = chorusNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(4);

    // Change Rate
    const rateSlider = sliders.nth(0);
    await rateSlider.fill('5');
    const rateValueDisplay = chorusNode.locator('.value-display').nth(0);
    await expect(rateValueDisplay).toHaveText('5.00');

    // Change Mix
    const mixSlider = sliders.nth(3);
    await mixSlider.fill('0.7');
    const mixValueDisplay = chorusNode.locator('.value-display').nth(3);
    await expect(mixValueDisplay).toHaveText('0.70');
  });
});

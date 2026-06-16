const { test, expect } = require('@playwright/test');

test.describe('Enhanced Mixer Node CV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should have CV inputs for all channels', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addMixerNodeBtn').click();

    const mixerNode = page.locator('[data-node-label="Mixer"]').first();
    await expect(mixerNode).toBeVisible();

    // Check for Gain CV inputs
    for (let i = 1; i <= 4; i++) {
        await expect(mixerNode.locator(`.input-title:has-text("Gain ${i} CV")`)).toBeVisible();
        await expect(mixerNode.locator(`.input-title:has-text("Pan ${i} CV")`)).toBeVisible();
    }
  });
});

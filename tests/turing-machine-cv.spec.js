const { test, expect } = require('@playwright/test');

test.describe('Enhanced Turing Machine CV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should have Prob CV input', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addTuringMachineNodeBtn').click();

    const turingNode = page.locator('[data-node-label="Turing Machine"]').first();
    await expect(turingNode).toBeVisible();

    await expect(turingNode.locator('.input-title:has-text("Prob CV")')).toBeVisible();
  });
});

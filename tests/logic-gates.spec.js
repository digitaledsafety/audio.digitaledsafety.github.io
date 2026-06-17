const { test, expect } = require('@playwright/test');

test.describe('Logic Gates Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure Logic Gates node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addLogicGatesNodeBtn').click();

    const logicNode = page.locator('[data-node-label="Logic Gates"]').first();
    await expect(logicNode).toBeVisible();

    const logicSelect = logicNode.locator('select');
    await expect(logicSelect).toBeVisible();

    // Test selecting different logic types
    await logicSelect.selectOption('OR');
    await expect(logicSelect).toHaveValue('OR');

    await logicSelect.selectOption('XOR');
    await expect(logicSelect).toHaveValue('XOR');

    await logicSelect.selectOption('AND');
    await expect(logicSelect).toHaveValue('AND');
  });

  test('should have two gate inputs and one output', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addLogicGatesNodeBtn').click();

    const logicNode = page.locator('[data-node-label="Logic Gates"]').first();

    await expect(logicNode.locator('.input-title:has-text("Gate A")')).toBeVisible();
    await expect(logicNode.locator('.input-title:has-text("Gate B")')).toBeVisible();
    await expect(logicNode.locator('.output-title:has-text("Out")')).toBeVisible();
  });
});

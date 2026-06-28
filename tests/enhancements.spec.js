const { test, expect } = require('@playwright/test');

test.describe('Enhancements Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('Logic Gates should have new operations', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addLogicGatesNodeBtn').click();

    const logicNode = page.locator('[data-node-label="Logic Gates"]').first();
    await expect(logicNode).toBeVisible();

    const logicSelect = logicNode.locator('select');
    const options = await logicSelect.locator('option').allTextContents();

    expect(options).toContain('NOR');
    expect(options).toContain('XNOR');
    expect(options).toContain('NOT (A)');
  });

  test('Clock Divider should be addable and have correct outputs', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addClockDividerNodeBtn').click();

    const divNode = page.locator('[data-node-label="Clock Divider"]').first();
    await expect(divNode).toBeVisible();

    await expect(divNode.locator('.output-title:has-text("/2")')).toBeVisible();
    await expect(divNode.locator('.output-title:has-text("/4")')).toBeVisible();
    await expect(divNode.locator('.output-title:has-text("/8")')).toBeVisible();
    await expect(divNode.locator('.output-title:has-text("/16")')).toBeVisible();
  });

  test('Signal Inverter should be addable and have correct IO', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addSignalInverterNodeBtn').click();

    const invNode = page.locator('[data-node-label="Signal Inverter"]').first();
    await expect(invNode).toBeVisible();

    await expect(invNode.locator('.input-title:has-text("Signal In")')).toBeVisible();
    await expect(invNode.locator('.output-title:has-text("Signal Out")')).toBeVisible();
  });
});

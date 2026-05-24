const { test, expect } = require('@playwright/test');

test.describe('Node Enhancements and Parameter Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#cta-button');
  });

  test('Bernoulli Gate should update probability', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('button:has-text("Bernoulli Gate")').first().click();
    const node = page.locator('[data-node-label="Bernoulli Gate"]').first();
    await expect(node).toBeVisible();

    const slider = node.locator('input[type="range"]');
    await slider.fill('0.8');
    await expect(slider).toHaveValue('0.8');
  });

  test('Turing Machine should update probability and steps', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('button:has-text("Turing Machine")').first().click();
    const node = page.locator('[data-node-label="Turing Machine"]').first();
    await expect(node).toBeVisible();

    // Probability slider
    const probSlider = node.locator('input[type="range"]').first();
    await probSlider.fill('0.5');
    await expect(probSlider).toHaveValue('0.5');

    // Steps slider
    const stepsSlider = node.locator('input[type="range"]').nth(1);
    await stepsSlider.fill('8');
    await expect(stepsSlider).toHaveValue('8');
  });

  test('LFO should update amount and offset', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('button:has-text("LFO")').first().click();
    const node = page.locator('[data-node-label="LFO"]').first();
    await expect(node).toBeVisible();

    // Frequency slider is index 0
    // Amount slider is index 1
    const amountSlider = node.locator('input[type="range"]').nth(1);
    await amountSlider.fill('1200');
    await expect(amountSlider).toHaveValue('1200');

    // Offset slider is index 2
    const offsetSlider = node.locator('input[type="range"]').nth(2);
    await offsetSlider.fill('200');
    await expect(offsetSlider).toHaveValue('200');
  });
});

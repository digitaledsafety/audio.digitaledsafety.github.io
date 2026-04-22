const { test, expect } = require('@playwright/test');

test.describe('Probability Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#cta-button');
    // Wait for the random workspace to load
    await page.waitForSelector('.rete-container .node');
  });

  test('should add a Probability node and show its control', async ({ page }) => {
    // Open Add Node menu
    await page.click('#addNodeToggle');

    // Click on Probability button
    await page.click('#addProbabilityNodeBtn');

    // Check if the node is added to the editor
    const probabilityNode = page.locator('.node[data-node-label="Probability"]');
    await expect(probabilityNode).toBeVisible();

    // Check if the probability slider is visible
    const slider = probabilityNode.locator('input[type="range"]');
    await expect(slider).toBeVisible();

    // Check if the initial value is 50.00
    const valueDisplay = probabilityNode.locator('.value-display');
    await expect(valueDisplay).toHaveText('50.00');
  });

  test('should update probability value when slider is moved', async ({ page }) => {
    await page.click('#addNodeToggle');
    await page.click('#addProbabilityNodeBtn');

    const probabilityNode = page.locator('.node[data-node-label="Probability"]');
    const slider = probabilityNode.locator('input[type="range"]');
    const valueDisplay = probabilityNode.locator('.value-display');

    // Move the slider (Note: range is 0-100)
    await slider.fill('75');

    // Wait for the value display to update
    await expect(valueDisplay).toHaveText('75.00');
  });
});

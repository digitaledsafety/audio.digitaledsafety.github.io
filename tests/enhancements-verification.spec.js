const { test, expect } = require('@playwright/test');

test.describe('Enhancements Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Enter the studio
    await page.locator('#cta-button').click();
    // Wait for hero-overlay to be removed
    await expect(page.locator('#hero-overlay')).not.toBeAttached({ timeout: 15000 });
  });

  test('Stereo Widener has Width CV input', async ({ page }) => {
    // Open add node dropdown
    await page.locator('#addNodeToggle').click();
    // Add Stereo Widener node
    await page.locator('#addStereoWidenerNodeBtn').click();

    // Wait for the node to appear
    const node = page.locator('[data-node-label="Stereo Widener"]').first();
    await expect(node).toBeVisible({ timeout: 20000 });

    // Check for Width CV text
    await expect(node).toContainText('Width CV');
  });

  test('Distortion has Mix control', async ({ page }) => {
    // Open add node dropdown
    await page.locator('#addNodeToggle').click();
    // Add Distortion node
    await page.locator('#addDistortionNodeBtn').click();

    const node = page.locator('[data-node-label="Distortion"]').first();
    await expect(node).toBeVisible({ timeout: 20000 });

    // Check for Mix slider control label
    await expect(node).toContainText('Mix');
  });

  test('Visualizer has Freeze control', async ({ page }) => {
    // Open add node dropdown
    await page.locator('#addNodeToggle').click();
    // Add Visualizer node
    await page.locator('#addVisualizerNodeBtn').click();

    const node = page.locator('[data-node-label="Visualizer"]').first();
    await expect(node).toBeVisible({ timeout: 20000 });

    // Check for Freeze button
    // It's a button within the node's custom controls
    const freezeBtn = node.locator('button:has-text("Freeze")');
    await expect(freezeBtn).toBeVisible();

    // Toggle Freeze
    await freezeBtn.click();
    // Use a more flexible matcher for text or just check if it changed
    await expect(node.locator('button')).toContainText(['Resume']);
  });
});

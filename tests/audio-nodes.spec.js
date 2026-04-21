const { test, expect } = require('@playwright/test');

test.describe('Audio Nodes Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#cta-button').click();
  });

  test('should add and configure Filter node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addFilterNodeBtn').click();

    const filterNode = page.locator('[data-node-label="Filter"]').first();
    await expect(filterNode).toBeVisible();

    const typeSelect = filterNode.locator('select');
    await expect(typeSelect).toBeVisible();
    await typeSelect.selectOption('highpass');
    await expect(typeSelect).toHaveValue('highpass');
  });

  test('should add and configure ADSR Envelope node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addADSREnvelopeNodeBtn').click();

    const adsrNode = page.locator('[data-node-label="ADSR Envelope"]').first();
    await expect(adsrNode).toBeVisible();

    const modeSelect = adsrNode.locator('select');
    await expect(modeSelect).toBeVisible();
    await modeSelect.selectOption('LFO');
    await expect(modeSelect).toHaveValue('LFO');
  });

  test('should add Visualizer node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addVisualizerNodeBtn').click();

    const visualizerNode = page.locator('[data-node-label="Visualizer"]').first();
    await expect(visualizerNode).toBeVisible();

    // Check if canvas is present
    const canvas = visualizerNode.locator('canvas');
    await expect(canvas).toBeAttached();
  });
});

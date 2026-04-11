const { test, expect } = require('@playwright/test');

test.describe('Critical Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should enter the studio and show the editor', async ({ page }) => {
    // Click CTA button
    const ctaButton = page.locator('#cta-button');
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    // Verify hero overlay is removed
    await expect(page.locator('#hero-overlay')).not.toBeAttached();

    // Verify editor container is visible
    const editorContainer = page.locator('.audio-editor-container');
    await expect(editorContainer).toBeVisible();
  });

  test('should add a Tone Generator node', async ({ page }) => {
    // Enter the studio
    await page.locator('#cta-button').click();

    // Open Add Node dropdown
    const addNodeToggle = page.locator('#addNodeToggle');
    await addNodeToggle.click();

    // Click Tone Gen button
    const addToneGenBtn = page.locator('#addToneGeneratorNodeBtn');
    await expect(addToneGenBtn).toBeVisible();
    await addToneGenBtn.click();

    // Verify Tone Generator node exists in the DOM
    // Rete.js v2 nodes typically have a label or specific class
    // Based on CustomNodeComponent, we can look for the text "Tone Generator"
    await expect(page.locator('text=Tone Generator').first()).toBeVisible();
  });

  test('should toggle the visualizer', async ({ page }) => {
    // Enter the studio
    await page.locator('#cta-button').click();

    const visualizerTab = page.locator('#visualizer-tab');
    await visualizerTab.click();

    const visualizerView = page.locator('#visualizer-view');
    await expect(visualizerView).toHaveClass(/active/);

    const workspaceTab = page.locator('#workspace-tab');
    await workspaceTab.click();
    await expect(visualizerView).not.toHaveClass(/active/);
  });
});

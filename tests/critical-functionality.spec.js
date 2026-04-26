const { test, expect } = require('@playwright/test');

test.describe('Critical Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should enter the studio and show the editor', async ({ page }) => {
    // Click CTA button
    const ctaButton = page.locator('#cta-button');
    await expect(ctaButton).toBeVisible({ timeout: 10000 });
    await ctaButton.click();

    // Verify hero overlay is removed
    await expect(page.locator('#hero-overlay')).not.toBeAttached();

    // Verify Rete container is visible
    const reteContainer = page.locator('.rete-container');
    await expect(reteContainer).toBeVisible();
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

  test('should save and load workspace', async ({ page }) => {
    await page.locator('#cta-button').click();
    await expect(page.locator('.rete-container')).toBeVisible();

    // Add a node to make workspace non-empty
    await page.locator('#addNodeToggle').click();
    await page.locator('#addToneGeneratorNodeBtn').click();
    await expect(page.locator('text=Tone Generator').first()).toBeVisible();

    // Open settings
    await page.locator('#settingsToggle').click();

    // Set workspace name
    const workspaceNameInput = page.locator('#workspaceName');
    const testName = 'Test-Workspace-' + Date.now();
    await workspaceNameInput.fill(testName);

    // Save workspace
    await page.locator('#saveWorkspaceBtn').click();

    // Verify success message
    await expect(page.locator('#messageBox')).toContainText('saved', { timeout: 10000 });

    // Reload page to clear editor state (in-memory)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('#cta-button').click();
    await expect(page.locator('.rete-container')).toBeVisible();

    // Open settings again
    await page.locator('#settingsToggle').click();

    // Select workspace and load
    const selector = page.locator('#workspaceSelector');
    await expect(selector).toBeVisible();
    await selector.selectOption(testName);
    await page.locator('#loadWorkspaceBtn').click();

    // Verify node is restored
    await expect(page.locator('text=Tone Generator').first()).toBeVisible({ timeout: 10000 });
  });
});

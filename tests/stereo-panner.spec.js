const { test, expect } = require('@playwright/test');

test.describe('Stereo Panner Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Enter the studio
    const ctaButton = page.locator('#cta-button');
    await ctaButton.click();
  });

  test('should add a Stereo Panner node and show its control', async ({ page }) => {
    // Open Add Node dropdown
    const addNodeToggle = page.locator('#addNodeToggle');
    await addNodeToggle.click();

    // Click Stereo Panner button
    const addPannerBtn = page.locator('#addStereoPannerNodeBtn');
    await expect(addPannerBtn).toBeVisible();
    await addPannerBtn.click();

    // Verify Stereo Panner node exists in the DOM
    await expect(page.locator('text=Stereo Panner').first()).toBeVisible();

    // Verify Pan slider is present
    const panSlider = page.locator('input[type="range"]').first();
    await expect(panSlider).toBeVisible();

    // Check if the label "Pan" exists near the slider
    await expect(page.locator('text=Pan').first()).toBeVisible();
  });
});

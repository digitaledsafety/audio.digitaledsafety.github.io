const { test, expect } = require('@playwright/test');

test.describe('DTS Enhancer and Vector Panner Nodes', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the local server
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    // Enter the studio
    const ctaButton = page.locator('#cta-button');
    await expect(ctaButton).toBeVisible({ timeout: 10000 });
    await ctaButton.click();
    await expect(page.locator('.rete-container')).toBeVisible();
  });

  test('should add a DTS Enhancer node and show its controls', async ({ page }) => {
    // Open Add Node dropdown
    await page.evaluate(() => {
      document.getElementById('addNodeDropdown').classList.remove('hidden');
    });

    // Click DTS Enhancer button
    const addDTSBtn = page.locator('#addDTSEnhancerNodeBtn');
    await expect(addDTSBtn).toBeVisible();
    await addDTSBtn.click();

    // Verify DTS Enhancer node exists
    await expect(page.locator('text=DTS Enhancer').first()).toBeVisible();

    // Verify controls
    await expect(page.locator('text=Punch (dB)').first()).toBeVisible();
    await expect(page.locator('text=Clarity (dB)').first()).toBeVisible();
    await expect(page.locator('text=LFE Cutoff (Hz)').first()).toBeVisible();
    await expect(page.locator('text=LFE Gain').first()).toBeVisible();

    // Verify outputs
    await expect(page.locator('text=Audio Out').first()).toBeVisible();
    await expect(page.locator('text=LFE Out').first()).toBeVisible();
  });

  test('should add a Vector Panner node and show its controls', async ({ page }) => {
    // Open Add Node dropdown
    await page.evaluate(() => {
      document.getElementById('addNodeDropdown').classList.remove('hidden');
    });

    // Click Vector Panner button
    const addVectorBtn = page.locator('#addVectorPannerNodeBtn');
    await expect(addVectorBtn).toBeVisible();
    await addVectorBtn.click();

    // Verify Vector Panner node exists
    await expect(page.locator('text=Vector Panner').first()).toBeVisible();

    // Verify controls
    await expect(page.locator('text=X (Left/Right)').first()).toBeVisible();
    await expect(page.locator('text=Y (Front/Back)').first()).toBeVisible();
  });
});

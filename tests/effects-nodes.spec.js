const { test, expect } = require('@playwright/test');

test.describe('Effects Nodes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure Chorus node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addChorusNodeBtn').click();

    const chorusNode = page.locator('[data-node-label="Chorus"]').first();
    await expect(chorusNode).toBeVisible();

    const sliders = chorusNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(4); // Rate, Depth, Delay, Mix

    // Test Rate slider
    const rateSlider = sliders.nth(0);
    await rateSlider.fill('5');
    await expect(chorusNode.locator('.value-display').nth(0)).toHaveText('5.00');
  });

  test('should add and configure Phaser node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addPhaserNodeBtn').click();

    const phaserNode = page.locator('[data-node-label="Phaser"]').first();
    await expect(phaserNode).toBeVisible();

    const sliders = phaserNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(5); // Rate, Depth, Base Freq, Feedback, Mix

    // Test Feedback slider
    const feedbackSlider = sliders.nth(3);
    await feedbackSlider.fill('0.8');
    await expect(phaserNode.locator('.value-display').nth(3)).toHaveText('0.80');
  });

  test('should add and configure Flanger node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addFlangerNodeBtn').click();

    const flangerNode = page.locator('[data-node-label="Flanger"]').first();
    await expect(flangerNode).toBeVisible();

    const sliders = flangerNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(5); // Rate, Depth, Delay, Feedback, Mix

    // Test Feedback slider
    const feedbackSlider = sliders.nth(3);
    await feedbackSlider.fill('0.7');
    await expect(flangerNode.locator('.value-display').nth(3)).toHaveText('0.70');
  });

  test('should have Rate CV input on modulation effects', async ({ page }) => {
    await page.locator('#addNodeToggle').click();

    // Add Chorus
    await page.locator('#addChorusNodeBtn').click();
    const chorusNode = page.locator('[data-node-label="Chorus"]').first();
    await expect(chorusNode.locator('.input-title:has-text("Rate CV")')).toBeVisible();

    // Add Phaser
    await page.locator('#addNodeToggle').click();
    await page.locator('#addPhaserNodeBtn').click();
    const phaserNode = page.locator('[data-node-label="Phaser"]').first();
    await expect(phaserNode.locator('.input-title:has-text("Rate CV")')).toBeVisible();

    // Add Flanger
    await page.locator('#addNodeToggle').click();
    await page.locator('#addFlangerNodeBtn').click();
    const flangerNode = page.locator('[data-node-label="Flanger"]').first();
    await expect(flangerNode.locator('.input-title:has-text("Rate CV")')).toBeVisible();
  });
});

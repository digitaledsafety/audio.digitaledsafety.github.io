const { test, expect } = require('@playwright/test');

test.describe('Mixer Node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close overlay if it exists
    const cta = page.locator('#cta-button');
    if (await cta.isVisible()) {
        await cta.click();
    }
  });

  test('should add and configure Mixer node', async ({ page }) => {
    await page.locator('#addNodeToggle').click();
    await page.locator('#addMixerNodeBtn').click();

    const mixerNode = page.locator('[data-node-label="Mixer"]').first();
    await expect(mixerNode).toBeVisible();

    // Mixer now has 4 channels, each with Gain, Pan, Mute
    // 4 gains + 4 pans = 8 sliders
    const sliders = mixerNode.locator('input[type="range"]');
    await expect(sliders).toHaveCount(8);

    // 4 mutes = 4 checkboxes (ToggleControl)
    const toggles = mixerNode.locator('input[type="checkbox"]');
    await expect(toggles).toHaveCount(4);

    // Change Gain 1
    const gain1Slider = sliders.nth(0);
    await gain1Slider.fill('0.5');
    await expect(mixerNode.locator('.value-display').nth(0)).toHaveText('0.50');

    // Change Pan 1
    const pan1Slider = sliders.nth(1);
    await pan1Slider.fill('0.7');
    await expect(mixerNode.locator('.value-display').nth(1)).toHaveText('0.70');

    // Toggle Mute 1
    // Click the toggle container/parent instead of the hidden checkbox
    const mute1ToggleLabel = mixerNode.locator('label').filter({ hasText: 'Mute 1' });
    await mute1ToggleLabel.click();

    const mute1Checkbox = toggles.nth(0);
    await expect(mute1Checkbox).toBeChecked();
  });
});

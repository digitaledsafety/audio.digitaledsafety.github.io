const { test, expect } = require('@playwright/test');

test.describe('Drum Machine Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.locator('#cta-button').click();
  });

  test('should add and randomize Drum Machine node', async ({ page }) => {
    // Clear the editor first to avoid node overlaps
    await page.locator('#settingsToggle').click();
    await page.locator('#clearEditorBtn').click();
    await page.locator('#settingsToggle').click(); // Close settings

    await page.locator('#addNodeToggle').click();
    await page.evaluate(() => {
        document.getElementById('addNodeDropdown').classList.remove('hidden');
    });
    await page.locator('#addDrumMachineNodeBtn').click();

    const drumNode = page.locator('[data-node-label="Drum Machine"]').first();
    await expect(drumNode).toBeVisible();

    const sequenceInput = drumNode.locator('input[type="text"]');
    const initialSequence = await sequenceInput.inputValue();

    const randomizeButton = drumNode.locator('button:has-text("🎲")');
    await randomizeButton.click();

    const randomizedSequence = await sequenceInput.inputValue();
    expect(randomizedSequence).not.toBe(initialSequence);
  });
});

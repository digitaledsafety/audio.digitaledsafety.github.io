const { test, expect } = require('@playwright/test');

test.describe('Clock Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
    // Wait for the Enter the Studio button and click it
    const ctaButton = page.locator('#cta-button');
    await ctaButton.click();

    // Clear the editor to ensure a clean state
    await page.locator('#settingsToggle').click();
    const clearBtn = page.locator('#clearEditorBtn');
    await clearBtn.click();
    // Close settings
    await page.locator('#settingsToggle').click();
  });

  test('should add clock-related nodes and ping pong delay', async ({ page }) => {
    // Add Master Clock
    await page.locator('#addNodeToggle').click();
    await page.locator('#addMasterClockNodeBtn').click();

    // Add Sequencer
    await page.locator('#addNodeToggle').click();
    await page.locator('#addSequencerNodeBtn').click();

    const masterClockNode = page.locator('[data-node-label="Master Clock"]');
    await expect(masterClockNode).toBeVisible();

    const sequencerNode = page.locator('[data-node-label="Sequencer"]');
    await expect(sequencerNode).toBeVisible();

    // Verify the BPM controls exist
    await expect(masterClockNode.locator('input[type="range"]')).toBeVisible();
    await expect(sequencerNode.locator('input[type="range"]')).toBeVisible();

    // Check if Ping Pong Delay was added too
    await page.locator('#addNodeToggle').click();
    const addPPBtn = page.locator('#addPingPongDelayNodeBtn');
    await expect(addPPBtn).toBeVisible();
    await addPPBtn.click();

    const ppDelayNode = page.locator('[data-node-label="Ping Pong Delay"]');
    await expect(ppDelayNode).toBeVisible();
  });
});

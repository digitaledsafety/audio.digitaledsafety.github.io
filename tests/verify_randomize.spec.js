
const { test, expect } = require('@playwright/test');

test('verify randomize buttons', async ({ page }) => {
  // Capture console logs for debugging
  page.on('console', msg => console.log('CONSOLE:', msg.text()));

  await page.goto('http://localhost:8000');

  // Click the hero button to enter the studio. This is the correct trigger.
  await page.click('#cta-button');

  // Retry logic to handle race conditions during initial load
  let nodesVisible = false;
  for (let i = 0; i < 3; i++) {
    try {
      await expect(page.locator('.node')).toHaveCount(5, { timeout: 5000 });
      nodesVisible = true;
      break;
    } catch (e) {
      console.log(`Attempt ${i + 1} failed. Retrying...`);
      await page.reload();
      await page.click('#cta-button');
    }
  }

  if (!nodesVisible) {
    throw new Error('Default workspace nodes did not load after multiple retries.');
  }


  // --- Test Sequencer Node ---
  // Add a NEW Sequencer node (it will be the 6th node on the page)
  await page.click('#addNodeToggle');
  await page.click('#addSequencerNodeBtn');

  // Wait for the 6th node to appear and select it
  await expect(page.locator('.node')).toHaveCount(6);
  const sequencerNode = page.locator('.node').nth(5); // 0-indexed

  // Get the initial sequence value from the new node
  const sequencerInput = sequencerNode.locator('input[type="text"]');
  const initialSequencerValue = await sequencerInput.inputValue();

  // Click the randomize button on the new node
  await sequencerNode.locator('button:has-text("🎲")').click();

  // Check that the sequence has changed
  const newSequencerValue = await sequencerInput.inputValue();
  expect(newSequencerValue).not.toBe(initialSequencerValue);
  expect(newSequencerValue).not.toBe('');

  // --- Test Drum Machine Node ---
  // Add a NEW Drum Machine node (it will be the 7th node)
  await page.click('#addNodeToggle');
  await page.click('#addDrumMachineNodeBtn');

  // Wait for the 7th node to appear and select it
  await expect(page.locator('.node')).toHaveCount(7);
  const drumNode = page.locator('.node').nth(6);

  // Get the initial drum machine sequence value
  const drumMachineInput = drumNode.locator('input[type="text"]');
  const initialDrumMachineValue = await drumMachineInput.inputValue();

  // Click the randomize button on the drum node
  await drumNode.locator('button:has-text("🎲")').click();

  // Check that the drum machine sequence has changed
  const newDrumMachineValue = await drumMachineInput.inputValue();
  expect(newDrumMachineValue).not.toBe(initialDrumMachineValue);
  expect(newDrumMachineValue).not.toBe('');

  // Take a final screenshot for verification
  await page.screenshot({ path: 'randomize_buttons_verification.png' });
});

import { test, expect } from '@playwright/test';

test('Final verification of Arpeggiator and Sequencer clock synchronization', async ({ page }) => {
  await page.goto('http://localhost:8000');

  // Dismiss the hero overlay and start audio
  await page.click('#cta-button');

  // Wait for the editor to be ready
  await page.waitForSelector('#rete-container');

  // --- Part 1: Test with sync ---
  await page.evaluate(async () => {
    // Clear the editor
    await window.editor.clear();

    // Create nodes
    const masterClock = new window.MasterClockNode();
    const arpeggiator = new window.ArpeggiatorNode();
    const sequencer = new window.SequencerNode();
    const masterGain = new window.MasterGainOutputNode();

    // Add nodes to the editor
    await window.editor.addNode(masterClock);
    await window.editor.addNode(arpeggiator);
    await window.editor.addNode(sequencer);
    await window.editor.addNode(masterGain);

    // Position nodes
    await window.area.translate(masterClock.id, { x: 100, y: 100 });
    await window.area.translate(arpeggiator.id, { x: 400, y: 0 });
    await window.area.translate(sequencer.id, { x: 400, y: 200 });
    await window.area.translate(masterGain.id, { x: 700, y: 100 });

    // Create connections
    await window.editor.addConnection(new Rete.ClassicPreset.Connection(masterClock, 'clock', arpeggiator, 'clock'));
    await window.editor.addConnection(new Rete.ClassicPreset.Connection(masterClock, 'clock', sequencer, 'clock'));
    await window.editor.addConnection(new Rete.ClassicPreset.Connection(arpeggiator, 'audio', masterGain, 'audio'));
    await window.editor.addConnection(new Rete.ClassicPreset.Connection(sequencer, 'audio', masterGain, 'audio'));
  });

  // Start the master clock via its button
  const masterClockNode = page.locator(".node:has-text('Master Clock')");
  await masterClockNode.locator('button:has-text("Start")').click();

  await page.screenshot({ path: 'final_verification_synced.png' });

  // Stop the clock
  await masterClockNode.locator('button:has-text("Stop")').click();


  // --- Part 2: Test without sync ---
  await page.evaluate(async () => {
    // Clear the editor
    await window.editor.clear();

    // Create nodes
    const arpeggiator = new window.ArpeggiatorNode();
    const sequencer = new window.SequencerNode();
    const masterGain = new window.MasterGainOutputNode();

    // Add nodes to the editor
    await window.editor.addNode(arpeggiator);
    await window.editor.addNode(sequencer);
    await window.editor.addNode(masterGain);

    // Position nodes
    await window.area.translate(arpeggiator.id, { x: 100, y: 0 });
    await window.area.translate(sequencer.id, { x: 100, y: 200 });
    await window.area.translate(masterGain.id, { x: 400, y: 100 });

    // Create connections
    await window.editor.addConnection(new Rete.ClassicPreset.Connection(arpeggiator, 'audio', masterGain, 'audio'));
    await window.editor.addConnection(new Rete.ClassicPreset.Connection(sequencer, 'audio', masterGain, 'audio'));
  });

  // Start nodes with global play button
  await page.click('#playStopBtn');

  await page.screenshot({ path: 'final_verification_unsynced.png' });

  await page.click('#playStopBtn');

});

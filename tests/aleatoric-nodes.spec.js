const { test, expect } = require('@playwright/test');

test.describe('Aleatoric and Stochastic Nodes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#cta-button');
  });

  const nodes = [
    { name: 'Bernoulli Gate', label: 'Bernoulli Gate', buttonText: 'Bernoulli Gate' },
    { name: 'Turing Machine', label: 'Turing Machine', buttonText: 'Turing Machine' },
    { name: 'Sample & Hold', label: 'Sample & Hold', buttonText: 'S&H' },
    { name: 'Random Voltage', label: 'Random Voltage', buttonText: 'Random Volt' },
  ];

  for (const node of nodes) {
    test(`should add ${node.name} node`, async ({ page }) => {
      await page.locator('#addNodeToggle').click();

      const addButton = page.locator(`button:has-text("${node.buttonText}")`).first();
      await expect(addButton).toBeVisible();
      await addButton.click();

      // Check if node is added to the editor
      const nodeElement = page.locator(`[data-node-label="${node.label}"]`).first();
      await expect(nodeElement).toBeVisible({ timeout: 10000 });
    });
  }
});

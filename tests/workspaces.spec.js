const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const workspacesDir = path.resolve(__dirname, '../_workspaces');
const workspaceFiles = fs.readdirSync(workspacesDir).filter(f => f.endsWith('.md'));

workspaceFiles.forEach(file => {
  test(`Workspace: ${file} should load without errors`, async ({ page }) => {
    // 1. Read and decode the workspace data
    const fullPath = path.join(workspacesDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(/workspace_data:\s*([A-Za-z0-9+/=]+)/);

    if (!match) {
        test.skip(`No workspace_data in ${file}`);
        return;
    }

    const encodedData = match[1].trim();

    // 2. Open the app
    await page.goto('/');

    // 3. Catch console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('ServiceWorker') && !text.includes('favicon.ico') && !text.includes('404')) {
            errors.push(text);
        }
      }
    });
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    // 4. Initialize the app by clicking the CTA button
    const cta = page.locator('#cta-button');
    await expect(cta).toBeVisible({ timeout: 30000 });
    await cta.click();

    // 5. Inject the workspace data into the app's editor
    await page.waitForSelector('#hero-overlay', { state: 'detached', timeout: 30000 });

    const loadResult = await page.evaluate(async (dataStr) => {
        try {
            const cleanDataStr = dataStr.replace(/\s/g, '');
            let data;
            try {
                data = JSON.parse(atob(cleanDataStr));
            } catch (e) {
                const decodedRaw = atob(cleanDataStr);
                const sanitized = decodedRaw.replace(/[\x00-\x1F\x7F-\x9F]/g, (c) => {
                    if (c === '\n') return '\n';
                    if (c === '\r') return '\r';
                    if (c === '\t') return '\t';
                    return '';
                });
                data = JSON.parse(sanitized);
            }

            if (typeof window.editorFromJSON !== 'function') {
                return { success: false, error: 'editorFromJSON not found' };
            }
            await window.editorFromJSON(data);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }, encodedData);

    expect(loadResult.success, `Failed to load workspace JSON from ${file}: ${loadResult.error}`).toBe(true);

    // 6. Verify nodes are rendered
    const nodeLocator = page.locator('#rete-container div').filter({ hasText: /.+/ });
    await expect(async () => {
        const count = await nodeLocator.count();
        expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 30000 });

    // 7. Check for critical errors
    expect(errors).toEqual([]);
  });
});

test('RandomWorkspaceGenerator should produce valid workspaces', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('#cta-button');
  await expect(cta).toBeVisible({ timeout: 30000 });
  await cta.click();
  await page.waitForSelector('#hero-overlay', { state: 'detached', timeout: 30000 });

  const settingsBtn = page.locator('button:has-text("⚙️")');
  await settingsBtn.click();

  const randomizeBtn = page.locator('#randomizeWorkspaceBtn');
  await expect(randomizeBtn).toBeVisible();
  await randomizeBtn.click();

  const nodeLocator = page.locator('#rete-container div').filter({ hasText: /.+/ });
  await expect(async () => {
      const count = await nodeLocator.count();
      expect(count).toBeGreaterThan(0);
  }).toPass({ timeout: 30000 });

  const masterNode = page.locator('#rete-container').getByText('Master', { exact: false });
  await expect(masterNode.first()).toBeVisible();
});

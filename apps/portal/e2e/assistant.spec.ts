import { test, expect } from '@playwright/test';

test.describe('AI Assistant — Génie', () => {
  test('opens sidebar panel and sends message', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));

    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    // Find and click sidebar tab
    const tab = page.locator('.genie-tab');
    await expect(tab).toBeVisible();
    await expect(tab).toContainText('Génie');
    await tab.click();

    // Panel should slide open
    const panel = page.locator('.genie-panel--open');
    await expect(panel).toBeVisible();

    // Welcome state should show
    await expect(page.locator('.genie-panel__welcome')).toBeVisible();
    await expect(page.locator('.genie-panel__title')).toContainText('Génie');

    // Type and send a message
    const input = page.locator('.genie-panel__textarea');
    await input.fill('Bonjour');
    await input.press('Enter');

    // Wait for response
    await page.waitForTimeout(8000);

    // Check messages rendered
    const messages = page.locator('.genie-message');
    const count = await messages.count();

    console.log('Messages rendered: ' + count);
    console.log('Errors: ' + JSON.stringify(errors));

    for (let i = 0; i < count; i++) {
      const text = await messages.nth(i).innerText();
      const cls = await messages.nth(i).getAttribute('class');
      console.log('Message ' + i + ' [' + cls + ']: ' + text.substring(0, 100));
    }

    // Check loading finished
    const loading = page.locator('.genie-message__typing');
    const isLoading = await loading.isVisible();
    console.log('Still loading: ' + isLoading);

    // Should have user message + assistant response
    expect(count).toBeGreaterThanOrEqual(2);
    expect(errors).toHaveLength(0);
  });

  test('suggested prompts trigger chat', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    const tab = page.locator('.genie-tab');
    await tab.click();

    // Click first suggestion
    const suggestion = page.locator('.genie-suggestion').first();
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    // Wait for network response
    await page.waitForTimeout(8000);

    const messages = page.locator('.genie-message');
    const count = await messages.count();
    console.log('Messages after suggestion: ' + count);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('tab shows Génie branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    const tab = page.locator('.genie-tab');
    await expect(tab).toBeVisible();
    await expect(tab).toContainText('Génie');

    // Custom SVG icon should be present (not emoji)
    const svg = tab.locator('svg');
    await expect(svg).toBeVisible();
  });
});

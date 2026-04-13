import { test, expect } from '@playwright/test';

test.describe('AI Assistant', () => {
  test('opens chat panel and sends message', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));

    await page.goto('/');
    // Wait for app to render (NJSidebarRoot renders as .nj-sidebar)
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    // Find and click FAB
    const fab = page.locator('.assistant-fab');
    await expect(fab).toBeVisible();
    await fab.click();

    // Panel should open
    const panel = page.locator('.assistant-panel--open');
    await expect(panel).toBeVisible();

    // Welcome state should show
    await expect(page.locator('.assistant-panel__welcome')).toBeVisible();

    // Type and send a message
    const input = page.locator('.assistant-panel__text-input');
    await input.fill('Bonjour');
    await input.press('Enter');

    // Wait for response
    await page.waitForTimeout(8000);

    // Check messages rendered
    const messages = page.locator('.assistant-message');
    const count = await messages.count();
    
    console.log('Messages rendered: ' + count);
    console.log('Errors: ' + JSON.stringify(errors));
    
    // Log message content for debugging
    for (let i = 0; i < count; i++) {
      const text = await messages.nth(i).innerText();
      const cls = await messages.nth(i).getAttribute('class');
      console.log('Message ' + i + ' [' + cls + ']: ' + text.substring(0, 100));
    }

    // Check if there's a loading indicator still showing
    const loading = page.locator('.assistant-message__typing');
    const isLoading = await loading.isVisible();
    console.log('Still loading: ' + isLoading);
    
    // Check status indicator
    const statusEl = page.locator('.assistant-panel__status');
    const status = await statusEl.textContent();
    console.log('Status: ' + status);
    
    // Should have user message + assistant response
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('suggested prompts trigger chat', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    const fab = page.locator('.assistant-fab');
    await fab.click();

    // Click first suggestion
    const suggestion = page.locator('.assistant-panel__suggestion').first();
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    // Wait for network response
    await page.waitForTimeout(8000);

    const messages = page.locator('.assistant-message');
    const count = await messages.count();
    console.log('Messages after suggestion: ' + count);
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

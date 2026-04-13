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

  test('session persists across page refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    // Open Génie and send a message
    const tab = page.locator('.genie-tab');
    await tab.click();
    const input = page.locator('.genie-panel__textarea');
    await input.fill('Bonjour, test de persistance');
    await input.press('Enter');

    // Wait for response (server creates session + persists events, may take longer)
    await page.waitForTimeout(15000);

    // Verify messages exist
    const messagesBeforeRefresh = page.locator('.genie-message');
    const countBefore = await messagesBeforeRefresh.count();
    console.log('Messages before refresh:', countBefore);
    expect(countBefore).toBeGreaterThanOrEqual(2);

    // Check sessionId is stored in sessionStorage
    const sessionIdBefore = await page.evaluate(() => sessionStorage.getItem('genie-session-id'));
    console.log('Session ID before refresh:', sessionIdBefore);
    expect(sessionIdBefore).toBeTruthy();

    // Refresh the page
    await page.reload();
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    // Open Génie again
    await tab.click();
    await page.waitForSelector('.genie-panel--open', { timeout: 5000 });

    // Wait for session restore
    await page.waitForTimeout(5000);

    // Verify sessionId is preserved
    const sessionIdAfter = await page.evaluate(() => sessionStorage.getItem('genie-session-id'));
    console.log('Session ID after refresh:', sessionIdAfter);
    expect(sessionIdAfter).toBe(sessionIdBefore);

    // Verify messages are restored
    const messagesAfterRefresh = page.locator('.genie-message');
    const countAfter = await messagesAfterRefresh.count();
    console.log('Messages after refresh:', countAfter);
    expect(countAfter).toBeGreaterThanOrEqual(2);
  });

  test('history drawer shows sessions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    // Open Génie
    const tab = page.locator('.genie-tab');
    await tab.click();
    await page.waitForSelector('.genie-panel--open', { timeout: 5000 });

    // Click history button
    const historyBtn = page.locator('[aria-label="Historique"]');
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();

    // History drawer should appear
    const history = page.locator('.genie-history');
    await expect(history).toBeVisible();
    await expect(page.locator('.genie-history__title')).toContainText('Conversations récentes');
  });

  test('generative UI renders tool cards for alert queries', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    // Open Génie
    const tab = page.locator('.genie-tab');
    await tab.click();
    await page.waitForSelector('.genie-panel--open', { timeout: 5000 });

    // Type a prompt that triggers getAlerts tool
    const input = page.locator('.genie-panel__textarea');
    await input.fill('Quelles sont mes alertes ?');
    await input.press('Enter');

    // Wait for tool call + response (may take time for session creation + AI)
    await page.waitForTimeout(15000);

    // Debug: log all message parts
    const partTypes = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.genie-message--assistant');
      const info: string[] = [];
      msgs.forEach(msg => {
        info.push('MSG classes: ' + msg.className);
        const cards = msg.querySelectorAll('.genui-card');
        info.push('GenUI cards: ' + cards.length);
        const skeletons = msg.querySelectorAll('.genui-skeleton');
        info.push('Skeletons: ' + skeletons.length);
        // Check for any child content
        info.push('Inner HTML length: ' + msg.innerHTML.length);
      });
      return info;
    });
    console.log('Part debug:', partTypes);

    // Check that at least one genui card rendered
    const genuiCards = page.locator('.genui-card');
    const cardCount = await genuiCards.count();
    console.log('GenUI cards rendered:', cardCount);

    // If no genui card, check what messages exist
    const allMessages = page.locator('.genie-message');
    const msgCount = await allMessages.count();
    console.log('Total messages:', msgCount);

    expect(cardCount).toBeGreaterThanOrEqual(1);
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

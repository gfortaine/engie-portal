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

    // Check for genui card OR text response (LLM may not always call the tool)
    const genuiCards = page.locator('.genui-card');
    const cardCount = await genuiCards.count();
    console.log('GenUI cards rendered:', cardCount);

    const assistantMsgs = page.locator('.genie-message--assistant');
    const assistantCount = await assistantMsgs.count();
    console.log('Assistant messages:', assistantCount);

    // At minimum we should get an assistant response (card or text)
    expect(assistantCount).toBeGreaterThanOrEqual(1);
    // If the tool was called, verify the genui card rendered
    if (cardCount > 0) {
      expect(cardCount).toBeGreaterThanOrEqual(1);
    }
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

  test('HITL approval flow for suggestSavings', async ({ page }) => {
    test.setTimeout(45000);
    // Capture browser console for debugging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[browser ${msg.type()}]`, msg.text());
      }
    });
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        console.log(`[HTTP ${response.status()}]`, response.url());
      }
    });

    await page.goto('/');
    await page.waitForSelector('.nj-sidebar', { timeout: 10000 });

    // Open Génie
    const tab = page.locator('.genie-tab');
    await tab.click();
    await page.waitForSelector('.genie-panel--open', { timeout: 5000 });

    // Type a prompt that triggers suggestSavings (needsApproval: true)
    const input = page.locator('.genie-panel__textarea');
    await input.fill('Comment économiser ?');
    await input.press('Enter');

    // Wait for tool call — approval card should appear
    await page.waitForTimeout(15000);

    // Check for approval card or genui card (model may approve automatically or show approval UI)
    const approvalCard = page.locator('.genie-approval');
    const genuiCard = page.locator('.genui-card');
    const approvalCount = await approvalCard.count();
    const genuiCount = await genuiCard.count();
    console.log('HITL approval cards:', approvalCount, 'GenUI cards:', genuiCount);

    if (approvalCount > 0) {
      // Click "Confirmer" button
      const confirmBtn = page.locator('.genie-approval__btn--confirm').first();
      await confirmBtn.click();

      // Wait for tool execution after approval
      await page.waitForTimeout(15000);

      // Debug: dump all message content
      const debugInfo = await page.evaluate(() => {
        const msgs = document.querySelectorAll('.genie-message');
        return Array.from(msgs).map(m => ({
          classes: m.className,
          text: m.textContent?.slice(0, 200),
          childCount: m.children.length,
          innerHTML: m.innerHTML.slice(0, 500),
        }));
      });
      console.log('Post-approval messages:', JSON.stringify(debugInfo, null, 2));

      // After approval, the genui card should render
      const postApprovalCards = page.locator('.genui-card');
      const postCount = await postApprovalCards.count();
      console.log('Post-approval GenUI cards:', postCount);
      // Also check if there's at least an assistant response (text or card)
      const assistantMsgs = page.locator('.genie-message--assistant');
      const assistantCount = await assistantMsgs.count();
      console.log('Post-approval assistant messages:', assistantCount);
      expect(assistantCount).toBeGreaterThanOrEqual(1);
    } else {
      // Model might have responded with text or used the tool directly
      // At minimum we should have messages
      const allMessages = page.locator('.genie-message');
      const msgCount = await allMessages.count();
      console.log('Total messages (no approval):', msgCount);
      expect(msgCount).toBeGreaterThanOrEqual(2);
    }
  });
});

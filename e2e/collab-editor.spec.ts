import { test, expect } from '@playwright/test';

test.describe('Collabdoc - E2E Integration Suite', () => {
  const testUserEmail = 'testsprite@example.com';
  const testUserPassword = 'TestPassword123!';

  test('verifies auth, document CRUD, multi-collaborator Yjs sync, and trash operations', async ({
    page,
    browser,
  }) => {
    test.setTimeout(120000);
    // Register console and page error listeners
    page.on('console', (msg) => console.log(`[BROWSER LOG] [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.error(`[BROWSER ERROR] ${err.message}\n${err.stack}`));

    // 1. Authenticate and reach Dashboard
    await page.goto('/signin');
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', testUserPassword);
    await page.click('button[type="submit"]');

    // Assert dashboard redirection
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Create a Collaborative Document
    await page.click('[data-testid="create-document-button"]');

    // Assert redirection to editor workspace
    await expect(page).toHaveURL(/\/d\/[a-zA-Z0-9_-]+/);
    const editorUrl = page.url();
    const documentId = editorUrl.split('/').pop()?.split('?')[0] || '';
    expect(documentId).not.toBe('');

    // 3. Rename Document Title
    await page.click('[data-testid="document-title"]');
    await page.fill('[data-testid="title-input"]', 'E2E Collaboration Testing Run');
    await page.press('[data-testid="title-input"]', 'Enter');

    // Assert title updated
    await expect(page.locator('[data-testid="document-title"]')).toHaveText(
      'E2E Collaboration Testing Run',
    );

    // 4. Test Multi-User Real-time Collaboration (Sync)
    const storageState = await page.context().storageState();
    const secondContext = await browser.newContext({ storageState });
    const pageCollaborator = await secondContext.newPage();

    // Navigate to the same document
    await pageCollaborator.goto(`/d/${documentId}`);

    // Wait for the editable TipTap areas to load and hydrate
    await page.waitForSelector('.tiptap', { state: 'visible' });
    await pageCollaborator.waitForSelector('.tiptap', { state: 'visible' });

    // Type text as the collaborator
    const collaboratorEditor = pageCollaborator.locator('.tiptap');
    await collaboratorEditor.focus();
    await pageCollaborator.keyboard.type('Hello, the WebSocket connection is functioning E2E!');

    // Assert that the text replicates in the primary editor instance in real time
    const primaryEditor = page.locator('.tiptap');
    await expect(primaryEditor).toContainText(
      'Hello, the WebSocket connection is functioning E2E!',
    );

    // Close secondary context
    await secondContext.close();

    // 5. Back to Dashboard and Document Trash lifecycle
    await page.click('[title="Back to Dashboard"]');
    await expect(page).toHaveURL(/\/dashboard/);

    const docCard = page.locator(`[data-testid="document-card-${documentId}"]`);
    await expect(docCard).toBeVisible();

    // Settle delay to avoid HMR / Fast Refresh DOM detachment
    await page.waitForTimeout(2000);

    // Right-click to open Context Menu and trash
    await docCard.dispatchEvent('contextmenu');
    const moveToTrashItem = page.locator('[role="menuitem"]:has-text("Move to trash")');
    await expect(moveToTrashItem).toBeVisible();
    await moveToTrashItem.click({ force: true });

    // Verify card is removed from active list
    await expect(docCard).not.toBeVisible();

    // Verify presence in Trash
    await page.goto('/trash');
    const trashedCard = page.locator(`[data-testid="document-card-${documentId}"]`);
    await expect(trashedCard).toBeVisible();

    // Settle delay to avoid HMR / Fast Refresh DOM detachment
    await page.waitForTimeout(2000);

    // Right-click and restore
    await trashedCard.dispatchEvent('contextmenu');
    const restoreItem = page.locator('[role="menuitem"]:has-text("Restore")');
    await expect(restoreItem).toBeVisible();
    await restoreItem.click({ force: true });

    // Verify card removed from Trash
    await expect(trashedCard).not.toBeVisible();

    // Go back to Dashboard and verify active state
    await page.goto('/dashboard');
    await expect(docCard).toBeVisible();
  });
});

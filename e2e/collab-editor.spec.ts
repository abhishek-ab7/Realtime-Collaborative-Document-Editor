import { test, expect } from '@playwright/test';

test.describe('Collabdoc - E2E Integration Suite', () => {
  const testUserEmail = 'testsprite@example.com';
  const testUserPassword = 'TestPassword123!';

  test('verifies auth, document CRUD, multi-collaborator Yjs sync, and trash operations', async ({
    page,
    browser,
  }) => {
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
    const secondContext = await browser.newContext();
    const pageCollaborator = await secondContext.newPage();

    // Authenticate the second collaborator
    await pageCollaborator.goto('/signin');
    await pageCollaborator.fill('input[type="email"]', testUserEmail);
    await pageCollaborator.fill('input[type="password"]', testUserPassword);
    await pageCollaborator.click('button[type="submit"]');
    await expect(pageCollaborator).toHaveURL(/\/dashboard/);

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
    await page.click('button[title="Back to Dashboard"]');
    await expect(page).toHaveURL(/\/dashboard/);

    const docCard = page.locator(`[data-testid="document-card-${documentId}"]`);
    await expect(docCard).toBeVisible();

    // Right-click to open Context Menu and trash
    await docCard.click({ button: 'right' });
    const moveToTrashItem = page.locator('text=Move to trash');
    await expect(moveToTrashItem).toBeVisible();
    await moveToTrashItem.click();

    // Verify card is removed from active list
    await expect(docCard).not.toBeVisible();

    // Verify presence in Trash
    await page.goto('/trash');
    const trashedCard = page.locator(`[data-testid="document-card-${documentId}"]`);
    await expect(trashedCard).toBeVisible();

    // Right-click and restore
    await trashedCard.click({ button: 'right' });
    const restoreItem = page.locator('text=Restore');
    await expect(restoreItem).toBeVisible();
    await restoreItem.click();

    // Verify card removed from Trash
    await expect(trashedCard).not.toBeVisible();

    // Go back to Dashboard and verify active state
    await page.goto('/dashboard');
    await expect(docCard).toBeVisible();
  });
});

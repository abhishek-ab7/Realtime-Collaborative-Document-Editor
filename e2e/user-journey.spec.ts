import { test, expect } from '@playwright/test';

test.describe('User Journey E2E', () => {
  test('creates, renames, and trashes a document', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Visit dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('My Documents');

    // 2. Create document
    await page.click('[data-testid="create-document-button"]');
    await expect(page).toHaveURL(/\/d\/[a-zA-Z0-9_-]+/);
    const editorUrl = page.url();
    const documentId = editorUrl.split('/').pop()?.split('?')[0] || '';
    expect(documentId).not.toBe('');

    // 3. Rename document
    await page.click('[data-testid="document-title"]');
    await page.fill('[data-testid="title-input"]', 'E2E User Journey Document');
    await page.press('[data-testid="title-input"]', 'Enter');
    await expect(page.locator('[data-testid="document-title"]')).toHaveText(
      'E2E User Journey Document',
    );

    // 4. Back to Dashboard
    await page.click('[title="Back to Dashboard"]');
    await expect(page).toHaveURL(/\/dashboard/);
    const docCard = page.locator(`[data-testid="document-card-${documentId}"]`);
    await expect(docCard).toBeVisible();

    // 5. Move to trash
    await page.waitForTimeout(1000);
    await docCard.dispatchEvent('contextmenu');
    const moveToTrashItem = page.locator('[role="menuitem"]:has-text("Move to trash")');
    await expect(moveToTrashItem).toBeVisible();
    await moveToTrashItem.click({ force: true });

    // Verify card is removed from active list
    await expect(docCard).not.toBeVisible();
  });
});

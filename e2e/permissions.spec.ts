import { test, expect } from '@playwright/test';

test.describe('E2E Permissions Enforcement', () => {
  test('enforces read-only mode for viewer', async ({ page, browser }) => {
    test.setTimeout(90000);

    // 1. Generate a random viewer email
    const viewerEmail = `viewer-${Date.now()}@example.com`;
    const viewerPassword = 'TestPassword123!';

    // 2. Open a second browser context to sign up the viewer
    const secondContext = await browser.newContext();
    const viewerPage = await secondContext.newPage();

    await viewerPage.goto('/signup');
    await viewerPage.fill('input[type="email"]', viewerEmail);
    await viewerPage.fill('input[type="password"]', viewerPassword);
    await viewerPage.click('button[type="submit"]');

    // Wait for signup redirect to dashboard (indicates registration complete)
    await expect(viewerPage).toHaveURL(/\/dashboard/);

    // 3. Owner creates a document
    await page.goto('/dashboard');
    await page.click('[data-testid="create-document-button"]');
    await expect(page).toHaveURL(/\/d\/[a-zA-Z0-9_-]+/);
    const editorUrl = page.url();
    const documentId = editorUrl.split('/').pop()?.split('?')[0] || '';

    // 4. Owner invites the viewer user as a VIEWER
    await page.click('[data-testid="share-button"]');
    await page.waitForSelector('[data-testid="share-dialog"]', { state: 'visible' });

    // Type email in invite form
    await page.fill('[data-testid="invite-email-input"]', viewerEmail);
    // Select VIEWER role
    await page.selectOption('[data-testid="invite-role-select"]', 'VIEWER');
    await page.click('[data-testid="invite-submit-button"]');

    // Wait for collaborator to appear in list
    await expect(page.locator(`text=${viewerEmail}`)).toBeVisible();
    // Close dialog
    await page.keyboard.press('Escape');

    // 5. Viewer user navigates to the document
    await viewerPage.goto(`/d/${documentId}`);

    // Wait for the editor to load
    await viewerPage.waitForSelector('.tiptap', { state: 'visible' });

    // 6. Assert viewer sees read-only elements
    // View-only banner must be visible
    await expect(viewerPage.locator('text=You have view-only access')).toBeVisible();

    // Editor toolbar must NOT be visible
    const toolbar = viewerPage.locator('[data-testid="editor-toolbar"]');
    await expect(toolbar).not.toBeVisible();

    // Try typing and assert text is not entered (editor stays read-only)
    const editor = viewerPage.locator('.tiptap');
    const initialText = await editor.textContent();
    await editor.focus();
    await viewerPage.keyboard.type('Trying to edit as viewer');
    await viewerPage.waitForTimeout(1000);
    const textAfterTyping = await editor.textContent();
    expect(textAfterTyping).toBe(initialText);

    // Clean up
    await secondContext.close();
  });
});

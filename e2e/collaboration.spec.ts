import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration E2E', () => {
  test('verifies document updates sync between two editor contexts', async ({ page, browser }) => {
    test.setTimeout(90000);

    // 1. Primary context creates the document
    await page.goto('/dashboard');
    await page.click('[data-testid="create-document-button"]');
    await expect(page).toHaveURL(/\/d\/[a-zA-Z0-9_-]+/);
    const editorUrl = page.url();

    // 2. Open secondary context using cached state
    const storageState = await page.context().storageState();
    const secondContext = await browser.newContext({ storageState });
    const collaboratorPage = await secondContext.newPage();
    await collaboratorPage.goto(editorUrl);

    // 3. Wait for editors to load
    await page.waitForSelector('.tiptap', { state: 'visible' });
    await collaboratorPage.waitForSelector('.tiptap', { state: 'visible' });

    // 4. Type in the primary editor
    const primaryEditor = page.locator('.tiptap');
    await primaryEditor.focus();
    await page.keyboard.type('Primary user edits this doc.');

    // 5. Assert sync in collaborator editor
    const collaboratorEditor = collaboratorPage.locator('.tiptap');
    await expect(collaboratorEditor).toContainText('Primary user edits this doc.');

    // 6. Type in the collaborator editor
    await collaboratorEditor.focus();
    await collaboratorPage.keyboard.press('Enter');
    await collaboratorPage.keyboard.type('Collaborator user replies here.');

    // 7. Assert sync in primary editor
    await expect(primaryEditor).toContainText('Collaborator user replies here.');

    // Clean up
    await secondContext.close();
  });
});

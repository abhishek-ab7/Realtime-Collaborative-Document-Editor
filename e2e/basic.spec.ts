import { test, expect } from '@playwright/test';

test('landing page loads successfully', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title).toContain('Collabdoc');
});

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const testUserEmail = 'testsprite@example.com';
  const testUserPassword = 'TestPassword123!';

  await page.goto('/signin');
  await page.fill('input[type="email"]', testUserEmail);
  await page.fill('input[type="password"]', testUserPassword);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});

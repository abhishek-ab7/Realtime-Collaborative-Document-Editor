import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Register console and page error listeners
  page.on('console', (msg) => console.log(`[BROWSER LOG] [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => console.error(`[BROWSER ERROR] ${err.message}\n${err.stack}`));

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

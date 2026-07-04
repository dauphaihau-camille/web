import { expect, test } from '@playwright/test';

test('marketing page loads', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
});

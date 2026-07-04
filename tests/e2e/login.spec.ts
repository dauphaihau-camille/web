import { expect, test } from '@playwright/test';

import { apiBaseUrl, mockLoginApi } from './helpers/api-mocks';

test.describe('login flow', () => {
  test('shows client validation for a short password without calling the API', async ({
    page,
  }) => {
    let loginRequestCount = 0;

    await page.route(`${apiBaseUrl}/auth/login`, async route => {
      loginRequestCount += 1;
      await route.abort();
    });

    await page.goto('/login');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Continue with email' }).click();

    await expect(
      page.getByText('Password must be at least 8 characters.'),
    ).toBeVisible();
    expect(loginRequestCount).toBe(0);
  });

  test('redirects to the requested path after a successful login', async ({ page }) => {
    await mockLoginApi(page);

    await page.goto('/login?redirectTo=%2F');
    await page.getByRole('button', { name: 'Continue with email' }).click();

    await expect(page).toHaveURL('http://127.0.0.1:4000/');
    await expect(
      page.getByRole('link', { name: /get start for free/i }),
    ).toBeVisible();
  });

  test('shows the API error when login fails', async ({ page }) => {
    await mockLoginApi(page, {
      loginStatus: 401,
      loginBody: {
        message: 'Invalid email or password.',
      },
      currentUserStatus: 401,
      workspaces: [],
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue with email' }).click();

    await expect(
      page.getByText(/401|unauthorized|request failed/i),
    ).toBeVisible();
    await expect(page).toHaveURL('http://127.0.0.1:4000/login');
  });
});

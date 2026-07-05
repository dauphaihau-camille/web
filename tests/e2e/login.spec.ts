import { expect, test } from '@playwright/test';

import { apiBaseUrl, mockLoginApi } from './helpers/api-mocks';

test.describe('login flow', () => {
  test('shows client validation for an invalid email without calling the API', async ({
    page,
  }) => {
    let startRequestCount = 0;

    await page.route(`${apiBaseUrl}/auth/email/start`, async route => {
      startRequestCount += 1;
      await route.abort();
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Invalid email address')).toBeVisible();
    expect(startRequestCount).toBe(0);
  });

  test('redirects to the requested path after a successful login', async ({ page }) => {
    await mockLoginApi(page);

    await page.goto('/login?redirectTo=%2F');
    await page.getByLabel('Email').fill('member@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByPlaceholder('123456').fill('123456');
    await page.getByRole('button', { name: 'Verify code' }).click();

    await expect(page).toHaveURL('http://127.0.0.1:4000/');
    await expect(
      page.getByRole('link', { name: /get start for free/i }),
    ).toBeVisible();
  });

  test('shows the API error when login fails', async ({ page }) => {
    await mockLoginApi(page, {
      verifyStatus: 401,
      verifyBody: {
        message: 'Invalid login code.',
      },
      currentUserStatus: 401,
      workspaces: [],
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('member@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByPlaceholder('123456').fill('123456');
    await page.getByRole('button', { name: 'Verify code' }).click();

    await expect(
      page.getByText(/401|unauthorized|request failed/i),
    ).toBeVisible();
    await expect(page).toHaveURL('http://127.0.0.1:4000/login');
  });
});

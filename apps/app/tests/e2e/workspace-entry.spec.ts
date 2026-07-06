import { expect, test } from '@playwright/test';

import { addAuthenticatedSession } from './helpers/api-mocks';

test.describe('workspace entry', () => {
  test('redirects unauthenticated users to login with the original target', async ({
    page,
  }) => {
    await page.goto('/workspace');

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fworkspace$/);
    await expect(
      page.getByRole('heading', { name: 'Log in' }),
    ).toBeVisible();
  });

  test('shows the first-workspace form for authenticated users with no workspaces', async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);

    await page.goto('/workspace');

    await expect(
      page.getByRole('heading', { name: 'Create your first workspace' }),
    ).toBeVisible();
    await expect(page.getByLabel('Workspace name')).toBeVisible();
    await expect(page.getByLabel('Domain')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create workspace' }),
    ).toBeVisible();
  });
});

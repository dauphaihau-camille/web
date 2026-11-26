import { expect, test } from '@playwright/test';

const THEMES = [
  { theme: 'light', label: 'Light' },
  { theme: 'dark', label: 'Dark' },
] as const;

test.describe('design system gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design');
    await expect(page.locator('[data-gallery]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
  });

  test('renders every primitive section', async ({ page }) => {
    for (const heading of [
      'Buttons',
      'Badges',
      'Inputs',
      'Overlays',
      'Surfaces and states',
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'publish' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'disabled' })).toBeDisabled();
    await expect(page.getByText('No documents yet')).toBeVisible();
  });

  for (const { theme, label } of THEMES) {
    test(`matches the ${theme} baseline`, async ({ page }) => {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));

      await expect(page).toHaveScreenshot(`design-gallery-${theme}.png`, {
        fullPage: true,
      });
    });
  }
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  outputDir: 'test-results/visual',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5102',
    viewport: { width: 1280, height: 1400 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    trace: 'off',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.002,
    },
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://127.0.0.1:5102',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5100',
      NEXT_PUBLIC_API_VERSION: 'v1',
      NEXT_PUBLIC_MARKETING_HOST: 'http://localhost:5101',
    },
  },
});

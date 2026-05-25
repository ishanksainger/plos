import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Visual regression + smoke tests for the NIS marketing site.
 *
 * Run locally:
 *   npx playwright install chromium      # one-time, ~250 MB
 *   npm run test:e2e                     # full run
 *   npm run test:e2e -- --update-snapshots   # refresh baselines
 *
 * The webServer config boots `next dev` before tests run.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      // Allow ~0.2% pixel diff for font-rendering wiggle across OSes.
      maxDiffPixelRatio: 0.002,
      threshold: 0.2,
    },
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

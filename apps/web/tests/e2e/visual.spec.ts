import { test, expect } from '@playwright/test';

/**
 * Visual regression suite. First run produces baselines:
 *   npm run test:e2e -- visual.spec.ts --update-snapshots
 *
 * Subsequent runs diff each screenshot against the committed baseline.
 * Baselines are platform-specific by convention — keep them out of
 * remote CI unless you're using a hosted browser (Linux baselines won't
 * match Mac baselines).
 */

const ROUTES = [
  { path: '/',                          name: 'home' },
  { path: '/trackers',                  name: 'trackers' },
  { path: '/trackers/freelancer-gst',   name: 'tracker-detail' },
  { path: '/trackers/bundle',           name: 'bundle' },
  { path: '/plos',                      name: 'plos-pillar' },
  { path: '/about',                     name: 'about' },
  { path: '/privacy',                   name: 'privacy' },
  { path: '/not-found-route',           name: '404' },
];

for (const route of ROUTES) {
  test(`visual · ${route.name}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });
    // Wait for fonts + scroll-revealed elements to settle.
    await page.waitForTimeout(800);
    // Disable anything time-based that would shift the diff.
    await page.addStyleTag({
      content: `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`,
    });
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}

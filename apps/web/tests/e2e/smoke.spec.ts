import { test, expect } from '@playwright/test';

/**
 * Smoke + structural tests. Designed to be reliable across machines —
 * no pixel snapshots, only DOM + status assertions. See visual.spec.ts
 * for the screenshot-based regression suite.
 */

const PUBLIC_ROUTES = [
  { path: '/',                            heading: /creative nest|nest of innovative/i },
  { path: '/trackers',                    heading: /spreadsheets|trackers/i },
  { path: '/trackers/freelancer-gst',     heading: /freelancer gst/i },
  { path: '/trackers/bundle',             heading: /every tracker|all-trackers/i },
  { path: '/plos',                        heading: /diary of life|plos/i },
  { path: '/about',                       heading: /two-person|about/i },
  { path: '/privacy',                     heading: /privacy/i },
  { path: '/terms',                       heading: /terms/i },
  { path: '/refund',                      heading: /refund/i },
];

for (const route of PUBLIC_ROUTES) {
  test(`route loads · ${route.path}`, async ({ page }) => {
    const res = await page.goto(route.path);
    expect(res?.status() ?? 0).toBeLessThan(400);

    // Every public page wears the NIS shell.
    await expect(page.locator('.nis-header')).toBeVisible();
    await expect(page.locator('.nis-footer')).toBeVisible();

    // Body has a heading matching the route's identity.
    await expect(page.locator('h1, h2').first()).toContainText(route.heading);
  });
}

test('404 page renders for unknown routes', async ({ page }) => {
  const res = await page.goto('/this-route-does-not-exist');
  expect(res?.status() ?? 0).toBe(404);
  await expect(page.locator('text=/we don.t have/i')).toBeVisible();
  await expect(page.locator('.nis-404-list')).toBeVisible();
});

test('sitemap + robots are served', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain('<urlset');

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain('Sitemap:');
});

test('header hamburger appears on mobile', async ({ page, viewport }) => {
  if (!viewport || viewport.width > 720) {
    test.skip();
  }
  await page.goto('/');
  await expect(page.locator('.nis-hamburger')).toBeVisible();
  await page.locator('.nis-hamburger').click();
  await expect(page.locator('.nis-mobile-menu.open')).toBeVisible();
});

test('cart button opens drawer + adds tracker', async ({ page }) => {
  await page.goto('/trackers/freelancer-gst');
  await page.getByRole('button', { name: /^add to cart/i }).click();
  await expect(page.locator('.nis-cart-overlay.open')).toBeVisible();
  await expect(page.locator('.nis-cart-line-title')).toContainText(/freelancer/i);
});

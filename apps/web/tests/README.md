# NIS web — e2e tests

Two suites under `tests/e2e/`:

| File | What |
|---|---|
| `smoke.spec.ts` | Reliable DOM + status assertions. Every public route loads, the NIS shell renders, the 404 page works, sitemap + robots are served, the mobile hamburger toggles on phone viewports, and the cart drawer opens when "Add to cart" is clicked. Safe to run on any machine. |
| `visual.spec.ts` | Screenshot-based regression on 8 key routes (home, trackers list, tracker detail, bundle, /plos pillar, about, privacy, 404). Baselines are platform-specific. |

## One-time setup

```bash
cd apps/web
npx playwright install chromium   # ~250 MB browser binary
```

## Running

```bash
# All suites (boots `next dev` automatically via playwright.config.ts)
npm run test:e2e

# Visual suite only
npm run test:e2e:visual

# Update baselines after an intentional visual change
npm run test:e2e:update
```

## CI note

Visual baselines committed to git are taken on whatever machine ran
`npm run test:e2e:update`. If your CI is Linux but you generated
baselines on a Mac, expect diffs from font rendering. Either generate
baselines inside the CI container, or skip the visual suite on CI for
now (the smoke suite alone catches most regressions).

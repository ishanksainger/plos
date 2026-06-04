# BACKLOG — Pending work register

**Single source of truth for what's not done yet.** Claude Code reads this file at the start of any session that involves picking up new work (Cursor too, on the rare `cursor`-tagged item). Update it as items move.

> **Ownership (2026-06-05):** Claude Code owns **all code** (`apps/web`, `plos-backend`, `plos-frontend`, `packages/*`). Cursor is on standby for invited parallel backend pushes only. Product *content* stays with Claude Desktop / the humans. See `CLAUDE.md` §3.

**Last updated:** 2026-06-05

---

## ▶ Next session — current truth (updated 2026-05-28)

**Major wins from the 2026-05-27/28 marathon shipping session:**
- ✅ Razorpay merchant account approved (24hr KYC turnaround) — Live keys deployed to VPS
- ✅ thenispace.com live on Hostinger VPS (NOT Vercel — using existing infra)
- ✅ app.thenispace.com live (full PLOS stack: Postgres + NestJS + Vite SPA)
- ✅ Cinema-pin bug fixed (`overflow-x: clip` not `hidden` — see deployment-state memory)
- ✅ SSH key from Mac to VPS — Claude can deploy directly
- ✅ POD partner decision locked: **Qikink** (qikink.com, Open API, India-wide)
- ✅ POD integration mode decision: **Option 1 — full e-commerce on NIS** (not link-out, not subdomain)
- ✅ GST strategy reframed: defer until ~₹10L/yr (NOT "avoid forever") — see `project_launch_legal_posture.md` memory

**Major wins from the 2026-05-28 session (Phase 1 plumbing):**
- ✅ Resend account + API key + DNS records (DKIM/SPF MX/SPF TXT) added via Hostinger API
- ✅ Hostinger MCP server registered for future sessions
- ✅ Supabase `nis-prod` project (Mumbai ap-south-1)
- ✅ Schema applied (commerce + marketing + RLS + products bucket + 2 seed products)
- ✅ Schemas exposed in Data API settings; GRANT USAGE applied to api roles
- ✅ All env vars (Supabase URL/anon/service-role/bucket + Resend api-key/from-email) wired into `/docker/nis-web/.env` and the rebuilt `nis-web` container
- ✅ Live smoke test passed: waitlist endpoint writes to Supabase, products listable via REST

**Immediate next actions (in order):**

### Phase 1 — Digital tracker delivery (blocks first tracker sale)

1. [ ] **Tracker #1 .xlsx file** — Ishank is building in Canva during night shifts (P0, sole blocker)
2. ⏳ **Resend domain verification flips to "verified"** — DNS records correct + propagated; Resend's first-time verifier is slow. Background, no action needed.
3. [ ] **Upload tracker #1** to Supabase `products` bucket at path `trackers/freelancer-gst.xlsx` (claude, 2 min — already seeded in DB)
4. [ ] **Live ₹249 payment self-test** via UPI, refund from Razorpay dashboard (human, 10 min)

### Phase 2 — Qikink POD storefront (Option 1, full e-commerce on NIS)

See `memory/project_build_plan_qikink_storefront.md` for the sequenced detail. Top-level:

7. [ ] **Qikink account + API credentials** (human, 15 min)
8. [ ] **`packages/qikink-sdk/`** — server-side typed wrappers, mirror @nis/razorpay-sdk shape (claude, 1 hr)
9. [ ] **Merch catalog + variants** in `apps/web/lib/merch-catalog.ts` (claude, 30 min)
10. [ ] **/shop/merch + /shop/merch/[slug]** pages with size/colour picker (claude, 3 hr)
11. [ ] **Extend cart drawer** for physical goods (qty, variant display, shipping) (claude, 2 hr)
12. [ ] **Checkout page** with address form + Qikink pincode validation (claude, 2 hr)
13. [ ] **`/api/qikink/shipping-quote`** route — pincode → shipping cost (claude, 1 hr)
14. [ ] **`/api/razorpay/merch-order` + `merch-verify`** routes (parallel to existing tracker routes) (claude, 2 hr)
15. [ ] **Extend webhook** to call Qikink for merch fulfilment on `payment.captured` (claude, 30 min)
16. [ ] **Order status page `/orders/[id]`** with Qikink tracking number (claude, 1 hr)
17. [ ] **Update Shipping + Return + Privacy policy pages** for physical goods (claude/human, 1 hr)
18. [ ] **Test order — real ₹599 t-shirt to Ishank's own address** (human, 15 min + 2-5 day delivery)

**Phase 2 total dev time:** ~15-18 hrs of focused coding. On side-hustle pace = 2-3 weeks.

### Phase 3 — Operational (post-launch polish)

19. [ ] **`/admin/orders` dashboard** (auth-gated) for daily monitoring (claude, 2 hr)
20. [ ] **Plausible analytics** self-hosted on VPS (claude, 1 hr)
21. [ ] **COD enablement decision** + wiring (Ishank decides; Qikink supports it)
22. [ ] **support@thenispace.com** Gmail forwarding (human, 30 min)

### Phase 4 — Deferred until ₹50K+/mo revenue OR explicit trigger

- PLOS Pro subscription flow (trigger: PLOS has 10-20 active free users)
- International shipping
- GST registration + CA hire (trigger: ~₹15-18L/yr revenue)
- Pvt Ltd / LLP incorporation (trigger: investor talks or liability exposure)
- Marketplace channels: Amazon/Flipkart/Etsy/Meesho (requires GSTIN)
- Influencer collabs / paid ads
- Custom packaging beyond Qikink defaults
- Brand trademark filing

**For full strategic context see memory files:**
- `project_pod_partnership.md` — Qikink details, unit economics, integration model
- `project_build_plan_qikink_storefront.md` — sequenced concrete task list
- `project_launch_legal_posture.md` — GST inflection at ₹10L/yr
- `project_deployment_state.md` — what's live, how to deploy, secrets location

---

## Stale items to clean up (deferred or superseded)

These were in the prior pick-list but are now obsolete:
- ~~**Vercel deploy + DNS**~~ → never doing this; we use Hostinger VPS instead
- ~~**Razorpay KYC start**~~ → done 2026-05-27, live keys deployed
- ~~**Razorpay PLOS billing**~~ → deferred to Phase 4 (subscription model)
- ~~**Upstash Redis**~~ → defer; current in-memory rate limit fine until traffic justifies

Everything else from the older pick-list is itemized below.

---

## How to use this file

- Items are grouped by **app**, then by **priority** (P0 → P3).
- Each item has a suggested **owner** — `claude` (Claude Code, this repo's CLI), `cursor` (Cursor IDE chat), `human` (Ishank or Nikita), or `either` (any AI with a PR).
- When you start an item, mark `[in progress · YYYY-MM-DD · owner]`. When done, replace the bullet with a strike-through and add `→ shipped in <commit-sha-or-PR>`.
- New work always lands here first before anyone codes.

**Priority key:**
- **P0** — blocks launch, can't ship without it
- **P1** — major visible gap, ship would feel half-finished
- **P2** — polish; users would survive but it bugs power users
- **P3** — nice-to-have, no urgency

---

## NIS marketing site — `apps/web/`

### P0 — launch blockers

- ~~**Mobile navigation (hamburger)**~~ → shipped 2026-05-25 in `df9a32e` (slide-in drawer + scroll lock + Esc/click-outside close).
- ~~**Cart + multi-item checkout flow**~~ → shipped 2026-05-25 in `ed5f612` (Zustand store w/ localStorage, header CartButton, slide-in CartDrawer, multi-item `/api/razorpay/cart-order` + `/api/razorpay/cart-verify`, per-tracker Add-to-cart + collapsible Buy-now panel, queued trackers show "Coming soon" + Notify-me deep-link to `/plos#waitlist`). **Still pending:** dedicated bundle page (now in the Next-session list).
- [ ] **3 more trackers content + files** — SIP / Wedding Budget / Job Application Tracker. Currently listed in catalog but empty. Need the actual `.xlsx` files + detail page copy + feature lists. **Owner:** `human` (content) + `claude` (wiring)
- ~~**PLOS waitlist form** on `/plos` pillar page~~ → shipped 2026-05-25 in `4894fa9` (form on `/plos#waitlist`, `POST /api/waitlist` validates email + sanitises source + upserts into `marketing.waitlist` when Supabase is configured, server-logs the signal otherwise so we don't lose early signups; `schema.sql` updated).
- ~~**Sign-in button wiring**~~ → shipped 2026-05-25 in `df9a32e` (points at `NEXT_PUBLIC_PLOS_URL/login`, defaults to `http://localhost:5173/login`).
- [ ] **Razorpay KYC** — 5–7 day approval window, start ASAP. **Owner:** `human`
- [ ] **Resend domain verification** for `thenispace.com` — transactional email for purchases. **Owner:** `human`
- [ ] **Supabase project setup** — create project, run `apps/web/supabase/schema.sql`, create `products` storage bucket, upload `.xlsx` files to `products/trackers/<slug>.xlsx`. **Owner:** `human`
- [ ] **Vercel deploy + DNS** — import repo with root `apps/web`, point `thenispace.com` at Vercel. **Owner:** `human`

### Infra fixes (2026-06-02)
- ✅ **Resend wired into PLOS backend** (`f67f8dc`) — password-reset + email-verification emails now actually send (were silently no-op in prod). Resend domain `thenispace.com` is now verified.
- ✅ **Nightly PLOS DB backups** — `/docker/backups/plos-backup.sh` via cron (04:00 IST), keeps 14 days, logs to `backup.log`. See deployment-state memory.
- [ ] **Off-box backup copy** — current dumps sit on the same VPS disk (protects logical loss, not full-disk disaster). Add a Hostinger VPS snapshot schedule OR push dumps to object storage. **Owner:** `claude` (P2)

### CI health — `main` is red independent of any feature work (found 2026-06-03)
Discovered while running the billing-readiness branch. None of these are caused by feature PRs.

**Update 2026-06-03 — ALL 3 CI jobs fixed → GREEN** (on `feat/plos-billing-readiness`, commits `ebad1e3` + `b63b136` + `4ef0b1e`; each verified locally against the *exact* CI commands — backend incl. a `postgres:16` container; frontend incl. an isolated `npm ci` with repo-root `node_modules` removed to mimic CI):
- ✅ ~~**`prisma migrate diff` CI step broken**~~ → fixed. `--to-schema-datamodel` (removed in Prisma 7.2) → the drift check now `prisma migrate deploy` (against a new `postgres:16` service) then `migrate diff --from-config-datasource --to-schema` — which also proves migrations apply from scratch. Added a `prisma generate` step too (no postinstall generate → the type-aware lint + typecheck were missing `@prisma/client` types).
- ✅ ~~**`apps-web` job broken**~~ → fixed. It ran `npm ci` in `apps/web`, which has no lockfile (it's an npm workspace; only the root lockfile exists). Now installs at the root + builds via `--workspace=@nis/web`.
- ✅ ~~**`plos-backend` lint debt**~~ → fixed. `eslint --fix` (prettier) + small rule fixes; `npm run lint` is green.
- ✅ ~~**`plos-frontend` job (3 layered failures)**~~ → fixed in `4ef0b1e`:
  1. `npm ci` 404'd on `"@nis/ui": "*"` (local workspace pkg; plos-frontend isn't in the root workspace) → changed to `"@nis/ui": "file:../packages/ui"`; added `tsconfig.app.json preserveSymlinks: true` so @nis/ui's TS-source react resolves against this app's own copy in the isolated job.
  2. undeclared `@react-three/fiber`+`@react-three/drei` (used in `src/components/three/*`) → declared fiber `^9` / drei `^10` (react-19 line).
  3. `tsc -b` `never` errors: `PageHeader`/`Sidebar` typed `icon` as `React.ElementType` and rendered `<Icon size stroke style/>` (ElementType includes intrinsic strings → those props intersect to `never`) → typed `icon` as Tabler's `Icon` (`FunctionComponent<IconProps>`).
  Plus demoted the react-hooks v7 "React Compiler" lint rules (+ react-refresh, no-explicit-any/no-unused-vars) to warnings (kept `rules-of-hooks` a hard error). **Burn-down (optional, P3):** the demoted rules still warn — clean them up incrementally in the charts/three.js code.

### PLOS sell-readiness (assessed 2026-06-02 — see `docs/plos-pricing-tiers.md`)
Core app works end-to-end in prod (live-tested: register/login/me/delete ✅). Pricing specced. Verdict: **ready to launch FREE after the quick wins below; NOT ready to charge until the retention engine + billing + real legal copy land** (and per plan, shouldn't charge pre-retention).

> **[shipped · 2026-06-03 · claude · PR #1]** — Ishank directed a "build it all now, ship dormant, flip at 100 users" push on branch `feat/plos-billing-readiness`. **Done:** Steps J + K + M built and shipped *dormant* (everything reads `BILLING_ENABLED`, default off → no gating, no checkout); first-run onboarding shipped; Analytics + Sentry were found already scaffolded. Remaining sell-readiness work is now mostly human/legal + the activation runbook in the pricing doc.

- [ ] **Analytics (Plausible on NIS)** — note: PLOS frontend *already* has env-gated **PostHog** analytics (`lib/analytics.ts`, fires `app_opened`/`today_view_loaded`) + **Sentry** (`lib/sentry.ts`) — both just need keys (`VITE_POSTHOG_KEY` / `VITE_SENTRY_DSN`). This item is now only the Plausible-on-NIS-marketing piece. **Owner:** `claude/human` (P1 for launch)
- ✅ ~~**Error monitoring (Sentry free tier)**~~ → scaffold already present (`plos-frontend/src/lib/sentry.ts`, env-gated `VITE_SENTRY_DSN`, wired in `main.tsx`). Just set the DSN. **Owner:** `human` (set key)
- ~~**First-run onboarding nudge**~~ → shipped 2026-06-03 in `a9e0b62` (dismissible welcome card on Today for users with zero responsibilities; 3 first actions — add responsibility / add person / import tracker; remembered per-user in localStorage, auto-hides once a responsibility exists).
- [ ] **Real legal copy** — privacy/terms/refund are DPDP-shaped placeholders; needed before taking money (Razorpay compliance + Consumer Protection E-Comm Rules 2020). Need a subscription cancellation/refund policy w/ timelines. **Owner:** `human/lawyer` (claude can draft) (P1 for paid)
- [ ] **support@thenispace.com** forwarding — a real support channel. **Owner:** `human` (P2)
- ~~**Step K — CSV import from trackers → PLOS**~~ → shipped 2026-06-03 in `3215014` (`POST /import/responsibilities` multipart CSV → validated, transactional bulk-create, `{created,skipped,errors[]}`; dependency-free parser + 16 unit tests; plan-gated on import-count (free=1, new `User.importsUsed` + migration) AND responsibility-count (free=50), both dormant; `GET …/template`; Settings → Plan import modal with result summary).
- ~~**Step J — WhatsApp dispatch**~~ → shipped (dormant) in `f547f61` (provider-agnostic dispatcher, plan-gated via Option B: free = critical-deadline only, Pro/Family = all; log-only until a provider key is added, like MailerService).
- [ ] **Step M — Razorpay billing** — readiness shipped dormant: backend `PlanService` + limit guards + `/billing/me`+`/subscribe` (`c21f330`, `8e761ff`), frontend pricing page + plan badge + limit modal (`5116664`). **Still pending for activation** (post-retention): create the 3 Razorpay **Subscriptions** plans, add the SDK subscriptions helper + HMAC webhook, then flip `BILLING_ENABLED=true` + run `grandfatherExistingUsers` per the runbook in `docs/plos-pricing-tiers.md`. **Owner:** `cursor/either` (P2 until retention)

### P1 — visible gaps

- ~~**Download-delivery hardening**~~ → shipped 2026-06-05 in PR #2 on `feat/web-download-landing` (buyer receipt emails linked straight at `GET /api/download?token=`, which counts a use + 302s to the file; email link-scanners prefetch links → a buyer could lose downloads off the 5-use cap before clicking). New read-only `/download?token=` landing page (validates token, shows title + remaining + expiry, plain `<a>` to the API so Next never prefetches); both emailed links repointed at it via a shared `downloadLink()` helper; `/api/download` got a HEAD no-op + optimistic compare-and-set on `used_count`. Typecheck + `next build` clean. **Not yet deployed** (no real sale gated on it — the `.xlsx` is still the P0 blocker).
- **Fulfillment idempotency (double-fulfil race)** `[in progress · 2026-06-05 · claude]` — `verify`/`cart-verify` use the non-idempotent path so a retried/double-clicked verify double-fulfils, and the verify+webhook safety-net can both create order_items/tokens + send 2 receipt emails. Also a latent bug: webhook (`fulfillDigitalOrderIdempotent`) always calls `persistAndEmail`, so a **bundle** fulfilled via webhook is mis-delivered as a single product. Fix: one `(order, product)` existence guard inside fulfillment (no DB migration → zero live-path risk) + route bundles correctly in the webhook path. **Owner:** `claude`
- ~~**E-book product type**~~ → shipped 2026-06-02 in `ea14d17` (`feat/web-ebook-product-type` branch). New digital SKU that reuses the entire tracker commerce pipeline (Razorpay order/verify/cart + Supabase Storage + download token + Resend email) with zero API-route changes — ebooks resolve through the shared catalog. Adds `/ebooks` + `/ebooks/[slug]`, `ebook` kind + `epub` fileType, "E-books" nav link, sitemap entries, and a commented Supabase seed recipe. Ships with one **placeholder** "coming soon" ebook (`ai-freelancer-india`) so the page renders. **To go live:** Ishank confirms topic/copy → flip `active:true` in `lib/ebook-catalog.ts` → upload PDF to `products/ebooks/<slug>.pdf` → uncomment+run the seed in `schema.sql`.
- [ ] **Spline 3D embed** for the home hero — currently a CSS conic-gradient placeholder (`HeroOrb` in `components/nis/HeroOrb.tsx`). **Owner:** `human` (Nikita produces) + `claude` (wires)
- [ ] **Canvas page imagery** — six scene tiles are CSS gradient placeholders. **Owner:** `human` (Nikita)
- [ ] **Shop merch imagery + real SKUs** in `lib/nis-data.ts`. **Owner:** `human` (Nikita)
- [ ] **About page team portraits** — Ishank + Nikita photos. **Owner:** `human`
- [ ] **Real testimonials** in `nis-data.ts` — currently placeholder quotes. **Owner:** `human`
- ~~**Privacy / Terms / Refund policy pages**~~ → shipped 2026-05-25 in `9776511` (`LegalPage` template + 3 routes with TOC, sections, placeholder banner; footer links wired; copy structured DPDP-shaped for the lawyer to red-line). **Still pending:** the human / lawyer replacing placeholder copy with binding text.
- ~~**404 page**~~ → shipped 2026-05-25 in `96145d2` (`app/not-found.tsx` with NIS shell, big serif headline, 5 suggestion rows + contact email).

### P2 — polish

- ~~**SEO**~~ → shipped 2026-05-25 in `f623388` (`app/sitemap.ts` + `app/robots.ts` Next.js convention files; `ProductJsonLd` JSON-LD mounted on /trackers/[slug] and /trackers/bundle with INR currency + availability).
- ~~**Analytics** — Plausible or GA on every page.~~ → shipped 2026-05-25 in `f623388` (env-gated Plausible `<Script>` in root layout — only renders when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set; custom CDN supported).
- ~~**Newsletter signup** in footer~~ → shipped 2026-05-25 in `cbeea40` (`NewsletterRow` in `SiteFooter`; reuses `/api/waitlist` with `source=newsletter` so all email captures live in one table; inline loading + success + error states).
- ~~**Analytics** — Plausible or GA on every page~~ → shipped in `f623388` (env-gated Plausible in root layout; duplicate of the struck item above).
- ~~**OG images** per page~~ → shipped in `5cf160c` (dynamic Open Graph images; Nikita can supply art later).

---

## PLOS app — `plos-frontend/` + `plos-backend/`

### P0 — launch blockers

- ~~**Per-day habit completion history endpoint**~~ → shipped 2026-05-25 in `48e4d0a` (BE service + controller + migration-friendly query; FE `useQueries` fan-out on `HabitsPage`; deterministic synth removed in favour of real per-day data). Claude handled both halves with explicit authority.
- ~~**Notification preferences API**~~ → shipped 2026-05-25 in `e2b28cb` (Prisma model + lazy-create getOrCreate + PATCH partial update; Settings tab swaps the display-only chips for live `role="switch"` toggles with optimistic update + rollback). Claude handled both halves with explicit authority.
- ~~**Data export endpoints**~~ → shipped 2026-05-25 in `f80f2e5` (`ExportService` builds full nested JSON or row-oriented CSV in one Prisma query; `GET /users/export?format=json|csv` JwtAuthGuard'd with `Content-Disposition: attachment`; Settings buttons live with toast feedback).
- [ ] **Razorpay billing wiring** — dormant readiness shipped (`PlanService` + guards + `/billing/me`+`/subscribe`; frontend pricing/limit modal — `c21f330`/`8e761ff`/`5116664`). Remaining = the actual Razorpay **Subscriptions** plans + SDK helper + HMAC webhook, activated via the runbook in `docs/plos-pricing-tiers.md`. Post-retention. **Owner:** `cursor/either`

### P1 — visible gaps

- ~~**Person detail page**~~ → shipped 2026-05-25 in `ffefa9d` (route + UI; existing `GET /persons/:id` endpoint covered the data).
- ~~**Responsibility detail page**~~ → shipped 2026-05-25 in `ed55d42` (`/responsibilities/:id` with category-tinted hero, at-a-glance card incl. `<Badge tone>`, notes, immutable timeline, Mark complete / Edit / Delete; row titles on `/responsibilities` link through).
- ~~**Search bar in topbar**~~ → both halves shipped: frontend `27f7dd1` + backend `da6d837` (`GET /search?q=`).
- ~~**`⌘K` command palette**~~ → shipped 2026-05-25 in `d7a5da5` (empty input shows "Jump to" + "Create" actions, typed input fuzzy-matches + runs the search popover; "New responsibility" routes to `/responsibilities?new=1` which auto-opens the create modal).
- [ ] **WhatsApp reminder pipeline** — dispatcher shipped dormant (`f547f61`, provider-agnostic + plan-gated, Option B). Remaining = wire a real provider key (Twilio / Meta) + the opt-in flow surfacing, then it lights up. **Owner:** `cursor/either`
- ~~**Streaks-at-risk reminder cron**~~ → shipped 2026-05-25 in `a79457c` (`SchedulerService.notifyStreaksAtRisk` runs hourly in prod, every 30 min in dev; gates on `streakAtRisk` user pref + post-noon check; idempotent per habit/day; uses existing `NotificationService.createInApp`).

### P2 — polish

- ~~**Loading skeletons**~~ → shipped 2026-05-25 in `5d36972` (`SkeletonBlock` / `SkeletonText` / `SkeletonCard` / `SkeletonGrid` / `SkeletonRowList` primitives with a single shimmer keyframe; applied across Today, Insights, People, Responsibilities, Habits, Person detail, Responsibility detail).
- ~~**Error retry buttons**~~ → shipped 2026-05-25 in `5d36972` (`PlosErrorRetry` primitive with title + optional message + "Try again" CTA bound to React Query refetch; applied alongside skeletons on every page that had a "Failed to load…" state).
- ~~**Empty-state illustrations**~~ → shipped in `05f07d2` (Nikita can refine the SVGs later).
- ~~**Form validation copy** on `/register`~~ → shipped in `27bc77f` (password length + email format).
- ~~**Avatar upload preview** before save~~ → shipped in `4904a20`.
- ~~**Dark mode toggle**~~ → shipped 2026-05-25 in `0d6e853` (`uiSlice` Redux store with localStorage persistence + `prefers-color-scheme` first-visit fallback; `ThemedMantine` wrapper flips MantineProvider; `AppLayout` mirrors `data-theme` to `<html>` + `.plos`; Settings → Profile gets a Light/Dark segmented control).
- ~~**PWA manifest + install prompt**~~ → shipped in `af97d3b`.

### P3 — backend hygiene

- [ ] **Backend unit tests** — only `account-type.spec.ts` exists. Auth flow, scheduler, responsibility CRUD are uncovered. **Owner:** `cursor`
- [ ] **Backend integration tests** — Supabase test database, run on PR. **Owner:** `cursor`
- [ ] **API documentation** — Swagger/OpenAPI is referenced but not generated. **Owner:** `cursor`

---

## Cross-cutting / shared

### P1

- ~~**`packages/ui` primitives still empty**~~ → shipped 2026-05-25 in `d661705`: `<Button>` (4 variants × 3 sizes, loading, icons), `<Card>` (solid/glass/outline, padding scale, interactive, polymorphic), `<Badge>` (6 tones × 2 sizes, optional dot). CSS uses brand-token vars so a single component renders correctly in NIS dark + PLOS glass. Both apps wired (apps/web via globals.css, plos-frontend via main.tsx). First adoption in `PersonDetailPage`. README updated with usage docs.

### P2

- ~~**GitHub Actions CI for `apps/web`**~~ → shipped 2026-05-23 — added `apps-web` job (tsc + `next build`) to `.github/workflows/ci.yml`
- [ ] **Branch protection on `main`** — require CI green + 1 review before merge. **Owner:** `human` (GitHub settings)
- [ ] **Dependabot / Renovate** for npm updates. **Owner:** `human` (config)

### P3

- ~~**Visual regression testing**~~ → shipped in `d70b3e2` (Playwright smoke + visual regression suite).
- ~~**Storybook or Ladle**~~ → shipped in `c4eaa9e` (Ladle story explorer + Button/Card/Badge stories).

---

## Recently completed (last 30 days)

**Session 2026-05-25g (batch 7 — five pre-launch dev gaps, 5 commits):**
- ✅ `docs(repo)` (`db905b6`) — claimed batch 7
- ✅ `chore(web/supabase)` (`939f994`) — **Tightened RLS posture.** Fixed schema ordering, added RLS on `marketing.waitlist`, explicit revokes on the four server-only tables.
- ✅ `feat(security)` (`069646e`) — **Rate limiting.** `lib/rate-limit.ts` (in-memory dev / Upstash REST prod) on the three NIS POST endpoints; `@nestjs/throttler` global guard + tight overrides on /auth/register + /auth/login.
- ✅ `feat(plos)` (`95872ac`) — **Account deletion.** `DELETE /auth/me` cascade + Settings danger-zone two-step modal. DPDP §11.
- ✅ `feat(plos)` (`b0ae441`) — **Password reset + email verification.** Shared migration adds `User.emailVerifiedAt` + two token tables. `MailerService` (Resend + dev log fallback). 4 new endpoints. New routes: /forgot-password, /reset-password, /verify-email. LoginPage gets "Forgot?" link.

**Session 2026-05-25e+f (batches 5 & 6 — 8 polish items pushed to `main` in 10 commits):**
- See START_HERE.md for the full table — OG images, /search backend, /register validation, avatar upload preview, PWA manifest, empty-state illustrations, Playwright suite, Ladle stories.

**Session 2026-05-25d (fourth batch of 5 — pushed to `main` in 6 commits):**
- ✅ `docs(repo)` (`71dfd6e`) — claimed batch 4 per §3a
- ✅ `feat(web)` (`96145d2`) — **NIS /not-found 404 page** with NIS shell, suggestion rows, contact email fallback.
- ✅ `feat(plos)` (`f80f2e5`) — **PLOS data export endpoints.** `ExportService` builds one Prisma query covering user + persons + responsibilities (with events) + notifications + prefs; JSON returns nested, CSV flattens to responsibility rows with person joins; `GET /users/export?format=json|csv` with `Content-Disposition: attachment`; Settings buttons trigger token-aware downloads. Closes PLOS P0.
- ✅ `feat(plos-backend)` (`a79457c`) — **PLOS streaks-at-risk cron.** New `SchedulerService.notifyStreaksAtRisk` runs hourly (prod) / 30 min (dev), gated on `streakAtRisk` user pref + post-noon clock; pulls completion events, computes streaks, emits one in-app reminder per habit per day. Idempotent. Closes PLOS P1.
- ✅ `feat(plos-frontend)` (`0d6e853`) — **PLOS dark mode toggle.** `uiSlice` Redux store, localStorage persistence, system-preference fallback on first visit; `ThemedMantine` wrapper flips MantineProvider's color scheme; Settings → Profile gets a segmented Light/Dark control. Closes PLOS P2.
- ✅ `feat(web)` (`cbeea40`) — **NIS newsletter footer signup.** Compact form in `SiteFooter` reusing `/api/waitlist` with `source=newsletter` (one table for every captured email). Closes NIS P2.

**Session 2026-05-25c (third batch of 5 — claude on both backend + frontend with explicit authority):**
- ✅ `docs(repo)` (`41af317`) — claimed batch 3 per §3a
- ✅ `feat(web)` (`fe3006c`) — **NIS bundle page + bundle SKU end-to-end.** `BUNDLE` Tracker with `kind: 'bundle'` + components, 25%-off price math, cart-compatible, `persistAndEmailBundle` fulfillment branch that creates download tokens for each shipped component + bundle email template. `/trackers/bundle` landing + banner on /trackers grid.
- ✅ `feat(web)` (`f623388`) — **NIS SEO + Plausible.** `sitemap.ts` + `robots.ts` Next.js conventions; `ProductJsonLd` JSON-LD on tracker pages; env-gated Plausible `<Script>` in root layout.
- ✅ `feat(plos)` (`48e4d0a`) — **PLOS habit history endpoint.** `GET /responsibility/habits/:id/history?days=42` returns per-day completion (BE service + controller); frontend uses `useQueries` to fan out; deterministic synth removed.
- ✅ `feat(plos)` (`e2b28cb`) — **PLOS notification preferences.** New `NotificationPreferences` Prisma model + migration + service (lazy-create) + `GET/PATCH /users/notification-preferences`; Settings tab swaps display-only chips for live optimistic toggles.
- ✅ `feat(plos-frontend)` (`5d36972`) — **Loading skeletons + retry buttons.** `PlosSkeleton` (5 primitives) + `PlosErrorRetry` applied across Today / Insights / People / Responsibilities / Habits / Person detail / Responsibility detail. Single shimmer keyframe respects `prefers-reduced-motion`.

**Session 2026-05-25b (second batch of 5 — pushed to `main` in 6 commits):**
- ✅ `docs(repo)` (`29c9424`) — claimed the second-batch top 5 in BACKLOG per §3a
- ✅ `feat(web)` (`ed5f612`) — **NIS cart + multi-item checkout.** Zustand store with localStorage persistence, header `CartButton` with count badge, slide-in `CartDrawer` with qty +/-/remove + email + Razorpay handoff, `TrackerActions` (Add to cart + collapsible Buy-now) on every tracker detail page. New API routes: `POST /api/razorpay/cart-order` and `POST /api/razorpay/cart-verify`. Extended `tracker-catalog.ts` from 1 → 4 trackers (queued ones marked `active: false` so they show "Coming soon" + a "Notify me" deep-link to the waitlist).
- ✅ `feat(web)` (`4894fa9`) — **NIS waitlist form on `/plos`.** Reusable `WaitlistForm` component (source-tagged, email validation, idle/loading/success/error). `POST /api/waitlist` upserts into `marketing.waitlist` when Supabase is configured, server-logs + returns success otherwise so we never lose early signups. Section anchored at `#waitlist` so the "Notify me" buttons can deep-link.
- ✅ `feat(plos-frontend)` (`ed55d42`) — **PLOS `/responsibilities/:id` detail page.** Module hero coloured by category, at-a-glance card with state badge (using `@nis/ui`), notes, immutable timeline pulled from `GET /responsibility/:id/timeline`. Mark complete / Edit (reuses `CreateResponsibilityModal`) / Delete with confirm. Row titles on `/responsibilities` are now real links.
- ✅ `feat(plos-frontend)` (`d7a5da5`) — **PLOS `⌘K` command palette.** Empty input → "Jump to" (every PLOS module + master list + notifications + settings) + "Create" (New responsibility…); typed input → fuzzy actions + search results from the previous-session backend wire. `?new=1` on the responsibilities page auto-opens the create modal. Responsibility hits now navigate to the new detail page.
- ✅ `feat(web)` (`9776511`) — **NIS legal pages.** `LegalPage` template (banner, eyebrow, headline, last-updated, table-of-contents, numbered sections, contact footer) + three routes (`/privacy`, `/terms`, `/refund`). Footer's dead `<a>Refund policy</a>` now a real link, with Privacy + Terms next to it. Placeholder copy structured DPDP / Indian-law shaped so the lawyer can red-line instead of writing from scratch.

**Session 2026-05-25 (first batch of 5 — pushed to `main` in 7 commits):**
- ✅ `docs(repo)` (`189c02c`) — claimed all 5 items in BACKLOG per §3a lock protocol
- ✅ `feat(web)` (`df9a32e`) — mobile hamburger drawer (≤720px) + Sign-in button now points at `NEXT_PUBLIC_PLOS_URL/login`. Drawer closes on route change, link click, backdrop, or Escape; body scroll locked while open. **Closes NIS P0 #1 + #2.**
- ✅ `feat(packages/ui)` (`d661705`) — first three shared primitives shipped: `<Button>`, `<Card>`, `<Badge>`. CSS consumes `--nis-*` / `--plos-*` tokens so a single component renders correctly in NIS dark + PLOS glass. Both apps wired; README + usage docs updated. **Closes cross-cutting P1.**
- ✅ `feat(plos-frontend)` (`ffefa9d`) — `/people/:id` detail page with avatar + contact + KPI grid + open/recurring/overdue tabs + recently-completed list. People cards on `/people` are now keyboard-accessible buttons that navigate. First @nis/ui adoption inside PLOS. **Closes PLOS P1 — Person detail page.**
- ✅ `feat(plos-frontend)` (`27f7dd1`) — topbar search becomes a real autocomplete popover (160ms debounce, ⌘K focus, ↑/↓/Enter keyboard nav, grouped Responsibilities · People sections, route inference by category). Tries `GET /search?q=` first; falls back to client-side filtering so the UI works without the backend endpoint. **Closes PLOS P1 frontend half — backend endpoint still Cursor's.**

**Session 2026-05-23 (pushed to `main` in 6 commits):**
- ✅ `feat(plos-backend)` — household members, account types, person avatars + migrations
- ✅ `feat(packages)` — razorpay-sdk split into client/server + brand-tokens extended with Instrument Serif + PLOS glass palette
- ✅ `feat(web)` — NIS marketing site, all 7 routes, cinematic 5-stage scroll hero, mobile responsive overlay (`nis-mobile.css`), Reveal fallback timer
- ✅ `feat(plos-frontend)` — full visual redesign to prototype: glass shell, `PlosModuleHero` + 6 SVG scenes, `PlosTilt` + `PlosReveal` + `usePlosMouseMesh`, `TodayPulse` + `LifeRingsBar` + `PlosMarquee`, `PlosStreakChain` (round dots, gradient ribbon, pulsing today), all 12 routes redesigned, mobile hamburger menu, error UX unified, page width capped at 1320px, hover-tilt tamed
- ✅ `docs(repo)` — `BACKLOG.md` + shared ownership protocol in `CLAUDE.md` / `.cursorrules` + `apps-web` CI job
- ✅ `fix(plos-frontend)` — `mediaUrl` util that was referenced but untracked

Earlier (pre-2026-05-23):
- ✅ Sprint 0 hardening + Today home + Insights dashboard (commit `6ca7afd`)
- ✅ Auth, dashboard, notifications, full app shell (commit `601d3da`)
- ✅ Monorepo scaffolding + docs + START_HERE guide (commit `4a8f0c3`)
- ✅ PLOS app — all 12 pages redesigned to the prototype, glass shell, module hero scenes, streak chain, TodayPulse, LifeRingsBar, Marquee, mobile responsive, hamburger menu (2026-05-22 → 2026-05-23)
- ✅ Brand tokens extended with Instrument Serif + Geist + PLOS light glass palette (2026-05-22)
- ✅ Mobile responsive pass across phone → ultrawide for both apps (2026-05-23)
- ✅ Error UX unified — page header always visible during loading/error states (2026-05-23)
- ✅ Insights dashboard enriched — completion radial, upcoming bills list, this-week snapshot, recent activity feed (2026-05-23)

# BACKLOG — Pending work register

**Single source of truth for what's not done yet.** Both Claude Code and Cursor read this file at the start of any session that involves picking up new work. Update it as items move.

**Last updated:** 2026-05-25

---

## ▶ Next session — pick from this short list

Two batches of 5 already shipped on 2026-05-25 (see "Recently completed"). The next-leverage chunk:

1. **NIS bundle page** (P1 · `claude`) — `/trackers/bundle` showing all 4 trackers with a "buy all" discount. Cart already supports multi-item; just needs a curated landing page + a bundle-price calculation. ~45 min.
2. **PLOS per-day habit history endpoint** (P0 · `cursor` + claude wire) — backend `GET /responsibility/habits/:id/history?days=42`; once landed, replace the streak-chain's deterministic synth with real data. Frontend wire: ~20 min after endpoint exists.
3. **PLOS notification preferences API** (P0 · `cursor`) — `GET/PATCH /users/notification-preferences`. Settings → Notifications tab is currently display-only.
4. **NIS analytics + SEO** (P2 · `claude`) — `sitemap.xml`, `robots.txt`, schema.org Product markup on `/trackers/:slug`, Plausible script tag. ~1 hr.
5. **PLOS loading skeletons + retry buttons** (P2 · `claude`) — replace the `<Loader dots>` placeholders with skeleton cards on Today / Insights / People / Responsibilities / Habits; "Failed to load…" copy gains a Retry CTA. ~1–1.5 hrs.

After those, the next tier:
- 3 more trackers content + files (human)
- Razorpay KYC (human · 5–7 day wait — **start ASAP**)
- Resend domain verification for `thenispace.com`
- Supabase project setup + schema execution + storage bucket
- Vercel deploy + DNS

After those, the next tier:
- Real product imagery (Nikita) — Spline hero, Canvas tiles, Shop merch, About portraits
- 3 more trackers content (human)
- Razorpay KYC (human, 5–7 day wait — start ASAP)

Everything else is itemized below.

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

### P1 — visible gaps

- [ ] **Spline 3D embed** for the home hero — currently a CSS conic-gradient placeholder (`HeroOrb` in `components/nis/HeroOrb.tsx`). **Owner:** `human` (Nikita produces) + `claude` (wires)
- [ ] **Canvas page imagery** — six scene tiles are CSS gradient placeholders. **Owner:** `human` (Nikita)
- [ ] **Shop merch imagery + real SKUs** in `lib/nis-data.ts`. **Owner:** `human` (Nikita)
- [ ] **About page team portraits** — Ishank + Nikita photos. **Owner:** `human`
- [ ] **Real testimonials** in `nis-data.ts` — currently placeholder quotes. **Owner:** `human`
- ~~**Privacy / Terms / Refund policy pages**~~ → shipped 2026-05-25 in `9776511` (`LegalPage` template + 3 routes with TOC, sections, placeholder banner; footer links wired; copy structured DPDP-shaped for the lawyer to red-line). **Still pending:** the human / lawyer replacing placeholder copy with binding text.
- [ ] **404 page** — Next.js currently shows its default. **Owner:** `claude`

### P2 — polish

- [ ] **SEO** — `sitemap.xml`, `robots.txt`, schema.org product markup on tracker detail pages. **Owner:** `claude`
- [ ] **Newsletter signup** in footer — single-email POST to a list. **Owner:** `claude`
- [ ] **Analytics** — Plausible or GA on every page. **Owner:** `claude`
- [ ] **OG images** per page — currently no `og:image` for social sharing. **Owner:** `claude` + `human` (designs)

---

## PLOS app — `plos-frontend/` + `plos-backend/`

### P0 — launch blockers

- [ ] **Per-day habit completion history endpoint** — `GET /responsibility/habits/:id/history?days=42` returning per-day completion array. Frontend currently synthesizes the 42-day pattern from streak count (deterministic-by-id, fake). **Owner:** `cursor` (backend) + `claude` (wire frontend after)
- [ ] **Notification preferences API** — `GET/PATCH /users/notification-preferences` with `inApp`, `emailDigests`, `whatsappOptIn`, `streakAtRisk` toggles. Settings → Notifications tab is display-only. **Owner:** `cursor`
- [ ] **Data export endpoints** — `GET /users/export?format=json|csv` returning all responsibilities/people/timeline. Settings → Plan buttons are stubs. **Owner:** `cursor`
- [ ] **Razorpay billing wiring** — `subscription.tier/status` exists in `MeResponse` but there's no payment flow. Need plan upgrade endpoint + Razorpay subscription create + webhook. **Owner:** `cursor`

### P1 — visible gaps

- ~~**Person detail page**~~ → shipped 2026-05-25 in `ffefa9d` (route + UI; existing `GET /persons/:id` endpoint covered the data).
- ~~**Responsibility detail page**~~ → shipped 2026-05-25 in `ed55d42` (`/responsibilities/:id` with category-tinted hero, at-a-glance card incl. `<Badge tone>`, notes, immutable timeline, Mark complete / Edit / Delete; row titles on `/responsibilities` link through).
- [ ] **Search bar in topbar** — frontend shipped 2026-05-25 in `27f7dd1` (autocomplete popover, ⌘K shortcut, keyboard nav, client-side fallback). **Still pending:** backend `GET /search?q=…` endpoint — once Cursor ships it, the frontend will start using it automatically (no FE changes needed). **Owner:** `cursor`.
- ~~**`⌘K` command palette**~~ → shipped 2026-05-25 in `d7a5da5` (empty input shows "Jump to" + "Create" actions, typed input fuzzy-matches + runs the search popover; "New responsibility" routes to `/responsibilities?new=1` which auto-opens the create modal).
- [ ] **WhatsApp reminder pipeline** — Settings marks it "Coming soon"; need Twilio / Meta integration + opt-in flow. **Owner:** `cursor`
- [ ] **Streaks-at-risk reminder cron** — scheduler should pick streaks ≤1 day from breaking and fire notifications. **Owner:** `cursor`

### P2 — polish

- [ ] **Loading skeletons** — current `<Loader>` dots; better with skeleton cards that match final layout. **Owner:** `claude`
- [ ] **Error retry buttons** — "Failed to load …" text has no retry CTA. **Owner:** `claude`
- [ ] **Empty-state illustrations** — current empty states are text-only; even small SVG illustrations would warm them up. **Owner:** `claude` + `human` (Nikita illustrations)
- [ ] **Form validation copy** on `/register` — password length, email format. Currently HTML-default validation. **Owner:** `claude`
- [ ] **Avatar upload preview** before save — show the file thumbnail in the modal. **Owner:** `claude`
- [ ] **Dark mode toggle** — prototype has `data-theme="dark"` support; `AppLayout` hardcodes `light`. **Owner:** `claude`
- [ ] **PWA manifest + install prompt** — make PLOS installable on phones. **Owner:** `claude`

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

- [ ] **Visual regression testing** — Playwright + Percy or similar; both AIs touch UI, regressions would be invisible without it. **Owner:** `either`
- [ ] **Storybook or Ladle** for shared components in `packages/ui`. **Owner:** `either`

---

## Recently completed (last 30 days)

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

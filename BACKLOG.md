# BACKLOG — Pending work register

**Single source of truth for what's not done yet.** Both Claude Code and Cursor read this file at the start of any session that involves picking up new work. Update it as items move.

**Last updated:** 2026-05-25

---

## ▶ Next session — pick from this short list

These are the highest-leverage things to do next. Each is sized to fit in one focused session.

1. ~~**NIS mobile hamburger**~~ [in progress · 2026-05-25 · claude] — phones can't navigate beyond home + /plos. Add a hamburger that opens a drawer with the 6 nav links. ~30 min.
2. ~~**NIS Sign-in button wiring**~~ [in progress · 2026-05-25 · claude] — header button currently does nothing. Point it at `http://localhost:5173/login` (env-driven) or a modal that explains PLOS auth. ~15 min.
3. ~~**`packages/ui` primitives**~~ [in progress · 2026-05-25 · claude] — lift `Button`, `Card`, `Badge` out of inline JSX so both apps share one component. Visible polish + reduces duplication. ~1 hr.
4. ~~**PLOS Person detail page**~~ [in progress · 2026-05-25 · claude] — `/people/:id` route showing that person's responsibilities + activity. Currently the card on `/people` goes nowhere. ~45 min.
5. ~~**PLOS Search bar wiring (frontend)**~~ [in progress · 2026-05-25 · claude] — topbar search is a placeholder. Claude wires autocomplete UI now (with safe client-side fallback if `GET /search?q=…` 404s); Cursor still owns the backend endpoint. ~1–2 hrs total.

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

- [ ] **Mobile navigation (hamburger)** [in progress · 2026-05-25 · claude] — nav links are hidden at ≤720px but there's no replacement; phone users can only reach `/plos` via the Open PLOS button or the footer. **Owner:** `claude`
- [ ] **Cart + multi-item checkout flow** — `BuyButton` does single-product Razorpay orders only; need Zustand cart store, cart drawer, multi-item checkout, bundle page. **Owner:** `claude`
- [ ] **3 more trackers content + files** — SIP / Wedding Budget / Job Application Tracker. Currently listed in catalog but empty. Need the actual `.xlsx` files + detail page copy + feature lists. **Owner:** `human` (content) + `claude` (wiring)
- [ ] **PLOS waitlist form** on `/plos` pillar page — POST to `app.thenispace.com/api/waitlist`. Backend endpoint also needed. **Owner:** `claude` (frontend) + `cursor` (backend endpoint)
- [ ] **Sign-in button wiring** [in progress · 2026-05-25 · claude] — header has a "Sign in" button (visible on desktop) that does nothing. Should link to `app.thenispace.com/login` or open a modal that bounces to PLOS auth. **Owner:** `claude`
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
- [ ] **Privacy / Terms / Refund policy pages** — footer links exist but routes 404. **Owner:** `claude` (template) + `human` (legal copy)
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

- [ ] **Person detail page** [in progress · 2026-05-25 · claude] — clicking a person card on `/people` should open `/people/:id` with their assigned responsibilities + activity. **Owner:** `claude` (route + component) + `cursor` (endpoint already exists at `personService.getById`, may need expansion)
- [ ] **Responsibility detail page** — `/responsibilities/:id` with full timeline + edit + complete. **Owner:** `claude` (route) + `cursor` (timeline endpoint already exists)
- [ ] **Search bar in topbar** [frontend in progress · 2026-05-25 · claude] — placeholder doesn't actually search anything. Needs an autocomplete endpoint `GET /search?q=…` returning responsibilities/people/notes. **Owner:** `cursor` (endpoint) + `claude` (frontend autocomplete)
- [ ] **`⌘K` command palette** — currently just a visual hint. Wire it to a search modal. **Owner:** `claude`
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

- [ ] **`packages/ui` primitives still empty** [in progress · 2026-05-25 · claude] — both apps currently inline buttons and cards. Lift `Button`, `Card`, `Badge` (and maybe `Tag`) into `@nis/ui` so PLOS + NIS share a single visual language. **Owner:** `either` — needs PR + Ishank review per `CLAUDE.md`

### P2

- ~~**GitHub Actions CI for `apps/web`**~~ → shipped 2026-05-23 — added `apps-web` job (tsc + `next build`) to `.github/workflows/ci.yml`
- [ ] **Branch protection on `main`** — require CI green + 1 review before merge. **Owner:** `human` (GitHub settings)
- [ ] **Dependabot / Renovate** for npm updates. **Owner:** `human` (config)

### P3

- [ ] **Visual regression testing** — Playwright + Percy or similar; both AIs touch UI, regressions would be invisible without it. **Owner:** `either`
- [ ] **Storybook or Ladle** for shared components in `packages/ui`. **Owner:** `either`

---

## Recently completed (last 30 days)

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

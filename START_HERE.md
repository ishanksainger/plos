# Start here

**Updated 2026-05-25 (end of second top-5 batch — 10 of BACKLOG's top items now shipped today).** Two rounds of "Next session" items closed in 13 commits on `main`.

> **For pending work and the next session's priorities → [`BACKLOG.md`](./BACKLOG.md)** (top of file has a "Next session, pick from this short list" section)
>
> **For AI coordination rules** → [`CLAUDE.md`](./CLAUDE.md) (Claude Code) or [`.cursorrules`](./.cursorrules) (Cursor) — both AIs share `plos-frontend/` now; `BACKLOG.md` is the lock queue

## Session log — what shipped 2026-05-25 (second batch)

| Commit | What |
|---|---|
| `29c9424` | `docs(repo)` — claimed the second-batch next-session items per §3a |
| `ed5f612` | `feat(web)` — **NIS cart + multi-item Razorpay checkout.** Zustand store with localStorage persistence, header `CartButton` (count badge), slide-in `CartDrawer` (qty +/-, remove, email, checkout), `TrackerActions` (Add to cart + collapsible Buy-now) on every tracker detail page. New `/api/razorpay/cart-order` + `/api/razorpay/cart-verify`. `tracker-catalog.ts` extended from 1 → 4 trackers (queued ones marked `active: false`). Closes NIS P0. |
| `4894fa9` | `feat(web)` — **NIS waitlist form on `/plos#waitlist`** + `/api/waitlist` (Supabase upsert when configured; server-log + 200 otherwise). `marketing.waitlist` table added to schema. Closes NIS P0. |
| `ed55d42` | `feat(plos-frontend)` — **PLOS `/responsibilities/:id` detail page.** Category-tinted hero, at-a-glance card with state badge, notes, immutable timeline, mark-complete/edit/delete. Row titles on `/responsibilities` link through. Closes PLOS P1. |
| `d7a5da5` | `feat(plos-frontend)` — **PLOS `⌘K` command palette.** Empty input → "Jump to" + "Create" actions; typed input → fuzzy actions + search results. `?new=1` auto-opens the create modal. Responsibility hits now go to the new detail page. Closes PLOS P1. |
| `9776511` | `feat(web)` — **NIS legal pages.** `LegalPage` template + `/privacy`, `/terms`, `/refund` (TOC, numbered sections, last-updated). Footer's dead `<a>Refund policy</a>` is now a real link, with Privacy + Terms next to it. Closes NIS P1 (scaffold; legal copy still pending). |

## Session log — what shipped 2026-05-25 (first batch)

| Commit | What |
|---|---|
| `189c02c` | `docs(repo)` — claimed the five next-session items in BACKLOG per §3a lock protocol |
| `df9a32e` | `feat(web)` — mobile hamburger drawer (≤720px slide-in, scroll lock, Esc/click-outside close) + header Sign-in button now points at `NEXT_PUBLIC_PLOS_URL/login`. Closes NIS P0 #1 + #2. |
| `d661705` | `feat(packages/ui)` — `<Button>` / `<Card>` / `<Badge>` primitives live; CSS uses brand-token vars so one component renders in NIS dark + PLOS glass. Both apps wired; README updated. Closes cross-cutting P1. |
| `ffefa9d` | `feat(plos-frontend)` — `/people/:id` Person detail page (avatar, contact, KPI grid, open/recurring/overdue tabs, recently-completed list). `/people` cards are now keyboard-accessible buttons. First @nis/ui adoption inside PLOS. Closes PLOS P1. |
| `27f7dd1` | `feat(plos-frontend)` — topbar search is a real autocomplete (160ms debounce, ⌘K focus, ↑/↓/Enter nav, grouped sections). Tries `GET /search?q=` first; falls back to client-side filtering so it works before Cursor's backend lands. Closes PLOS P1 frontend half. |
| `bfd5132` | `fix` — closed mobile drawer gets `inert` so its hidden links aren't tab-focusable; PersonDetailPage memo deps stabilised. |

## Session log — what shipped 2026-05-23

Six commits, in this order on `main`:

| Commit | What |
|---|---|
| `3c30a1f` | `feat(plos-backend)` — household members, account types, person avatars + Prisma migrations |
| `94d8cc5` | `feat(packages)` — razorpay-sdk split into client/server + brand-tokens extended with Instrument Serif + PLOS glass palette |
| `328a776` | `feat(web)` — NIS marketing site: 7 routes, cinematic 5-stage scroll hero, 5 SVG scenes, mobile responsive |
| `8314cf9` | `feat(plos-frontend)` — full visual redesign to prototype: glass shell, 6 module hero scenes, streak chain (round dots + gradient ribbon + pulsing today), TodayPulse, LifeRings, Marquee, PlosTilt 3D mouse tracking, mouse-mesh body gradient, mobile hamburger, error UX unified, large-screen width cap |
| `6fe18eb` | `docs(repo)` — `BACKLOG.md` + shared ownership protocol in CLAUDE.md / .cursorrules + `apps-web` CI job |
| `a65d51b` | `fix(plos-frontend)` — `mediaUrl` util that was referenced but untracked |

## Pending (high-level — full list in `BACKLOG.md`)

**NIS P0 still open:** 3 more trackers (content), Razorpay KYC, Resend domain, Supabase setup, Vercel deploy
**PLOS P0 still open:** per-day habit history endpoint, notification prefs API, data export endpoints, Razorpay billing, `GET /search?q=` backend endpoint
**NIS P1 still open:** bundle page, real Spline 3D embed, real shop SKUs, lawyer-reviewed legal copy, OG images, sitemap/SEO
**Cross-cutting P1 still open:** branch protection on `main`, Dependabot

---

## 1. Run everything

From the repo root:

```bash
# PLOS app + API (plos-frontend on :5173, plos-backend on :3001)
npm run dev

# NIS marketing site (apps/web on :3000) — separate terminal
npm run dev:web
```

| App | URL | What it is |
|---|---|---|
| **NIS marketing** | http://localhost:3000 | thenispace.com — hero, trackers, canvas, shop, plos, about |
| **PLOS app** | http://localhost:5173 | app.thenispace.com — the life OS |
| **PLOS API** | http://127.0.0.1:3001 | NestJS backend the PLOS app talks to |

---

## 2. What's been built so far

### NIS marketing site (`apps/web/`) — all 7 routes done

| Route | What's there |
|---|---|
| `/` | 5-stage cinematic scroll hero (Nest → Sheets → Iridescent Blob → Shop Stack → PLOS Pearl with heartbeat) + intro + stats + marquee + tracker preview cards + testimonial + PLOS feature CTA |
| `/trackers` | Catalog grid (4 trackers, only Freelancer GST has real content) |
| `/trackers/freelancer-gst` | Detail page with `What you get` + Buy button |
| `/canvas` | Six original 3D/motion scene tiles |
| `/shop` | Merch grid with category filter |
| `/plos` | PLOS pillar page with 42-day StreakChain demo |
| `/about` | Two-person studio bio |

### PLOS app (`plos-frontend/`) — all 12 routes + Person & Responsibility detail

| Route | What's there |
|---|---|
| `/login` | Lavender gradient + glass card + serif `O` brand mark |
| `/register` | Same shell, account-type picker, optional household members |
| `/` (Today) | Pearl-orbit hero + **TodayPulse heartbeat ribbon** + **4 LifeRings (Money/Body/Habits/People)** + **editorial marquee** + 3 tilted buckets + **Today's rhythm 4-habit signature card** + diary feed |
| `/insights` | Module hero + 4 KPIs with deltas + monthly outflow area chart + category donut (with per-category sparklines) + **Completion radial ring** + **Upcoming bills list** + **This week snapshot** + activity bars + people load + **recent activity feed** |
| `/habits` | Module hero (woven nest scene) + 4 KPIs + per-habit cards with the signature **42-day streak chain** (round dots, gradient ribbon, pulsing today indicator) |
| `/finance` | Module hero (coin stack scene) + KPIs + filtered open commitments list |
| `/health` | Module hero (beating heart scene) + KPIs + filtered list |
| `/people` | Module hero (avatar constellation) + glass person-card grid with next-up + open/overdue/spend (cards click through to detail) |
| `/people/:id` | Avatar + contact + KPI grid + open/overdue/recurring tabs + recently-completed list. First @nis/ui adoption (uses `<Card>` and `<Badge>`). |
| `/responsibilities/:id` | Category-tinted module hero + at-a-glance card with state badge + notes + immutable timeline + mark-complete/edit/delete. |
| `/timeline` | Module hero (twin-ribbon scene) + tl-day / tl-event grouping + All / You / System filter |
| `/notifications` | Eyebrow + greeting-row + glass list with unread dots + Mark-all-read |
| `/settings` | 4 tabs (Profile / Account / Notifications / Plan) + 220px label/input rows |
| `/responsibilities` | Master list with state filter chips + category select + edit/delete |

### Shared design system (`plos-frontend/src/components/plos/`)

- **`PlosModuleHero`** — unified module hero card (eyebrow + serif headline + scene + actions)
- **`ModuleScenes`** — six animated SVG scenes (Insights / Finance / Health / Habits / People / Timeline)
- **`Charts`** — `AreaChart`, `DonutChart`, `Bars`, `CompletionRing`, `Sparkline`
- **`ResponsibilityRow`** — list row primitive
- **`PlosCategoryModule`** — shared Finance/Health page shell
- **`PlosReveal`** — IntersectionObserver scroll-reveal with mount-time fallback
- **`PlosTilt`** — 3D mouse-tracking tilt (no blur, no dance — transition managed manually)
- **`usePlosMouseMesh`** — cursor-following body gradient mesh (wired in `AppLayout`)
- **`TodayPulse`** — heartbeat ribbon for Today header
- **`LifeRings` / `LifeRingsBar`** — 4 SVG diorama cards (money coin stack / pulsing heart / woven habits nest / avatar constellation)
- **`PlosMarquee`** — editorial italic ticker
- **`PlosStreakChain`** — the signature visualization (perfect round dots, wavy gradient ribbon, pulsing today halo)

---

## 3. Responsive behavior — full breakpoint coverage

Both apps tested at **375 / 768 / 1280 / 1920 px** in Playwright. Screenshots in `/tmp/plos-shots/matrix/`.

### Breakpoints

| Width | What changes |
|---|---|
| **≥1700px (NIS)** / **≥1701px (PLOS)** | `--max-w` capped at 1320px; content centered with margin — page doesn't stretch across ultrawide monitors |
| **1100–1700** | Desktop layout; sidebar shown; multi-col grids |
| **901–1100** | `kpi-grid` drops to 2-col; `life-rings-bar` drops to 2-col; sidebar still shown |
| **641–900** | Sidebar → mobile drawer (opens via the hamburger button added to the topbar); `grid-2/3/12` drops to 1-col; module hero stacks; chart cards stack |
| **481–640** | KPI grid drops to 1-col; settings rows stack label-above-input; topbar `+ New responsibility` shrinks to icon-only; Today's rhythm row goes name-on-top, chain full-width, streak right |
| **≤480** | Module hero scene drops below the headline at full width; NIS pillar rail goes 1-col; NIS about grid goes 1-col |
| **≤420** | Hero scene drops to a full-width slot below the headline |

### NIS-specific

- Site header: `Sign in` hides at ≤880, full nav links hide at ≤720 (logo + Open PLOS only)
- Cinematic hero scroll height shortens from `460vh` → `320vh` (≤720) → `280vh` (≤480) so phone users reach content faster
- Tracker grid 1-col at ≤720; merch grid 2-col at ≤880, 1-col at ≤540
- Footer 4-col → 1-col at ≤480
- `html, body` get `overflow-x: hidden` so any oversized child can't break the page

### PLOS-specific

- **Mobile navigation** — topbar shows a hamburger button at ≤900px that opens the sidebar in a slide-in `Drawer`. The full PLOS branding, Daily / Modules / Life sections, and user card all render inside the drawer; tapping any nav item closes it.
- Page width capped at `1320px` (max-width on `.plos-page-enter`) so dashboards don't stretch on huge monitors
- Streak chain SVG renders at natural size with `preserveAspectRatio="xMidYMid meet"` — circles stay round at any container width
- `.insights-row-3` (Completion / Upcoming bills / This week) collapses to 2-col at ≤1100, 1-col at ≤720
- Today's rhythm row (`name | chain | streak` on desktop) regrids to `name + streak` top, full-width chain underneath at ≤720
- `PlosTilt` mouse tracking disabled on narrow viewports (no hover-tilt on touch)
- Mouse-tracked body gradient mesh disabled on narrow viewports
- The four `.lr-bob`, `.lr-heartbeat`, `.lr-orbit-slow`, `.lr-pulse-ring` animations all run via the prototype's cinema.css

---

## 4. Flow to check (in this order)

### A. NIS marketing — http://localhost:3000

1. **`/`** — scroll slowly. The cinematic 5-stage hero should swap stages (Nest → Sheets → Blob → Shop → PLOS Pearl). Below: intro paragraph, stats row (3 cells), marquee, tracker cards, testimonial pull quote, PLOS feature.
2. **`/trackers`** → click any tracker → detail page with `What you get` + Buy button.
3. **`/canvas`** — six tone-gradient scene cards.
4. **`/shop`** — category filter row + merch grid.
5. **`/plos`** — pillar page. Scroll to the **42-day streak chain demo**.
6. **`/about`** — two-person studio bio.

### B. PLOS app — http://localhost:5173

Sign up or log in (backend auto-seeds demo data via `dashboard-dummy-seed.ts`).

1. **`/login`** — confirm: lavender gradient body, glass card, serif italic `O` in `PL O S`, purple `Sign in` CTA.
2. **`/register`** — pick **Family** → household section appears.
3. **`/` Today** — pearl-orbit hero on the right, "DUE BEFORE NEXT SUNDAY ₹…" pill, **heartbeat ribbon under the hero**, **4 life rings**, **marquee**, 3 tilted buckets (hover them — clean tilt, no blur), **Today's rhythm** with 42-day chains, diary.
4. **`/insights`** — dense analytics: KPI deltas, area chart, donut + sparklines, completion ring, upcoming bills list, this-week snapshot, activity bars, people load, recent activity feed.
5. **`/habits`** — per-habit cards with the 42-day chain.
6. **`/finance`** — amber accent, coin/ledger scene.
7. **`/health`** — pink heart scene.
8. **`/people`** — cyan accent, avatar constellation, person grid.
9. **`/timeline`** — twin-ribbon scene, day-grouped events, All/You/System filter.
10. **`/notifications`** — unread dots + Mark all read.
11. **`/settings`** — 4 tabs, account-type picker with confirm dialog.
12. **`/responsibilities`** — state filter chips + edit/delete.

### C. Responsive check

Open Chrome DevTools → toggle device mode. Sweep through:
- **iPhone SE (375 × 667)** — phone narrow. Header collapses, grids stack, hero scenes go below headline.
- **iPad portrait (768 × 1024)** — tablet. KPI 2-col, life rings 2-col, sidebar drawer on PLOS.
- **iPad landscape (1024 × 768)** — sidebar shown on PLOS, content tighter.
- **Desktop 1440 / 1920** — full layout, dashboard width capped on huge monitors.

---

## 5. What's NOT done — punch list

### NIS
- **Cart + multi-item checkout** — single-product Razorpay only; no Zustand cart
- **PLOS waitlist form** on `/plos` — placeholder, no POST
- **3 more trackers** — only `freelancer-gst` has real content
- **Real Spline 3D embed** for hero (currently CSS conic-gradient placeholder)
- **Canvas / Shop imagery** — placeholders
- **SEO** — meta tags exist, no sitemap, no schema.org
- **Production deploy** — Vercel, DNS, Razorpay KYC, Resend domain

### PLOS
- **Per-day habit history endpoint** — streak chain currently synthesized from streak count
- **Notification preferences API** — Settings toggles are display-only
- **Data export endpoints** — JSON/CSV buttons are stubs
- **`GET /search?q=` backend endpoint** — frontend search popover ships with a client-side fallback; backend endpoint is Cursor's to ship and will be picked up automatically
- **`CLAUDE.md` still says `plos-frontend/` is Cursor's** — was overridden for the redesign; doc is stale

---

## 6. Plans live outside the repo

| File | Purpose |
|------|---------|
| `/Volumes/DevSSD/dev/claude/plos_code_plan_v1.md` | PLOS sprints |
| `/Volumes/DevSSD/dev/claude/nis_code_plan_v1.md` | NIS weeks |
| `/Volumes/DevSSD/dev/projects/ishank/Design Files/` | The prototype both apps were ported from |

---

**More detail →** [`SETUP.md`](./SETUP.md)

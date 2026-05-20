# PLOS — Project overview (what it is, what we built, what’s next)

**Purpose:** One readable file for you, collaborators, and future AI sessions — product story, current capabilities, recent work, and recommended direction (including the wider thenispace ecosystem: sheets, e-store, PLOS app).

**Last updated:** 2026-05-19

**Related docs:** [`PLOS_CONTEXT.md`](./PLOS_CONTEXT.md) (product decisions) · [`PL_PRODUCT_AND_ROADMAP.md`](./PL_PRODUCT_AND_ROADMAP.md) (shipped checklist + roadmap letters A–H)

---

## 1. What is PLOS?

**PLOS** = **Personal Life Operating System**.

It is **not** a narrow “freelancer GST app” or a generic to-do list. It is meant to be a **daily diary of life** in software form: money, health, habits, family, admin, and work-related duties in **one place**, with clear visibility on what is **due**, **overdue**, **upcoming**, and **done**, who things are for, and a **timeline** of what changed.

| Idea | Meaning |
|------|---------|
| **Responsibility** | The core unit — something you owe life (pay bill, doctor visit, habit, family task, admin). Has category, due date, optional amount (INR), person, recurrence, notes. |
| **Person** | People in your life (self, partner, parent, child, etc.) — assign responsibilities to them. |
| **Event / Timeline** | Audit trail when states change or you complete / check in (especially recurring habits). |
| **Modules** | Same engine, filtered views: Finance, Health, Habits (+ Files list, People, Timeline). |
| **Dashboard** | Executive snapshot: counts, charts, open queue, activity — all from live API data. |

**Who it’s for:** Everyone building a calmer picture of life — with freelancer/work/GST as **one slice**, not the whole product ([`PLOS_CONTEXT.md`](./PLOS_CONTEXT.md)).

---

## 2. Where PLOS sits in the bigger project (thenispace)

PLOS is **one product** inside a **larger brand / business**, not the entire website.

```
                    ┌─────────────────────────────────────┐
                    │  Brand site (e.g. thenispace.com)   │
                    │  Story · SEO · links to Shop + App  │
                    └──────────────┬──────────────────────┘
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
   ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
   │  NIS Sheets   │      │   E-store     │      │     PLOS      │
   │ Etsy/Gumroad  │      │ T-shirts,     │      │  Web app      │
   │ templates     │      │ trackers, etc.│      │  (this repo)  │
   └───────────────┘      └───────────────┘      └───────────────┘
        Revenue now          Commerce              Long-term SaaS
        Learning             Shopify-style         Retention
```

| Product | Role today | Link to PLOS |
|---------|------------|--------------|
| **Google Sheets templates** | Ship early; revenue + learn what people pay for | **Separate** — optional **one-time import** later, not live sync ([`PLOS_CONTEXT.md`](./PLOS_CONTEXT.md)) |
| **E-store** | Physical/digital merch (t-shirts, trackers, …) | **Separate** checkout & catalog; marketing cross-links only at first |
| **PLOS (this repo)** | The operating system app | JWT app, Nest API, Postgres |

**Recommended web layout (Google-friendly, simple to operate):**

| URL | What lives there |
|-----|------------------|
| `yoursite.com` | Marketing home → **Shop** + **Open PLOS** |
| `shop.yoursite.com` or `yoursite.com/shop` | Store (prefer **Shopify** or similar — not custom cart inside PLOS) |
| `app.yoursite.com` | PLOS (Vite SPA + Nest API) |

**Auth:** Shop customers and PLOS users can stay on **separate logins** until you have a concrete reason to unify (e.g. subscriber discounts in the shop).

---

## 3. What we have built (functionality)

Roadmap steps **A–E** and **G** are **done** per [`PL_PRODUCT_AND_ROADMAP.md`](./PL_PRODUCT_AND_ROADMAP.md). Summary below.

### 3.1 Backend (`plos-backend`)

| Area | What works |
|------|------------|
| **Stack** | NestJS, Prisma, PostgreSQL, JWT auth |
| **Auth** | Register, login; `GET/PATCH /auth/me` (name, timezone, currency); free `Subscription` row on register |
| **Responsibilities** | CRUD; filters (state, category, person); **complete** (one-shot sets `completedAt` + event); **recurring complete** advances `dueDate`, clears `completedAt`, timeline note; **PATCH** edit all main fields |
| **Security** | All responsibility routes scoped to **logged-in user** |
| **Dashboard API** | `GET /users/dashboard` — summary, lists, category breakdown, financial pressure by month, `activitySeries` (14 days), seed path for empty accounts |
| **People** | CRUD; assign on responsibility |
| **Habits** | `GET /responsibility/habits/streaks` — streaks from completion + recurring check-in events |
| **Timeline** | Events from user actions + scheduler |
| **Scheduler** | Cron transitions (DUE/OVERDUE → events + in-app notifications); **every minute in dev** — tune for production |
| **Notifications** | In-app only: list, unread count, mark read, mark all; created on complete + state transitions |
| **Data model** | `User`, `Person`, `Responsibility`, `Event`, `Notification`, `Subscription` (Razorpay fields present, **no payment flow yet**) |

### 3.2 Frontend (`plos-frontend`)

| Route | Page | Notes |
|-------|------|--------|
| `/login`, `/register` | Auth | Protected shell after login |
| `/` | Dashboard | Live analytics grid, KPI rail, charts, open commitments table, edit modal |
| `/responsibilities` | Files | Full responsibility list + create/edit |
| `/finance`, `/health`, `/habits` | Category modules | Shared shell + cards + edit |
| `/people` | Filter (People) | CRUD |
| `/timeline` | Charts (Timeline) | Event feed |
| `/notifications` | Alerts | Full notification list |
| `/settings` | Settings | Profile, timezone, currency, plan card (read-only) |

**UI / UX (recent iteration — myWallet-inspired):**

- Purple **sidebar rail** + rounded white **workspace** card
- **Purple header bar** on every page (gradient, white title + clock)
- **Dashboard** lilac workspace background; stronger chart/tile titles
- **Spacing pass:** header padding, gap between header and content, dashboard grid gutters, slightly narrower sidebar/right rail for chart room
- Charts: workload, category, analytics line, INR pressure, activity pulse, queue, last 7 days; gradient KPI strip; monthly progress stack card; category pulse panel
- Redux auth store; React Query for API; Vite dev proxy `/api` → Nest

### 3.3 What is intentionally not built yet

| Item | Roadmap | Notes |
|------|---------|--------|
| **Razorpay / paid plans** | **F** | Schema ready; flow deferred **last** |
| **Account type** (solo / family / shared) | **H** | Product decision recorded; backend + onboarding + Settings change not started |
| **“Today” home** | Product vision | Priorities top + diary feel below — dashboard is analytics-first today |
| **Email / push / WhatsApp notifications** | — | DB `channel` supports it; only **`in_app`** is wired |
| **Sheets import** | Optional later | One-time CSV/template, not two-way sync |
| **E-store** | Separate product | Not in this repo |
| **Family/shared permissions** | After H | Invites, roles — follow-on |

---

## 4. Repository layout (technical)

```
plos/
├── START_HERE.md     If unsure what to do — read this first
├── SETUP.md          Day-to-day commands + two-AI workflow
├── CLAUDE.md         Conventions for Claude Code
├── .cursorrules      Conventions for Cursor
├── plos-backend/     PLOS API (NestJS, Prisma, scheduler, auth)
├── plos-frontend/    PLOS web app (Vite + React + Mantine)
├── apps/web/         NIS brand site placeholder (Week 0+)
├── packages/         brand-tokens, ui, razorpay-sdk (shared)
├── docs/             Product & context (this file, PLOS_CONTEXT, roadmap)
└── README.md         Quick start
```

**Run locally (typical):**

- Backend: `plos-backend` — DB + migrations + `npm run start:dev` (port 3001)
- Frontend: `plos-frontend` — `npm run dev` (proxies API in dev)
- Env: see `plos-backend/.env.example`, `plos-frontend/.env.example`

---

## 5. What we have done “till now” (timeline in plain English)

| Phase | Outcome |
|-------|---------|
| **Foundation** | Postgres schema, responsibilities lifecycle (upcoming → due → overdue → completed), people, events |
| **Auth & app shell** | JWT, protected routes, login/register |
| **Core product loop** | Create → track → complete (including recurrence) → timeline → dashboard reflects reality |
| **Polish iteration (A–G)** | Edit anywhere, activity charts, settings profile, in-app notifications, habit streaks |
| **UI / brand pass** | myWallet-style layout, purple chrome, dashboard analytics UX, spacing and hierarchy fixes |
| **Documentation** | `PLOS_CONTEXT`, `PL_PRODUCT_AND_ROADMAP`, this overview |

---

## 6. Recommended future (opinion)

This is **strategy**, not a commitment — adjust as you learn from sheets sales and early PLOS users.

### 6.1 Next inside PLOS (software)

**Order that balances user value vs complexity:**

1. **Account type (H)** — solo / family / shared flag at signup + change in Settings (warnings only at first; real sharing later).
2. **“Today” home** — reshape `/` so the first screen is **due/overdue/attention** in seconds, with timeline/diary **below** (keeps the “life diary” promise from context doc).
3. **Production hardening** — scheduler interval, error monitoring, migration discipline, deploy `app.` subdomain.
4. **Razorpay (F)** — when you want recurring revenue on the app itself (after core retention story works).
5. **Notifications v2** — email or push for overdue (optional; in-app already exists).
6. **Sheets import** — when sheet buyers ask for it; one-time, not sync.

### 6.2 Next outside PLOS (ecosystem)

**Do not block PLOS on the store.**

1. **Marketing site** on main domain — clear **Shop** + **PLOS** CTAs (good for Google and humans).
2. **Shop MVP** on Shopify (or similar) — t-shirts, trackers; own checkout.
3. **Cross-links** — PLOS settings/footer: “Templates & merch”; shop thank-you page: “Try PLOS free.”
4. **Unified identity** — only if you need bundled offers; otherwise keep separate.

### 6.3 Long-term picture (3–5 year direction)

| Layer | Vision |
|-------|--------|
| **PLOS** | Default **life OS** for Indian households and solos — INR-native, people-aware, habits + money + admin in one timeline |
| **Sheets** | Funnel + cash + **feature discovery** (what to build in PLOS next) |
| **Store** | Brand + physical products; supports marketing, not core logic |
| **Monetization** | Free tier → Pro (Razorpay) on app; merch margin on store; sheet sales alongside |

**Risk to avoid:** One mega-site that is shop + app + marketing in a single React SPA — hurts SEO, shipping speed, and team focus. **Sibling products, one brand** scales better.

**Risk to embrace:** Ship PLOS to real users early; let sheets and store fund runway while PLOS depth grows (account types → sharing → billing).

---

## 7. Quick reference — roadmap status

| Step | Feature | Status |
|------|---------|--------|
| A | Edit responsibility | Done |
| B | Recurrence on complete | Done |
| C | Activity chart on dashboard | Done |
| D | Settings (profile, TZ, currency) | Done |
| E | In-app notifications | Done |
| F | Razorpay billing | Not started (last) |
| G | Habit streaks | Done |
| H | Account type solo/family/shared | Not started |

---

## 8. How to keep this file useful

Update **§3** when you ship features; **§5** when you finish a major phase; **§6** when strategy changes (e.g. you pick Shopify vs `/shop`, or merge logins).

For day-to-day engineering detail, keep using **`PL_PRODUCT_AND_ROADMAP.md`** (API notes, migrations, changelog table).

---

*PLOS is the long game; sheets and the store are how the ecosystem learns and earns while the app becomes indispensable.*

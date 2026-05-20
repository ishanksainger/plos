# PLOS — Product status & roadmap

**Product decisions & vision (daily diary, sheets vs PLOS, Today home, account types):** see [`PLOS_CONTEXT.md`](./PLOS_CONTEXT.md).

**How to use this file with Google Docs**

This repository cannot push edits directly into Google Drive. To merge this into your living doc:

1. Open your Google Doc: [Core idea / product doc](https://docs.google.com/document/d/1-Zrf3ClRWN1mv2Kj-qDs8ZOjHT-DAGSlcgKdy_hZ6QM/edit?tab=t.0)
2. In Google Docs: **File → Open → Upload** and choose this `.md` file, **or** copy sections below and paste (Docs will preserve headings).

---

## 1. Vision (from your core doc)

- **North star:** Personal Life Operating System (PLOS) — one place for responsibilities across finance, health, habits, family, admin; visibility on what’s due, overdue, and done; people assigned; timeline of changes. Work and freelancer-style use cases sit **inside** that same “life diary,” not as a separate product (see `PLOS_CONTEXT.md`).
- **Core doc (source of truth for product intent):**  
  https://docs.google.com/document/d/1-Zrf3ClRWN1mv2Kj-qDs8ZOjHT-DAGSlcgKdy_hZ6QM/edit?tab=t.0

---

## 2. What is built today (functionality)

| Area | Status |
|------|--------|
| **Auth** | Register, login, JWT; **`GET /auth/me`**, **`PATCH /auth/me`** (name, timezone, currency; login/register return those fields); protected app shell; free `Subscription` row on register. |
| **Settings** | **`/settings`** — profile form, timezone & currency selects (curated lists + “saved” fallback), read-only plan card; Redux `patchUser` after save. |
| **Responsibilities** | List (filters: state, category, person), **create**, **complete** (one-shot: `completedAt` + event; **recurring:** advances `dueDate`, clears `completedAt`, appends timeline event with note), **delete**; **edit (PATCH)** — title, category, due date, recurrence, amount, person, notes; unassign person / clear amount supported. |
| **Ownership / security** | `GET/PATCH/DELETE /responsibility/:id` and `markComplete` scoped to **JWT user** (no cross-user access by id). |
| **Today home** | **`GET /users/today`** — timezone-aware overdue, due today, upcoming 7d, completed today, streaks at risk, recent events. **`/`** route = Today; **`/insights`** = analytics dashboard. |
| **Dashboard (Insights)** | Live summary, charts, KPI rail, open commitments — **`GET /users/dashboard`** at **`/insights`**. |
| **People** | CRUD; assign on create/edit responsibility. |
| **Modules** | Finance / Health / Habits pages share category shell + list + **edit** on cards. **Habits:** live streaks via **`GET /responsibility/habits/streaks`** (completion + recurring check-in days), KPI strip + per-card streak badge. |
| **Timeline** | Global event feed from scheduler + user actions. |
| **Scheduler** | Cron records state transitions into `Event` (**1 min** in dev, **5 min** in production via `NODE_ENV`; override with `SCHEDULER_CRON`); on new DUE/OVERDUE transitions creates **in-app** `Notification` rows. |
| **Notifications** | **`Notification`** rows with `title` / `message` / `readAt`; channel **`in_app`** (written as `sent` immediately — no external worker yet). **`GET /notifications`**, **`GET /notifications/unread-count`**, **`PATCH …/read`**, **`POST /notifications/read-all`**. Header bell (popover) + **`/notifications`** page. Enqueued from **`markComplete`** and scheduler-driven due/overdue transitions. |
| **UI / ops** | Purple shell, Mantine + brand tokens, optional PostHog/Sentry, Pino request logs, **`GET /health`** with `dbConnected`, GitHub Actions CI. |

---

## 3. Roadmap (build order)

| Step | Item | Status |
|------|------|--------|
| **A** | **Edit responsibility** (API + modal + list/dashboard entry points) | **Done** (this iteration). |
| **B** | **Recurrence behavior on complete** — for `recurrence !== 'none'`, advance `dueDate` by rule, keep `completedAt` null, append forced timeline event (with note). | **Done** (this iteration). |
| **C** | **Activity chart** — `activitySeries` on dashboard API + wire `ActivityLineChart`. | **Done** (this iteration). |
| **D** | **Settings** — profile, `timezone`, `currency`; replace `/settings` stub. | **Done** (this iteration). |
| **E** | **Notifications** — in-app queue (DB), API, header + full page UI; hooks from complete + scheduler. | **Done** (this iteration). |
| **F** | **Billing / Razorpay** — fields on `Subscription`; no flow yet. | Not started (deferred — build last). |
| **G** | **Real habit streaks** — data + API + bind habits hero / KPIs. | **Done** (this iteration). |
| **H** | **Account type** — `solo` / `family` / `shared` at onboarding + **change later** in Settings; backend field + copy/warnings when downgrading. Family/shared **permissions model** in follow-up steps. | Not started. |

---

## 4. Technical notes (edit / PATCH, activity, settings, notifications, habits, frontend API)

- **Backend:** `PATCH /responsibility/:id` with `UpdateResponsibilityDto` (partial). Uses `ResponsibilityUncheckedUpdateInput` for scalar `personId` / `amount` including `null`.
- **Frontend:** `responsibilityService.update(id, payload)`; `CreateResponsibilityModal` accepts optional `editing` row (create vs edit in one modal).
- **Entry points:** Responsibility cards (Responsibilities + Finance/Health/Habits), Dashboard “Needs attention” table (**Edit** column).
- **Activity sparkline:** `GET /users/dashboard` includes `activitySeries` (14 days, oldest first, server-local dates). Counts timeline `Event` rows for the user’s responsibilities where `toState === COMPLETED` or `note` starts with the recurring-completion prefix (`src/event/activity-completion.ts`, kept in sync with `markComplete`).
- **Settings:** `PATCH /auth/me` with `UpdateProfileDto` (`name` optional → trim, empty → `null`; `timezone` max 64; `currency` ISO 4217 uppercase 3 letters). Empty body is a no-op and returns `GET /auth/me` shape (includes `subscription`).
- **Notifications:** Migration `20260511120000_notification_in_app_fields` adds `title`, `message`, `readAt`. `NotificationModule` is `@Global()`; `NotificationService.createInApp` sets `channel: in_app`, `status: sent`, `sentAt` now. Apply migration before running the API against an existing DB. **`NotificationModule` must `import { AuthModule }`** so `JwtAuthGuard` on `NotificationController` can resolve `JwtService` (otherwise Nest fails to boot and every API returns 500).
- **Habit streaks:** `GET /responsibility/habits/streaks` (before parametric `:id`). Uses `Event` rows for `category: habit` with `toState === COMPLETED` or recurring-completion `note` prefix; `computeStreakFromCompletionDays` in `habit-streaks.ts` (calendar days, server local).
- **Frontend API base:** In dev, if `VITE_API_BASE_URL` is unset, requests use same-origin **`/api`** and Vite proxies to the Nest port (`vite.config.ts`). For production or LAN devices, set **`VITE_API_BASE_URL`** to the API origin (see `plos-frontend/.env.example`).

---

## 5. Google Docs API — what you need (OAuth to create/update docs)

The app cannot edit your Google Doc without your Google Cloud setup and user consent. Typical checklist:

1. **Google Cloud project** — [Google Cloud Console](https://console.cloud.google.com/).
2. **Enable APIs** — **Google Docs API** (required for `documents.create`, `documents.batchUpdate`). Enable **Google Drive API** too if you create files in Drive or need folder placement / listing beyond a single doc ID you already own.
3. **OAuth consent screen** — App name, support email, scopes (see below). For external users, add **test users** while in Testing, or **publish** the app when ready.
4. **OAuth client** — Type **Web application** (or **Desktop** if a local script). Note **Client ID** and **Client secret**. Add **Authorized redirect URIs** that match your backend or SPA callback (e.g. `https://api.yourapp.com/auth/google/callback`).
5. **Scopes** — At minimum **`https://www.googleapis.com/auth/documents`** to read/write document content. Use **`https://www.googleapis.com/auth/drive.file`** (per-file / app-created) or **`drive`** if you need broader Drive access; prefer the narrowest scope that fits.
6. **Token handling** — Exchange the authorization **code** for **access_token** + **refresh_token** (request `access_type=offline` and `prompt=consent` the first time). Store **refresh_token** encrypted per user; refresh short-lived access tokens before **Docs** API calls.
7. **Implementation** — Use the official client (`googleapis` npm) or REST: **Docs** for structure and text (**batchUpdate** with `InsertText`, `UpdateParagraphStyle`, etc.).
8. **Alternative** — **Service account** + optional **domain-wide delegation** (Workspace orgs) or a shared Drive owned by the service account — different trust model; not “user OAuth.”

---

## 6. Changelog (doc maintenance)

| Date | Note |
|------|------|
| 2026-05-11 | Created this file; documented shipped features; roadmap A completed (edit responsibility). |
| 2026-05-11 | Roadmap B: recurring complete advances `dueDate`, timeline event with `force` + `note`; added Google Docs / OAuth checklist (section 5). |
| 2026-05-11 | Roadmap C: dashboard `activitySeries` + `ActivityLineChart` wired to live counts. |
| 2026-05-11 | Roadmap D: `SettingsPage`, `PATCH /auth/me`, login/register user payload includes timezone & currency. |
| 2026-05-11 | Roadmap E: notification API + UI; Prisma fields on `Notification`; scheduler + `markComplete` enqueue in-app feed. |
| 2026-05-11 | Roadmap G: habit streak API + Habits UI; Vite `/api` proxy + configurable API origin; clearer load-failure copy on main pages. |
| 2026-05-11 | Added `PLOS_CONTEXT.md` (vision, sheets vs PLOS, Today home, solo/family/shared + change later). Roadmap **H** for account type. Billing F noted as deferred last. |
| 2026-05-20 | Sprint 0 foundation + Step I Today home (`/`, `/insights`, `GET /users/today`). |

_Add a row here whenever you merge a roadmap step._

---

*End of export — paste or import into Google Docs as needed.*

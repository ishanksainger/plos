# Start here (if you're not sure what to do)

**You only need three things today.**

---

## 1. Run PLOS (same as before)

From this folder:

```bash
npm run dev
```

Open **http://localhost:5173** — log in and use the app. Nothing about the new folders changes this.

---

## 2. Ignore NIS for now (unless you want a second project)

The **NIS brand website** will live in `apps/web/` later. That folder is **empty on purpose**. You do **not** need to build it today.

| Work on | Tool | Folder |
|--------|------|--------|
| **PLOS app** (dashboard, habits, API, …) | **Cursor** (this chat) | `plos-backend/`, `plos-frontend/` |
| **NIS marketing site** (later) | Claude Code in terminal | `apps/web/` |

---

## 3. Save your work in git (when you're happy)

You have a lot of **uncommitted** PLOS changes. When a chunk feels done:

```bash
git status
git add plos-backend plos-frontend docs   # add what you mean to keep
git commit -m "feat(plos): describe what you did"
```

The **scaffolding** files (`CLAUDE.md`, `packages/`, `apps/`, `SETUP.md`, …) can be committed separately — see `MIGRATION_NOTES.md`.

---

## What was added around your PLOS code (2026-05-20)

- **`SETUP.md`** — full manual (commands, two AIs, recovery).
- **`docs/PLOS_PROJECT_OVERVIEW.md`** — what PLOS is, what's built, future direction.
- **`packages/brand-tokens/`** — shared colors (Nikita can own).
- **`apps/web/`** — placeholder for future NIS site.

Your existing `plos-backend` and `plos-frontend` were **not rewritten**.

---

## What to ask Cursor next (PLOS)

Copy-paste when ready:

> Read `CLAUDE.md` and `docs/PLOS_PROJECT_OVERVIEW.md`. Then start **Sprint 0** from `/Volumes/DevSSD/dev/claude/plos_code_plan_v1.md` (scheduler env, health check with DB). Only touch `plos-backend/` and `plos-frontend/`.

After Sprint 0, the big product step is **Today home** (`/` = priorities, dashboard moves to `/insights`) — same plan file, Step I.

---

## Plans live outside this repo

| File | Purpose |
|------|---------|
| `/Volumes/DevSSD/dev/claude/plos_code_plan_v1.md` | PLOS sprints (Cursor) |
| `/Volumes/DevSSD/dev/claude/nis_code_plan_v1.md` | NIS weeks (Claude Code) |

---

**More detail →** [`SETUP.md`](./SETUP.md)

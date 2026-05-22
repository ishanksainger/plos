# NIS / PLOS Monorepo — Conventions for AI Tools

This file is read automatically by Claude Code at the start of every session. Cursor reads the equivalent `.cursorrules` file. Both files contain the same rules — keep them in sync if you edit either.

**Both AIs share PLOS work now** (Claude Code did the May 2026 visual redesign of `plos-frontend`; Cursor still owns the backend and continues feature work on the frontend alongside Claude). See section 3 and the coordination protocol in section 3a.

**Before starting any task, read `BACKLOG.md` at the repo root** — it's the single source of truth for what's still pending and who's expected to do it.

**Last updated:** 2026-05-23

---

## 1. What's in this repo

This is a monorepo holding two products under one brand (NIS — Nest of Innovative Space):

```
plos/                              ← repo root (will likely be renamed to thenispace/ later)
├── apps/
│   └── web/                       → NIS brand site (Next.js, thenispace.com)  ← Claude Code primary
├── plos-backend/                  → PLOS API (NestJS, app.thenispace.com)     ← Cursor primary
├── plos-frontend/                 → PLOS web app (Vite + Mantine)             ← Shared (see §3)
├── packages/
│   ├── brand-tokens/              → shared design tokens (Nikita owns)
│   ├── ui/                        → shared UI primitives (Button, Card, Badge)
│   └── razorpay-sdk/              → shared Razorpay client
├── docs/                          → product context, roadmaps, planning notes
├── BACKLOG.md                     → pending work register — READ THIS FIRST
├── START_HERE.md                  → current state + what's running + click-through flow
├── CLAUDE.md                      → this file (conventions for Claude Code)
├── .cursorrules                   → same rules, for Cursor
├── SETUP.md                       → day-to-day commands for the human owner
└── MIGRATION_NOTES.md             → what changed in May 2026 reorg
```

## 2. Read these before doing anything substantial

Plans live in `/Volumes/DevSSD/dev/claude/` (Ishank's claude workspace folder):

| File | When to read |
|---|---|
| `nis_site_architecture_plan_v1.md` | Strategy: why we chose this site shape |
| `plos_plan_review_v1.md` | Strategy: critique of original PLOS plan, revised roadmap |
| `plos_code_plan_v1.md` | Engineering: sprint-by-sprint PLOS plan (steps I → P) |
| `nis_code_plan_v1.md` | Engineering: week-by-week NIS plan (Week 0 → 10) |

For long-term context, `ishank_income_strategy_2026_v3.md` is the master business strategy.

## 3. Tool ownership (avoid stepping on each other)

| Folder | Primary | Secondary may touch? |
|---|---|---|
| `apps/web/` | Claude Code | Cursor: only if explicitly invited via BACKLOG.md, otherwise hands off. |
| `plos-backend/` | Cursor | Claude Code: only backend endpoints listed in BACKLOG.md and tagged `claude` / `either`. Don't restructure NestJS modules unprompted. |
| `plos-frontend/` | **Shared** (Claude Code led the May 2026 visual redesign; Cursor continues feature work) | Either may touch any file. Coordinate via BACKLOG.md — see §3a. |
| `packages/brand-tokens/` | **Nikita (human)** | Neither AI changes values without explicit human approval. |
| `packages/ui/` | Whichever AI first needs a new primitive. PR required. | Either, with PR review by Ishank. |
| `packages/razorpay-sdk/` | Whichever AI ships payment first. | Either, with PR review by Ishank. |
| `docs/` + `BACKLOG.md` + `START_HERE.md` | Humans + AI | Either may add. Don't delete others' docs. **Always update `BACKLOG.md` when you finish an item.** |

## 3a. Coordination protocol (when two AIs share `plos-frontend/`)

The protocol is simple: **`BACKLOG.md` is the queue.** Don't start a task that isn't in there or isn't tagged for you.

1. **Before starting work**, open `BACKLOG.md` and find an item tagged for you (`claude` or `either`). If you want to pick up something tagged `cursor`, ask the human first.
2. **Claim the item** by editing the line to `[in progress · YYYY-MM-DD · claude]` and committing that edit before you write any code. This is the lock — if Cursor sees the line is in progress, they'll pick a different one.
3. **Work on a branch** named `feat/plos-<short-name>` (see §6). One PR per item.
4. **When done**, strike through the bullet in `BACKLOG.md` and add `→ shipped in <commit-or-PR-link>`. Update `START_HERE.md` if the change is user-visible.
5. **If you find new pending work** during a task (a real follow-up, not scope creep), add a new bullet to `BACKLOG.md` with a sensible priority and owner. Don't silently leave TODO comments in code.

If you ever need to touch a file outside your primary area without a BACKLOG.md entry, write the entry FIRST, get human approval, then code.

## 4. Cross-app rules (the important ones)

1. **`apps/web` may not import from `plos-backend` or `plos-frontend`.** Communication is HTTP-only (e.g. waitlist form POSTs to the PLOS API at `app.thenispace.com/api/waitlist`).

2. **`plos-frontend` and `plos-backend` may not import from `apps/web`.** Same reason.

3. **All three apps SHOULD import from `packages/*`.** Brand consistency requires this. If you find yourself copying a component or function between apps, lift it to a package.

4. **Never hardcode brand colors, fonts, or spacing.** Always import from `@nis/brand-tokens`. Example:
   - ❌ `className="bg-[#7c3aed]"`
   - ✅ `className="bg-accent-electric"` (after Tailwind config consumes tokens)
   - ✅ `style={{ backgroundColor: tokens.colors.accent.electric }}`

5. **One Razorpay integration, one Supabase project.** Don't create new accounts for new features. Reuse the existing `@nis/razorpay-sdk` and Supabase client.

## 5. Coding conventions

- **TypeScript everywhere.** No `any` without a comment explaining why.
- **No `console.log` in committed code.** Use the project's logger (Pino in backend, console with eslint-disable in frontend dev only).
- **Run formatters before commit.** `pnpm format` or whatever the local script is.
- **Tests for critical paths.** Not 80% coverage — just "no money-handling code ships without a test."
- **Use `Intl.NumberFormat` for currency.** Never hardcode `₹` so we can go multi-country later.
- **Dates: store UTC in DB, display in user's `timezone` from settings.**

## 6. Git workflow

- **Branches:** `feat/plos-<short-name>` for PLOS work, `feat/web-<short-name>` for NIS work, `pkg/<package>-<change>` for shared packages.
- **No direct commits to `main`.** Always PR.
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- **One PR = one feature or one fix.** Don't batch unrelated changes.

## 7. When in doubt

- **Item not in `BACKLOG.md`?** Don't code it. Add the item to BACKLOG.md first (with priority + owner), then claim it per §3a.
- **Touching `packages/*`?** Stop. Open a PR with a clear "why" in the description. Ishank reviews.
- **About to touch the other AI's primary area** (Cursor → `apps/web/`, Claude Code → `plos-backend/`)? Don't, unless the BACKLOG.md item is tagged for you.
- **Adding a new dependency?** Justify it in the PR. Prefer existing deps. Especially: don't add a new state library, CSS framework, or API client without discussion.
- **Renaming files?** Use `git mv` so history is preserved.
- **Deleting code?** Comment-out with `// REMOVED-2026-05-23: reason` if you're unsure, leave for one review cycle, then delete.

## 8. Things specifically NOT to do

- Don't switch payment processor from Razorpay. India strategy is locked.
- Don't move the PLOS shop to Shopify. See `plos_plan_review_v1.md` Challenge #1.
- Don't add user-facing English alongside Hindi mixing without product approval.
- Don't build "for everyone." PLOS wedge is Indian freelancers + dual-income households. See `plos_plan_review_v1.md` Challenge #2.
- Don't gate features behind paywall on free tier without checking `nis_code_plan_v1.md` pricing.
- Don't send notifications without checking user opt-in (`whatsappOptIn`, `emailOptIn`).
- Don't store secrets in code. Use `.env` files (gitignored). Document required env vars in `.env.example`.

## 9. Personas you're working with

- **Ishank** — the human owner. Reviews PRs, approves shared-package changes, holds business context.
- **Nikita** — design co-founder. Owns brand tokens, visual decisions, all illustrations + 3D + Spline. Cannot code.
- **You (the AI)** — execute the plans in `/Volumes/DevSSD/dev/claude/*.md`. Ask Ishank when blocked. Don't invent product decisions.

## 10. How to get help

If the plan documents conflict, ask Ishank. If a plan document seems wrong, point it out — don't silently work around it. If you're unsure which file to read first, start with `SETUP.md`.

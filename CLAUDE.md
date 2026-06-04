# NIS / PLOS Monorepo — Conventions for AI Tools

This file is read automatically by Claude Code at the start of every session. Cursor reads the equivalent `.cursorrules` file. Both files contain the same rules — keep them in sync if you edit either.

**Claude Code owns all code in this repo** (`apps/web`, `plos-backend`, `plos-frontend`, and `packages/*` under the PR rules below). Decided 2026-06-05: with the codebase essentially launch-complete and Ishank working solo on a side-hustle schedule, a single coherent agent beats the coordination tax of splitting backend/frontend across two AIs. **Cursor is now optional** — pulled in only for a parallel backend push, and only when explicitly invited via a `cursor`-tagged `BACKLOG.md` item. **Product *content* (trackers, Canva suites, the wedding box, etc.) is NOT code — it's owned by Claude Desktop / the humans per `/Volumes/DevSSD/dev/claude/nis_build_plan.md`. Claude Code does not create product content.** See section 3 and the protocol in section 3a.

**Before starting any task, read `BACKLOG.md` at the repo root** — it's the single source of truth for what's still pending and who's expected to do it.

**Claude Code — at the START of every session in this project, read ALL files in `/Users/ishanksainger/.claude/projects/-Volumes-DevSSD-dev-projects-ishank-plos/memory/` BEFORE responding to the first user message.** Especially `user_working_pattern.md` and `feedback_collaboration_style.md` — they describe how the user wants to be collaborated with. Don't claim "I don't remember" without reading these first.

**Last updated:** 2026-06-05

---

## 1. What's in this repo

This is a monorepo holding two products under one brand (NIS — Nest of Innovative Space):

```
plos/                              ← repo root (will likely be renamed to thenispace/ later)
├── apps/
│   └── web/                       → NIS brand site (Next.js, thenispace.com)  ← Claude Code
├── plos-backend/                  → PLOS API (NestJS, app.thenispace.com)     ← Claude Code (Cursor optional)
├── plos-frontend/                 → PLOS web app (Vite + Mantine)             ← Claude Code (see §3)
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

| Folder | Owner | Notes |
|---|---|---|
| `apps/web/` | Claude Code | NIS brand site. |
| `plos-backend/` | Claude Code | PLOS API. Respect the NestJS architecture — **don't restructure modules unprompted.** Cursor may help only on a `cursor`-tagged BACKLOG.md item. |
| `plos-frontend/` | Claude Code | PLOS web app. Cursor may help only on a `cursor`-tagged BACKLOG.md item. |
| `packages/brand-tokens/` | **Nikita (human)** | Claude Code never changes values without explicit human approval. |
| `packages/ui/` | Claude Code | PR required; Ishank reviews shared-package changes. |
| `packages/razorpay-sdk/` | Claude Code | PR required; Ishank reviews shared-package changes. |
| **Product content** (trackers, Canva, wedding box) | **Claude Desktop / humans** | Per `nis_build_plan.md`. **Claude Code does NOT create product content.** |
| `docs/` + `BACKLOG.md` + `START_HERE.md` | Humans + AI | Either may add. Don't delete others' docs. **Always update `BACKLOG.md` when you finish an item.** |

## 3a. Working protocol (`BACKLOG.md` is the queue)

The protocol is simple: **`BACKLOG.md` is the queue.** Don't start a task that isn't in there. This discipline still matters even with one code-agent — it keeps the register honest and lets Cursor slot in cleanly if invited for a parallel backend push.

1. **Before starting work**, open `BACKLOG.md` and find (or add) the item. If an item is tagged `cursor`, it's been parked for a Cursor session — confirm with the human before taking it yourself.
2. **Claim the item** by editing the line to `[in progress · YYYY-MM-DD · claude]` and committing that edit before you write any code. This is the lock — so a parallel Cursor session won't double-pick it.
3. **Work on a branch** named per §6. One PR per item.
4. **When done**, strike through the bullet in `BACKLOG.md` and add `→ shipped in <commit-or-PR-link>`. Update `START_HERE.md` if the change is user-visible.
5. **If you find new pending work** during a task (a real follow-up, not scope creep), add a new bullet to `BACKLOG.md` with a sensible priority and owner. Don't silently leave TODO comments in code.

If you ever need to touch a file without a BACKLOG.md entry, write the entry FIRST, then code.

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
- **Working in `plos-backend/`?** Fine — it's yours now — but respect the existing NestJS architecture; don't restructure modules unprompted. If an item is tagged `cursor`, confirm with Ishank before taking it.
- **Asked to build product content** (a tracker spreadsheet, Canva design, etc.)? Stop — that's Claude Desktop / the humans per `nis_build_plan.md`. Wire up the *code* that delivers content; don't author the content.
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

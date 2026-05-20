# SETUP — Day-to-day commands for Ishank

If you don't remember anything else, just remember this file. Everything you actually type day-to-day lives here.

---

## What this repo is, in 30 seconds

One folder holds two products:

1. **PLOS** — the personal-life-OS app at `app.thenispace.com`. Lives in `plos-backend/` and `plos-frontend/`. Built with Cursor.
2. **NIS brand site** — the storefront at `thenispace.com`. Lives in `apps/web/`. Built with Claude Code.

They share design tokens and a Razorpay wrapper via the `packages/` folder.

That's it. Don't worry about "monorepo" jargon — it's just two apps in one folder so they can share things.

---

## Daily commands (memorize these)

### Start the PLOS dev servers (what you already know)
```bash
npm run dev
```
This boots PLOS backend on port 3001 and PLOS frontend on port 5173. Already in your root `package.json`.

### Start the NIS brand site dev server (once it's scaffolded)
```bash
cd apps/web
npm run dev
```
Boots on port 3000 (Next.js default). Open `http://localhost:3000` in browser.

### Check git status before bedtime
```bash
git status
```
If you see modified files, commit before closing your laptop. You don't want to lose work.

### Commit cleanly
```bash
git add .
git commit -m "feat(plos): add Today home"
```
Use `feat:`, `fix:`, `chore:`, or `docs:` as the prefix.

### See what branches you have
```bash
git branch
```

---

## Working with the two AIs

### Cursor → use it for PLOS work
Open Cursor in this repo. It will read `.cursorrules` automatically. Just describe what you want and reference the plan:

> "Implement Sprint 1 of `/Volumes/DevSSD/dev/claude/plos_code_plan_v1.md` — the Today home. Follow the file paths and acceptance criteria in that doc."

### Claude Code → use it for NIS brand site work
Open a terminal, `cd` into this repo root, run `claude`. It will read `CLAUDE.md` automatically. First job:

> "Scaffold the NIS brand site in `apps/web` per Week 0 and Week 1 of `/Volumes/DevSSD/dev/claude/nis_code_plan_v1.md`. Use the README in `apps/web/` as your starting point."

### NEVER let both AIs work at the same time on the same file
- Cursor: only inside `plos-backend/` and `plos-frontend/`
- Claude Code: only inside `apps/web/`
- Either may touch `packages/*`, but YOU should pause one before letting the other modify a shared package, and review the diff.

---

## When to commit

Commit small. Aim for one commit per logical change. Example day:

```
git commit -m "feat(plos): add /users/today endpoint"
git commit -m "feat(plos): build TodayPage component"
git commit -m "feat(plos): wire TodayPage to /users/today"
git commit -m "test(plos): cover today endpoint timezone logic"
```

Not one giant commit at end of day. Small commits = easy to revert if Cursor broke something.

---

## When something breaks

1. **Don't panic.** Git keeps a copy of everything.
2. **Check what changed:** `git status` shows what's modified, `git diff` shows the changes.
3. **Revert the last commit:** `git reset --hard HEAD~1` (careful: this destroys uncommitted changes).
4. **Revert one specific file:** `git checkout HEAD -- path/to/file.ts`.
5. **If totally lost:** ask Claude Code to debug. It can read git history.

---

## When you want a fresh start on something

Branches. Make a branch, work on it, throw it away if it goes wrong:

```bash
git checkout -b experiment/try-new-thing
# ...work, work, work...
# if good:
git checkout main && git merge experiment/try-new-thing
# if bad:
git checkout main && git branch -D experiment/try-new-thing
```

---

## What lives where (file tour)

```
plos/
├── CLAUDE.md               ← Conventions for Claude Code (it reads automatically)
├── .cursorrules            ← Same conventions for Cursor (it reads automatically)
├── SETUP.md                ← THIS FILE — your manual
├── MIGRATION_NOTES.md      ← What changed on 2026-05-20 when we set this up
├── README.md               ← Public repo description
├── package.json            ← Root scripts (npm run dev)
│
├── apps/
│   └── web/                ← NIS brand site (empty until Claude Code scaffolds Week 0)
│
├── plos-backend/           ← Existing PLOS API (unchanged)
├── plos-frontend/          ← Existing PLOS web app (unchanged)
│
├── packages/
│   ├── brand-tokens/       ← Nikita's design tokens (colors, fonts)
│   ├── ui/                 ← Shared Button/Card/Badge (stubs for now)
│   └── razorpay-sdk/       ← Shared Razorpay wrapper (stub for now)
│
└── docs/                   ← PLOS planning docs (already existed)
```

---

## What plans to follow

All the planning docs live in your other folder: `/Volumes/DevSSD/dev/claude/`. The four key files:

| File | What it does |
|---|---|
| `nis_site_architecture_plan_v1.md` | Why NIS site is structured this way (Shopify vs custom, etc) |
| `plos_plan_review_v1.md` | Critique of original PLOS plan, revised roadmap I → P |
| `plos_code_plan_v1.md` | Sprint-by-sprint PLOS engineering plan (Cursor follows this) |
| `nis_code_plan_v1.md` | Week-by-week NIS engineering plan (Claude Code follows this) |

Open these in any text editor when you need to remember what's coming next.

---

## What NOT to mess with

- **`packages/brand-tokens/src/tokens.ts`** — Nikita owns. Don't change colors yourself unless she said it's OK.
- **`plos-backend/prisma/migrations/`** — never edit a migration file after it's applied. If you need a change, write a new migration.
- **`.env` files** — keep secrets out of git. They're already in `.gitignore`.

---

## When to ask Claude (me) for help

- "I don't understand what Cursor did to my code" → I'll read the diff and explain
- "Cursor and Claude Code disagree on something" → I'll arbitrate
- "I want to add [new product idea]" → I'll fit it into the plan
- "I'm overwhelmed and want a summary of where I am" → I'll give you a status snapshot

---

## When to ask Cursor for help

- "Build feature X from `plos_code_plan_v1.md` step Y"
- "Why is this test failing"
- "Refactor this file to be cleaner"
- "Add validation to this endpoint"

---

## When to ask Claude Code for help

- "Scaffold the next NIS week from `nis_code_plan_v1.md`"
- "Set up the database schema for commerce"
- "Wire up Razorpay checkout"
- "Build the canvas designs page"

---

## You're not alone

If you forget any of this, just open this file again. Or ask Claude (the chat AI) — I can explain anything in this repo at any time.

— Set up 2026-05-20 by Claude

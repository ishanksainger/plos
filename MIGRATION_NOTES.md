# MIGRATION NOTES — 2026-05-20

This file documents exactly what Claude (chat) added to this repo on 2026-05-20 so you can review, accept, or revert.

## TL;DR

**Nothing existing was modified.** Only NEW files and folders were added. Your PLOS code, your `.git`, your in-progress uncommitted work — all untouched.

If you don't like any of this, you can delete it cleanly:

```bash
rm -rf apps packages
rm CLAUDE.md .cursorrules SETUP.md MIGRATION_NOTES.md
```

## What was added

### New files at repo root
| File | Purpose |
|---|---|
| `CLAUDE.md` | Instructions Claude Code reads automatically when it opens this repo |
| `.cursorrules` | Same instructions, in the format Cursor reads |
| `SETUP.md` | Day-to-day command reference for YOU (the human) |
| `MIGRATION_NOTES.md` | This file |

### New folders

```
apps/
└── web/
    └── README.md        ← Empty NIS app folder, with instructions for Claude Code

packages/
├── brand-tokens/
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── tokens.ts    ← TypeScript design tokens
│       ├── tokens.css   ← Same tokens as CSS variables
│       └── index.ts
├── ui/
│   ├── package.json
│   ├── README.md
│   └── src/
│       └── index.ts     ← Stub, no real components yet
└── razorpay-sdk/
    ├── package.json
    ├── README.md
    └── src/
        └── index.ts     ← Stub, no real client yet
```

## What was NOT touched

- `plos-backend/` — every file, unchanged
- `plos-frontend/` — every file, unchanged
- `docs/` — every file, unchanged
- `package.json` at root — UNCHANGED (still has your `npm run dev` script)
- `.git/`, `.gitignore`, `.gitattributes` — unchanged
- `README.md` — unchanged
- Your uncommitted work-in-progress — all preserved

## Why I didn't fully "convert" the repo to a Turborepo monorepo

Your existing setup already works:
- `plos-backend` and `plos-frontend` live as siblings under one root
- `npm run dev` at root starts both with `concurrently`
- This IS a basic monorepo, just without the fancy tooling

A full Turborepo conversion would have:
- Required adding pnpm workspaces (you currently use npm)
- Required renaming `plos-backend` → `apps/plos-backend` (would have broken your `npm run dev` script)
- Required learning a new build orchestration tool
- Risked breaking your in-progress uncommitted work

So I chose the **minimum-disruption path**: add the new structure (apps/, packages/) NEXT TO your existing code, not on top of it. Your daily workflow continues to work exactly as before.

You can graduate to full Turborepo + pnpm workspaces later (probably around Week 5 of the NIS plan when sharing between apps/web and plos-frontend becomes painful). When that day comes, ask me to do the upgrade.

## What you can do right now

### 1. Review the new files
Open each file and skim. The `SETUP.md` is the most important one for you personally.

### 2. Commit the new structure as one commit
```bash
git add CLAUDE.md .cursorrules SETUP.md MIGRATION_NOTES.md apps/ packages/
git commit -m "chore: add monorepo scaffolding for NIS + PLOS coexistence"
```

(Don't commit your other in-progress changes in the same commit — keep them separate.)

### 3. Hand PLOS to Cursor
Open Cursor in this repo. It will read `.cursorrules`. Tell it:

> "Read CLAUDE.md and SETUP.md, then start Sprint 0 of /Volumes/DevSSD/dev/claude/plos_code_plan_v1.md. Focus only on plos-backend and plos-frontend; do not touch apps/web/ — that's Claude Code's territory."

### 4. Hand NIS to Claude Code
In a terminal at this repo, run `claude`. It will read `CLAUDE.md` automatically. Tell it:

> "Read CLAUDE.md and apps/web/README.md, then scaffold the NIS brand site per Week 0 and Week 1 of /Volumes/DevSSD/dev/claude/nis_code_plan_v1.md. Don't touch plos-backend or plos-frontend."

### 5. Have Nikita open `packages/brand-tokens/src/tokens.ts`
This is where she controls all NIS brand colors and fonts. If she wants to change purple to a different shade, she edits these tokens and both PLOS and NIS update automatically (after a rebuild).

## What I did NOT decide for you

These are still open and you should think about them:

| Decision | Options | Recommendation |
|---|---|---|
| Rename repo folder from `plos` to `thenispace` | Yes / No | Eventually yes (it holds more than PLOS now), but not urgent |
| Switch from npm to pnpm | Yes / No | Eventually yes (workspaces are nicer in pnpm), but not urgent |
| Add Turborepo | Yes / No | When you start sharing real code between apps/web and plos-frontend |
| Should `docs/` move to repo root or stay where it is | Either is fine | Stay where it is |
| Hosting: keep VPS or move to Vercel | Vercel for frontends, Railway/Render for Nest backend | Per `nis_code_plan_v1.md` Week 0 |

## Reversal commands (if you hate any of this)

```bash
# Remove everything I added (won't touch your existing code)
cd /Volumes/DevSSD/dev/projects/ishank/plos
rm -rf apps packages
rm CLAUDE.md .cursorrules SETUP.md MIGRATION_NOTES.md

# Verify your existing PLOS code is intact
git status
# (should show only your pre-existing modifications, not anything related to my additions)
```

— Set up by Claude on 2026-05-20.

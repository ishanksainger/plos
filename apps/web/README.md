# apps/web — NIS brand site (thenispace.com)

This folder is **empty by design**. It's where the Next.js brand site will be scaffolded in Week 1 of `nis_code_plan_v1.md` (in the `/Volumes/DevSSD/dev/claude` workspace).

## Who builds this

**Claude Code.** Cursor builds PLOS (in `../plos-frontend` and `../plos-backend`). Splitting tools avoids merge conflicts and lets both products advance in parallel.

## First scaffold prompt (for Claude Code, Week 0 → 1)

```
Scaffold a Next.js 14 App Router app in /Volumes/DevSSD/dev/projects/ishank/plos/apps/web.
Use: TypeScript, Tailwind CSS, App Router (not Pages).
Configure Tailwind to consume tokens from @nis/brand-tokens.
Import @nis/brand-tokens/tokens.css in app/layout.tsx.
Set up:
  - app/layout.tsx with NIS fonts (Sora + Inter)
  - app/page.tsx with a hero placeholder + 4-pillar teaser per nis_code_plan_v1.md Week 1
  - app/trackers/page.tsx and app/trackers/[slug]/page.tsx
  - api routes for Razorpay order + verify + webhook + download
  - Supabase client (lib/supabase.ts) — server + browser
Read /Volumes/DevSSD/dev/claude/nis_code_plan_v1.md Week 1 acceptance criteria
before you start. Read CLAUDE.md at the repo root for conventions.
Don't touch ../plos-backend or ../plos-frontend.
```

## After scaffolding

Day-to-day Claude Code prompts follow the week-by-week plan in `nis_code_plan_v1.md`. Each week has a copy-paste Cursor/Claude Code prompt under "Cursor prompt:" — use those.

## Boundaries

- This app **may** import from `@nis/brand-tokens`, `@nis/ui`, `@nis/razorpay-sdk`.
- This app **may not** import from `../plos-backend` or `../plos-frontend`.
- PLOS may not import from here either. They communicate via HTTP only (e.g. waitlist form posts to PLOS API, marketing page deep-links to `app.thenispace.com`).

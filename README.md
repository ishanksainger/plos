# thenispace / PLOS monorepo

**Personal Life Operating System (PLOS)** — NestJS API + React app for responsibilities, people, habits, timeline, and dashboard.

This folder also holds scaffolding for the **NIS brand site** (`apps/web/`) and shared **design tokens** (`packages/brand-tokens/`).

## Quick start

```bash
npm install          # root (concurrently)
npm run dev          # PLOS backend :3001 + frontend :5173
```

**Not sure what to do?** → [`START_HERE.md`](./START_HERE.md)

**Day-to-day manual** → [`SETUP.md`](./SETUP.md)

**Product & roadmap** → [`docs/PLOS_PROJECT_OVERVIEW.md`](./docs/PLOS_PROJECT_OVERVIEW.md)

## Layout

| Path | What |
|------|------|
| `plos-backend/` | PLOS API (NestJS, Prisma, Postgres) |
| `plos-frontend/` | PLOS web app (Vite, React, Mantine) |
| `apps/web/` | NIS marketing site (scaffold later) |
| `packages/brand-tokens/` | Shared brand colors / CSS variables |
| `docs/` | Product context and roadmaps |

## AI conventions

- **Cursor** → PLOS only (`plos-backend/`, `plos-frontend/`) — reads `.cursorrules`
- **Claude Code** → NIS site (`apps/web/`) — reads `CLAUDE.md`

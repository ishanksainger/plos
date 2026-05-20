# @nis/ui

Shared UI primitives consumed by both `apps/web` (Next.js) and `plos-frontend` (Vite). Built on Radix UI primitives + Tailwind classes that reference `@nis/brand-tokens`.

## What lives here

Only **brand-critical, cross-app primitives**:
- `Button` — primary, secondary, ghost, danger variants
- `Card` — base card with NIS shadow + border + radius
- `Badge` — pillar tags (tracker/canvas/shop/plos) + status pills
- `Container` — max-width responsive wrapper

App-specific components (e.g. CartDrawer in apps/web, TodayBucket in plos-frontend) live in their own app, NOT here.

## Who owns this

Ishank owns the API. Cursor and Claude Code can propose changes via PR; Ishank reviews.

**Rule of thumb:** if you find yourself copying the same component into two apps, lift it here.

## To be built

This is currently a stub. First implementation happens in Week 0 of `nis_code_plan_v1.md`. Cursor or Claude Code: when you build `Button`, use Radix Slot for `asChild` support and consume tokens via Tailwind classes (`bg-accent-electric`, `text-fg-onAccent`, etc).

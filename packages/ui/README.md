# @nis/ui — Shared UI primitives

Small, themed-by-default components used by both `apps/web` (Next.js + Tailwind)
and `plos-frontend` (Vite + Mantine). Visual identity comes from CSS variables
exposed by `@nis/brand-tokens`, so a `<Button>` renders correctly in NIS's
dark editorial shell and in PLOS's light glass shell without any consumer
code knowing the difference.

## Consume it

```ts
// In your app entry once:
import '@nis/ui/ui.css';

// Anywhere:
import { Button, Card, Badge } from '@nis/ui';
```

Both apps already wire `ui.css`:

| App | Where |
|---|---|
| `apps/web` | `app/globals.css` (`@import '@nis/ui/ui.css'`) |
| `plos-frontend` | `src/main.tsx` (`import '@nis/ui/ui.css'`) |

## Components

### `<Button>`

```tsx
<Button variant="primary" size="md" leftIcon={<Plus />}>Add person</Button>
<Button variant="secondary" loading>Saving…</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger" onClick={remove}>Delete</Button>
```

Props: `variant` (`primary | secondary | ghost | danger`), `size` (`sm | md | lg`),
`leftIcon`, `rightIcon`, `loading`, `fullWidth`, plus every native button prop.

### `<Card>`

```tsx
<Card variant="glass" padding="lg">…</Card>
<Card variant="solid" interactive onClick={open}>…</Card>
<Card as="article" variant="outline">…</Card>
```

Props: `variant` (`solid | glass | outline`), `padding` (`none | sm | md | lg`),
`interactive`, `as`. Use `glass` inside PLOS to match the existing module
shells; `solid` is the default NIS dark surface.

### `<Badge>`

```tsx
<Badge tone="accent">New</Badge>
<Badge tone="warning" dot>Due soon</Badge>
<Badge tone="danger" size="md">Overdue</Badge>
```

Props: `tone` (`neutral | accent | info | success | warning | danger`),
`size` (`sm | md`), `dot`.

## Adding a new primitive

1. Create `src/Foo.tsx` exporting a `forwardRef`-wrapped component with a
   sensible API and CSS classes prefixed `nis-ui-foo`.
2. Add the styles to `src/ui.css` using `--nis-*` / `--plos-*` vars from
   `@nis/brand-tokens` — never hardcode hex.
3. Re-export from `src/index.ts`.
4. Document in this README.

## Why CSS, not Tailwind?

PLOS uses Mantine + plain CSS; NIS uses Tailwind. Authoring components in
plain CSS keeps the package framework-agnostic and avoids dragging a
Tailwind preset into every consumer.

## Browsing the components

```bash
npm run stories --workspace=@nis/ui
```

Opens a Ladle dev server (~http://localhost:61000) with every story
under `src/stories/*.stories.tsx`. Toggle the "Background" control in
the right rail to preview against NIS dark vs PLOS glass.

To build a static snapshot:

```bash
npm run stories:build --workspace=@nis/ui
```

## Ownership

Ishank reviews PRs that change the public API. Either AI (Claude Code or
Cursor) may add new primitives via PR — start by lifting something that's
duplicated between the two apps.

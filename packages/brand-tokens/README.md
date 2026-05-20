# @nis/brand-tokens

The single source of truth for NIS visual design — colors, fonts, spacing, shadows, motion.

## Who owns this

**Nikita owns this file.** Ishank merges changes. AI tools (Cursor, Claude Code) **must not** change values here without explicit human approval.

## How to use

### In Tailwind (apps/web)

In `apps/web/tailwind.config.ts`:

```typescript
import { tokens } from '@nis/brand-tokens';

export default {
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fonts,
      borderRadius: tokens.radius,
      spacing: tokens.spacing,
      boxShadow: tokens.shadows,
    },
  },
};
```

In `apps/web/app/layout.tsx`, import the CSS variables:

```typescript
import '@nis/brand-tokens/tokens.css';
```

### In Mantine (plos-frontend)

In `plos-frontend/src/theme/brand.ts`:

```typescript
import { tokens } from '@nis/brand-tokens';
import { createTheme, type MantineThemeOverride } from '@mantine/core';

export const nisTheme: MantineThemeOverride = createTheme({
  fontFamily: tokens.fonts.body,
  headings: { fontFamily: tokens.fonts.display },
  primaryColor: 'electric',
  colors: {
    electric: ['#f5f3ff','#ede9fe','#ddd6fe','#c4b5fd','#a78bfa',
               '#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95'],
  },
  defaultRadius: 'md',
});
```

## What to do when a token changes

1. Nikita updates `tokens.ts` AND `tokens.css` (keep them in sync).
2. Commits to a branch named `tokens/<change>`.
3. PR review — Ishank checks both apps still render correctly.
4. Merge.
5. Both `apps/web` and `plos-frontend` automatically pick up the change on next build.

## Future: codegen

When this gets larger, generate `tokens.css` from `tokens.ts` so they can't drift. Today they're hand-synced (only ~10 lines each, low risk).

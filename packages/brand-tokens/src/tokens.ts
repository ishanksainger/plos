/**
 * NIS Brand Tokens — single source of truth.
 *
 * Consumed by:
 *   - apps/web (Next.js + Tailwind) via tokens.css
 *   - plos-frontend (Vite + Mantine) via this TS object
 *
 * Rule: Nikita owns this file. AI coding tools must not change values
 * without explicit approval (see CLAUDE.md and .cursorrules at repo root).
 */

export const tokens = {
  colors: {
    bg: {
      primary: '#0a0a0a',
      secondary: '#141414',
      card: '#1c1c1c',
      cardHover: '#242424',
    },
    fg: {
      primary: '#fafafa',
      secondary: '#a3a3a3',
      muted: '#525252',
      onAccent: '#ffffff',
    },
    accent: {
      electric: '#7c3aed',  // primary purple (PLOS brand color)
      blue: '#3b82f6',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
    },
    // Per-pillar tints. Used as the small color accent on cards/badges
    // so a user always knows which of the 4 NIS pillars they're looking at.
    pillar: {
      tracker: '#3b82f6',  // blue
      canvas:  '#ec4899',  // pink/magenta
      shop:    '#10b981',  // green
      plos:    '#7c3aed',  // electric purple
    },
    border: {
      subtle: 'rgba(255,255,255,0.06)',
      default: 'rgba(255,255,255,0.12)',
      strong: 'rgba(255,255,255,0.24)',
    },
  },

  fonts: {
    display: 'Sora, system-ui, -apple-system, sans-serif',
    body:    'Inter, system-ui, -apple-system, sans-serif',
    mono:    'JetBrains Mono, ui-monospace, monospace',
  },

  fontSize: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl':'1.5rem',    // 24px
    '3xl':'1.875rem',  // 30px
    '4xl':'2.25rem',   // 36px
    '5xl':'3rem',      // 48px
    '6xl':'3.75rem',   // 60px
  },

  radius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
    xl: '28px',
    full: '9999px',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
    '2xl': '64px',
    '3xl': '96px',
  },

  shadows: {
    sm:   '0 1px 2px rgba(0,0,0,0.4)',
    md:   '0 4px 12px rgba(0,0,0,0.5)',
    lg:   '0 12px 40px rgba(0,0,0,0.6)',
    glow: '0 0 32px rgba(124,58,237,0.4)',
  },

  motion: {
    fast:   '120ms',
    normal: '200ms',
    slow:   '320ms',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',  // smooth ease-out
  },
} as const;

export type Tokens = typeof tokens;
export default tokens;

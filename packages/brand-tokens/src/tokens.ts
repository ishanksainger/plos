/**
 * NIS Brand Tokens — single source of truth.
 *
 * Consumed by:
 *   - apps/web (Next.js + Tailwind) via tokens.css
 *   - plos-frontend (Vite + Mantine) via this TS object
 *
 * Updated 2026-05-22 to reflect the editorial / glassy prototype direction.
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
      electric: '#7c3aed',
      blue: '#3b82f6',
      pink: '#ec4899',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
    },
    pillar: {
      tracker: '#3b82f6',
      canvas:  '#ec4899',
      shop:    '#10b981',
      plos:    '#7c3aed',
    },
    border: {
      subtle: 'rgba(255,255,255,0.06)',
      default: 'rgba(255,255,255,0.12)',
      strong: 'rgba(255,255,255,0.24)',
    },
    plos: {
      bgBase: '#faf7ff',
      bgDeep: '#ede7f7',
      glassBg: 'rgba(255, 255, 255, 0.62)',
      glassBgStrong: 'rgba(255, 255, 255, 0.85)',
      glassBorder: 'rgba(124, 58, 237, 0.10)',
      ink1: '#1a0f37',
      ink2: '#4a3a78',
      ink3: '#7c6ea8',
      ink4: '#a89cca',
      rule: 'rgba(124, 58, 237, 0.10)',
      accent: '#7c3aed',
      accentSoft: 'rgba(124, 58, 237, 0.12)',
      accentStrong: '#6d28d9',
    },
  },

  fonts: {
    display: '"Sora", system-ui, -apple-system, sans-serif',
    serif:   '"Instrument Serif", "Times New Roman", serif',
    body:    '"Geist", "Inter", system-ui, -apple-system, sans-serif',
    mono:    '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
  },

  fontSize: {
    xs:   '0.75rem',
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl':'1.5rem',
    '3xl':'1.875rem',
    '4xl':'2.25rem',
    '5xl':'3rem',
    '6xl':'3.75rem',
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
    plosGlass: '0 12px 40px -16px rgba(58, 31, 110, 0.18), 0 1px 0 rgba(255,255,255,0.6) inset',
  },

  motion: {
    fast:   '120ms',
    normal: '200ms',
    slow:   '320ms',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type Tokens = typeof tokens;
export default tokens;

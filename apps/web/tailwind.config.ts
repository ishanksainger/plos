import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--nis-bg-primary)',
          secondary: 'var(--nis-bg-secondary)',
          card: 'var(--nis-bg-card)',
          'card-hover': 'var(--nis-bg-card-hover)',
        },
        fg: {
          primary: 'var(--nis-fg-primary)',
          secondary: 'var(--nis-fg-secondary)',
          muted: 'var(--nis-fg-muted)',
          'on-accent': 'var(--nis-fg-on-accent)',
        },
        accent: {
          electric: 'var(--nis-accent-electric)',
          blue: 'var(--nis-accent-blue)',
          success: 'var(--nis-accent-success)',
          danger: 'var(--nis-accent-danger)',
          warning: 'var(--nis-accent-warning)',
        },
        pillar: {
          tracker: 'var(--nis-pillar-tracker)',
          canvas: 'var(--nis-pillar-canvas)',
          shop: 'var(--nis-pillar-shop)',
          plos: 'var(--nis-pillar-plos)',
        },
        border: {
          subtle: 'var(--nis-border-subtle)',
          DEFAULT: 'var(--nis-border-default)',
          strong: 'var(--nis-border-strong)',
        },
      },
      fontFamily: {
        display: 'var(--nis-font-display)',
        body: 'var(--nis-font-body)',
        mono: 'var(--nis-font-mono)',
      },
      borderRadius: {
        sm: 'var(--nis-radius-sm)',
        md: 'var(--nis-radius-md)',
        lg: 'var(--nis-radius-lg)',
        xl: 'var(--nis-radius-xl)',
      },
      boxShadow: {
        sm: 'var(--nis-shadow-sm)',
        md: 'var(--nis-shadow-md)',
        lg: 'var(--nis-shadow-lg)',
        glow: 'var(--nis-shadow-glow)',
      },
      transitionTimingFunction: {
        smooth: 'var(--nis-easing-smooth)',
      },
      transitionDuration: {
        fast: '120ms',
        normal: '200ms',
        slow: '320ms',
      },
    },
  },
  plugins: [],
};

export default config;

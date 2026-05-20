/**
 * App palette — aligned with `styles/tokens.css` (deep purple PLOS theme).
 */
export interface Palette {
  bg: string;
  surface: string;
  elev: string;
  border: string;
  border2: string;
  text1: string;
  text2: string;
  text3: string;

  accent: string;
  brand: string;
  red: string;
  orange: string;
  green: string;
  purple: string;
  pink: string;
  navy: string;

  accentBg: string;
  redBg: string;
  orangeBg: string;
  greenBg: string;
  purpleBg: string;

  hoverBg: string;
  scheme: 'light';
}

export const PL_PALETTE: Palette = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  elev: '#F7F5FC',
  border: '#EAE6F4',
  border2: '#E5E1EF',
  text1: '#111827',
  text2: '#4B5563',
  text3: '#64748B',

  accent: '#7C4FFF',
  brand: '#7C4FFF',
  red: '#DC2626',
  orange: '#B45309',
  green: '#15803D',
  purple: '#7C4FFF',
  pink: '#BE185D',
  navy: '#3949AB',

  accentBg: 'rgba(124, 79, 255, 0.12)',
  redBg: 'rgba(220, 38, 38, 0.1)',
  orangeBg: 'rgba(180, 83, 9, 0.11)',
  greenBg: 'rgba(21, 128, 61, 0.11)',
  purpleBg: 'rgba(124, 79, 255, 0.12)',

  hoverBg: 'rgba(17, 24, 39, 0.035)',
  scheme: 'light',
};

/** Module heroes — lilac wash */
export const MODULE_HERO_BG =
  'linear-gradient(145deg, #faf8ff 0%, #f3effa 50%, #ede7f6 100%)';

export const MODULE_ACCENT_HEX = '#5e35b1';
export const MODULE_BAND_GRADIENT = '#5e35b1';

export const PLOS_SHADOW_CARD =
  '0 1px 0 rgba(17, 24, 39, 0.04), 0 16px 40px rgba(57, 73, 171, 0.09)';

export const heroVignetteLayer = (): string =>
  [
    'radial-gradient(ellipse 120% 100% at 50% 52%, rgba(255,255,255,0.82) 0%,',
    'rgba(248,246,255,0.95) 45%, rgba(237,231,246,0.92) 100%)',
  ].join(' ');

export const heroVignetteMask =
  'radial-gradient(ellipse 66% 92% at 50% 50%, transparent 0%, transparent 36%, black 56%, black 100%)';

export const useDS = (): Palette => PL_PALETTE;

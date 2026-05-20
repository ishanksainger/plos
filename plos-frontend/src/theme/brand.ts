/**
 * Mantine theme values aligned with `packages/brand-tokens` (NIS electric purple).
 * PLOS uses a light workspace shell; accent maps to brand-tokens `accent.electric`.
 */
export const BRAND = {
  accent: '#7c3aed',
  accentLight: '#9b6bff',
  accentDeep: '#5e35b1',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontDisplay: '"Sora", "Inter", system-ui, sans-serif',
} as const;

/** Mantine `colors.violet` scale anchored on brand purple. */
export const BRAND_VIOLET_SCALE = [
  '#faf8ff',
  '#f3edfa',
  '#e8ddf5',
  '#d8c8ec',
  '#c4b0e8',
  '#b39ddb',
  '#9b6bff',
  '#7c3aed',
  '#6d28d9',
  '#5e35b1',
] as const;

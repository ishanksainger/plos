/** Loose E.164-ish phone validation for optional notification numbers. */
export const PHONE_PATTERN = /^\+?[\d\s\-()]{8,20}$/;

/**
 * Trims and normalizes an optional phone string; empty input becomes undefined.
 *
 * @param value Raw phone from the client.
 */
export function normalizeOptionalPhone(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

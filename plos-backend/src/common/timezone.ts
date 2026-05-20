/**
 * Calendar day key (YYYY-MM-DD) for an instant in an IANA timezone.
 */
export function dayKeyInTimezone(timeZone: string, instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/**
 * Adds calendar days to an ISO date key (YYYY-MM-DD).
 */
export function addDaysToDayKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Resolves a valid IANA timezone or falls back to Asia/Kolkata.
 */
export function resolveTimezone(tz?: string | null): string {
  const candidate = tz?.trim();
  if (!candidate) return 'Asia/Kolkata';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: candidate });
    return candidate;
  } catch {
    return 'Asia/Kolkata';
  }
}

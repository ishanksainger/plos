/**
 * Calendar day key in the server's local timezone (aligned with `computeState` day logic).
 */
export function localDayKey(d: Date): string {
  const x = new Date(d.getTime());
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/**
 * Counts consecutive calendar days with at least one completion, walking backward from
 * **today** if today has activity, otherwise from **yesterday** (standard “don’t break
 * the streak until you miss a day” behaviour).
 */
export function computeStreakFromCompletionDays(completionDays: Set<string>, todayStart: Date): number {
  const todayKey = localDayKey(todayStart);
  const y = new Date(todayStart);
  y.setDate(y.getDate() - 1);
  const yesterdayKey = localDayKey(y);

  let cursor = new Date(todayStart);
  if (!completionDays.has(todayKey)) {
    if (!completionDays.has(yesterdayKey)) return 0;
    cursor = new Date(y);
  }

  let streak = 0;
  for (;;) {
    const k = localDayKey(cursor);
    if (!completionDays.has(k)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

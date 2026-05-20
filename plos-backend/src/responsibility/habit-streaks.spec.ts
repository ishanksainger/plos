import { computeStreakFromCompletionDays, localDayKey } from './habit-streaks';

describe('habit streaks', () => {
  it('localDayKey formats YYYY-MM-DD', () => {
    const d = new Date(2026, 4, 9, 15, 30, 0);
    expect(localDayKey(d)).toBe('2026-05-09');
  });

  it('returns 0 when last activity was before yesterday', () => {
    const today = new Date(2026, 4, 11);
    today.setHours(0, 0, 0, 0);
    expect(computeStreakFromCompletionDays(new Set(['2026-05-08']), today)).toBe(0);
  });

  it('counts consecutive days from today when today is included', () => {
    const today = new Date(2026, 4, 11);
    today.setHours(0, 0, 0, 0);
    const d1 = new Date(today);
    const d2 = new Date(today);
    d2.setDate(d2.getDate() - 1);
    const d3 = new Date(today);
    d3.setDate(d3.getDate() - 2);
    const set = new Set([localDayKey(d1), localDayKey(d2), localDayKey(d3)]);
    expect(computeStreakFromCompletionDays(set, today)).toBe(3);
  });

  it('allows streak from yesterday when today is empty', () => {
    const today = new Date(2026, 4, 11);
    today.setHours(0, 0, 0, 0);
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    const yy = new Date(y);
    yy.setDate(yy.getDate() - 1);
    const set = new Set([localDayKey(y), localDayKey(yy)]);
    expect(computeStreakFromCompletionDays(set, today)).toBe(2);
  });
});

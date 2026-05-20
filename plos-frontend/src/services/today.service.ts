import { api } from './api';
import type { TodayData } from '../types/today';

/**
 * Fetches the Today home payload for the authenticated user.
 */
export function getToday(tz?: string) {
  const qs = tz ? `?tz=${encodeURIComponent(tz)}` : '';
  return api.get<TodayData>(`/users/today${qs}`);
}

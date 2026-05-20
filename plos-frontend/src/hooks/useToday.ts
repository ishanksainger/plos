import { useQuery } from '@tanstack/react-query';
import { getToday } from '../services/today.service';
import { useAppSelector } from '../store/hooks';

/**
 * React Query hook for `GET /users/today` (uses saved user timezone when available).
 */
export function useToday() {
  const user = useAppSelector((s) => s.auth.user);
  const tz = user?.timezone;

  return useQuery({
    queryKey: ['today', user?.id ?? 'anon', tz ?? 'default'],
    queryFn: () => getToday(tz),
    enabled: Boolean(user?.id),
    staleTime: 20_000,
  });
}

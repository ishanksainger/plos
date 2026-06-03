import { useQuery } from '@tanstack/react-query';
import { getBillingStatus, type BillingStatus } from '../services/billing.service';
import { useAppSelector } from '../store/hooks';

/**
 * React Query hook for `GET /billing/me` — the caller's effective plan, limits,
 * pricing, and whether billing is live. While billing is dormant the backend
 * returns `tier: 'founding'` with unlimited limits, so the whole upgrade surface
 * (pricing CTA, Pro badge, limit modal) naturally stays hidden.
 */
export function usePlan() {
  const user = useAppSelector((s) => s.auth.user);

  const query = useQuery<BillingStatus>({
    queryKey: ['billing', user?.id ?? 'anon'],
    queryFn: getBillingStatus,
    enabled: Boolean(user?.id),
    staleTime: 5 * 60_000,
  });

  const status = query.data;
  const tier = status?.tier ?? 'founding';

  return {
    ...query,
    status,
    tier,
    limits: status?.limits,
    pricing: status?.pricing,
    billingEnabled: status?.billingEnabled ?? false,
    /** True only when billing is live AND the user is on the free tier. */
    isFreeTier: Boolean(status?.billingEnabled) && tier === 'free',
    /** True when the user pays / would-be-paid features are unlocked. */
    isPaid: tier === 'pro' || tier === 'family' || tier === 'founding',
  };
}

import { api } from './api';

export type PlanTier = 'free' | 'pro' | 'family' | 'founding';
export type WhatsappLevel = 'none' | 'critical' | 'all';

export type PlanLimits = {
  /** null = unlimited */
  maxPeople: number | null;
  maxResponsibilities: number | null;
  maxImports: number | null;
  whatsapp: WhatsappLevel;
};

export type PlanPricing = {
  pro: { monthlyPaise: number; yearlyPaise: number };
  family: { monthlyPaise: number; yearlyPaise: number };
};

/** Mirror of `GET /billing/me`. See plos-backend BillingService.getStatus. */
export type BillingStatus = {
  /** false while billing is dormant — everyone is treated as `founding`. */
  billingEnabled: boolean;
  tier: PlanTier;
  limits: PlanLimits;
  pricing: PlanPricing;
};

export type SubscribeResult = {
  enabled: boolean;
  founding?: boolean;
  message: string;
};

export function getBillingStatus(): Promise<BillingStatus> {
  return api.get<BillingStatus>('/billing/me');
}

export function subscribe(
  plan: 'pro' | 'family',
  cycle: 'monthly' | 'yearly',
): Promise<SubscribeResult> {
  return api.post<SubscribeResult>('/billing/subscribe', { plan, cycle });
}

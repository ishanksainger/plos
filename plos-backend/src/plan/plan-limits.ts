/**
 * PLOS plan limits + the global billing activation switch.
 *
 * STRATEGY — "build it all now, ship it dormant, flip it on at ~100 users":
 * While BILLING_ENABLED is false (the default), every limit is unlimited and
 * every user is treated as Pro — so nothing is gated and a sudden influx of
 * users can't hit a half-built paywall. The day you decide to charge you set
 * BILLING_ENABLED=true + BILLING_ACTIVATED_AT=<date> (and create the Razorpay
 * plans). From then, NEW free users get the limits below; everyone who joined
 * during the free phase is grandfathered to `founding` (Pro free for life) so
 * no existing user is ever suddenly walled. No code change, just config.
 *
 * Prices are in PAISE (₹1 = 100 paise). Canonical source: docs/plos-pricing-tiers.md.
 */

export type PlanTier = 'free' | 'pro' | 'family' | 'founding';

export type WhatsappLevel = 'none' | 'critical' | 'all';

export type PlanLimits = {
  /** null = unlimited */
  maxPeople: number | null;
  maxResponsibilities: number | null;
  maxImports: number | null;
  /** 'critical' = only deadline-≤24h messages; 'all' = digests + nudges too. */
  whatsapp: WhatsappLevel;
};

export const UNLIMITED = null;

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { maxPeople: 3, maxResponsibilities: 50, maxImports: 1, whatsapp: 'critical' },
  pro: { maxPeople: UNLIMITED, maxResponsibilities: UNLIMITED, maxImports: UNLIMITED, whatsapp: 'all' },
  family: { maxPeople: UNLIMITED, maxResponsibilities: UNLIMITED, maxImports: UNLIMITED, whatsapp: 'all' },
  // Founding = early users, kept on Pro-equivalent access for free, forever.
  founding: { maxPeople: UNLIMITED, maxResponsibilities: UNLIMITED, maxImports: UNLIMITED, whatsapp: 'all' },
};

/** Pricing in paise. Annual ≈ 20% off. Mirrors docs/plos-pricing-tiers.md. */
export const PLAN_PRICING = {
  pro: { monthlyPaise: 29900, yearlyPaise: 287000 },
  family: { monthlyPaise: 49900, yearlyPaise: 479000 },
} as const;

/**
 * Master switch. While false: no gating, no checkout, everyone is Pro-equivalent.
 * Flip to true (env: BILLING_ENABLED=true) only after retention is proven.
 */
export function isBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === 'true';
}

/**
 * Users created on/before this timestamp are grandfathered to `founding` when
 * billing flips on. Set BILLING_ACTIVATED_AT to an ISO date at activation.
 */
export function billingActivatedAt(): Date | null {
  const v = process.env.BILLING_ACTIVATED_AT;
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

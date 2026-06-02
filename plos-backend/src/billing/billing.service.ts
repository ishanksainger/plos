import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PlanService } from 'src/plan/plan.service';
import { PLAN_PRICING, isBillingEnabled } from 'src/plan/plan-limits';
import { SubscribeDto } from './dto/subscribe.dto';

/**
 * Billing surface. Fully functional while DORMANT: /me reports the user's
 * effective plan + limits + whether billing is live; /subscribe explains the
 * founding-member free access. The Razorpay Subscriptions wiring is added at
 * activation (see docs/plos-pricing-tiers.md runbook) — until then there is no
 * checkout to break.
 */
@Injectable()
export class BillingService {
  constructor(private readonly plan: PlanService) {}

  async getStatus(userId: number) {
    const [tier, limits] = await Promise.all([
      this.plan.effectiveTier(userId),
      this.plan.limitsFor(userId),
    ]);
    return {
      billingEnabled: isBillingEnabled(),
      tier,
      limits,
      pricing: PLAN_PRICING,
    };
  }

  async subscribe(userId: number, _dto: SubscribeDto) {
    if (!isBillingEnabled()) {
      return {
        enabled: false,
        founding: true,
        message:
          "PLOS is free during early access — you're a founding member, so Pro is on us. We'll never charge you retroactively.",
      };
    }
    // Billing is ON but the Razorpay Subscriptions integration lands at the
    // activation step (plan IDs created in the dashboard + SDK helper). Until
    // that ships, fail loud rather than pretend to charge.
    throw new ServiceUnavailableException({
      code: 'BILLING_NOT_CONFIGURED',
      message: 'Checkout is being set up. Please try again shortly.',
    });
  }
}

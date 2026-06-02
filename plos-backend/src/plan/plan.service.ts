import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PLAN_LIMITS,
  type PlanTier,
  type PlanLimits,
  type WhatsappLevel,
  isBillingEnabled,
} from './plan-limits';

/**
 * Resolves a user's effective plan + enforces limits. Designed to be wired in
 * everywhere NOW but stay DORMANT until `BILLING_ENABLED=true` — see
 * plan-limits.ts for the strategy.
 */
@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The tier we treat this user as.
   * - Billing OFF  → everyone is `founding` (unlimited; nothing is gated).
   * - Billing ON   → their real subscription tier (defaulting to `free`).
   */
  async effectiveTier(userId: number): Promise<PlanTier> {
    if (!isBillingEnabled()) return 'founding';
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return (sub?.tier as PlanTier) ?? 'free';
  }

  async limitsFor(userId: number): Promise<PlanLimits> {
    return PLAN_LIMITS[await this.effectiveTier(userId)];
  }

  async whatsappLevel(userId: number): Promise<WhatsappLevel> {
    return (await this.limitsFor(userId)).whatsapp;
  }

  /**
   * Dormant-safe guard — call before creating a People / Responsibility / import
   * row. It's a no-op while billing is off (limits are unlimited), so wiring it
   * in today is harmless; it only starts blocking the day billing flips on.
   * Throws 403 PLAN_LIMIT_REACHED that the frontend maps to the upgrade modal.
   */
  async assertCanCreate(
    userId: number,
    resource: 'people' | 'responsibilities' | 'imports',
    currentCount: number,
  ): Promise<void> {
    const limits = await this.limitsFor(userId);
    const max =
      resource === 'people'
        ? limits.maxPeople
        : resource === 'responsibilities'
          ? limits.maxResponsibilities
          : limits.maxImports;

    if (max !== null && currentCount >= max) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_REACHED',
        resource,
        limit: max,
        message: `You've reached the free-plan limit of ${max} ${resource}. Upgrade to Pro for unlimited.`,
      });
    }
  }

  /**
   * One-shot, run at activation: grandfather everyone who joined on/before
   * `cutoff` to `founding` (Pro free for life) so flipping billing on never
   * walls an existing user. Idempotent — only touches rows still on `free`.
   * Returns the number of subscriptions upgraded.
   */
  async grandfatherExistingUsers(cutoff: Date): Promise<number> {
    const res = await this.prisma.subscription.updateMany({
      where: {
        tier: 'free',
        user: { is: { createdAt: { lte: cutoff } } },
      },
      data: { tier: 'founding' },
    });
    return res.count;
  }
}

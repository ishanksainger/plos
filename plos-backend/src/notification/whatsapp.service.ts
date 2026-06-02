import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlanService } from 'src/plan/plan.service';

/**
 * Provider-agnostic WhatsApp dispatch (Step J).
 *
 * Deliberately NOT tied to any one BSP — set `WHATSAPP_PROVIDER` to `meta`
 * (Meta Cloud API direct — cheapest, no monthly fee) or `aisensy` (or add
 * another adapter). With no provider configured it logs and no-ops, so this is
 * wired in now and costs ₹0 until you flip it on at activation.
 *
 * Gating is enforced here, in one place:
 *   1. user has a phone + opted in (`notificationPrefs.whatsappOptIn`)
 *   2. plan allows the message category (free = `critical` only; pro/family = all)
 *      via PlanService — which itself is dormant until BILLING_ENABLED.
 */

export type WhatsappCategory = 'critical' | 'standard';

type DispatchResult = { sent: boolean; reason?: string };

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly provider = (process.env.WHATSAPP_PROVIDER ?? 'none').toLowerCase();

  constructor(
    private readonly prisma: PrismaService,
    private readonly plan: PlanService,
  ) {}

  private get configured(): boolean {
    if (this.provider === 'meta') {
      return Boolean(process.env.WHATSAPP_META_TOKEN && process.env.WHATSAPP_META_PHONE_ID);
    }
    if (this.provider === 'aisensy') {
      return Boolean(process.env.WHATSAPP_AISENSY_API_KEY);
    }
    return false;
  }

  /**
   * Plan- and opt-in-aware send. Always safe to call. Returns what happened so
   * callers can fall back to email/in-app. Never throws.
   */
  async dispatchToUser(
    userId: number,
    msg: {
      category: WhatsappCategory;
      /** Pre-approved WhatsApp template name (BSP/Meta). */
      templateName: string;
      /** Values that fill the template's {{1}}, {{2}}… body variables. */
      bodyParams: string[];
      /** Plain-text version, for the dormant log + any fallback channel. */
      preview: string;
    },
  ): Promise<DispatchResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, notificationPrefs: { select: { whatsappOptIn: true } } },
    });

    if (!user?.phone) return { sent: false, reason: 'no_phone' };
    if (!user.notificationPrefs?.whatsappOptIn) return { sent: false, reason: 'not_opted_in' };

    const level = await this.plan.whatsappLevel(userId); // 'none' | 'critical' | 'all'
    if (level === 'none') return { sent: false, reason: 'plan_none' };
    if (level === 'critical' && msg.category !== 'critical') {
      return { sent: false, reason: 'plan_critical_only' };
    }

    if (!this.configured) {
      this.logger.log(`[whatsapp dormant — no provider] would send to ${user.phone}: ${msg.preview}`);
      return { sent: false, reason: 'provider_not_configured' };
    }

    try {
      if (this.provider === 'meta') {
        await this.sendViaMeta(user.phone, msg.templateName, msg.bodyParams);
      } else if (this.provider === 'aisensy') {
        await this.sendViaAisensy(user.phone, msg.templateName, msg.bodyParams);
      }
      return { sent: true };
    } catch (err) {
      this.logger.error(`whatsapp send failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return { sent: false, reason: 'send_error' };
    }
  }

  private digits(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  /** Meta WhatsApp Cloud API — direct, no monthly platform fee. */
  private async sendViaMeta(phone: string, template: string, params: string[]): Promise<void> {
    const token = process.env.WHATSAPP_META_TOKEN as string;
    const phoneId = process.env.WHATSAPP_META_PHONE_ID as string;
    const lang = process.env.WHATSAPP_TEMPLATE_LANG ?? 'en';
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: this.digits(phone),
        type: 'template',
        template: {
          name: template,
          language: { code: lang },
          components: params.length
            ? [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: t })) }]
            : [],
        },
      }),
    });
    if (!res.ok) throw new Error(`Meta WA ${res.status}: ${await res.text()}`);
  }

  /** AiSensy (BSP) adapter — kept for convenience if you ever want their dashboard. */
  private async sendViaAisensy(phone: string, template: string, params: string[]): Promise<void> {
    const apiKey = process.env.WHATSAPP_AISENSY_API_KEY as string;
    const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        campaignName: template,
        destination: this.digits(phone),
        userName: 'PLOS',
        templateParams: params,
      }),
    });
    if (!res.ok) throw new Error(`AiSensy ${res.status}: ${await res.text()}`);
  }
}

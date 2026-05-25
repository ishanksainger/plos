import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * Transactional email via Resend. If RESEND_API_KEY is missing (dev,
 * staging without secrets), every send becomes a `logger.log` so the
 * developer can copy the reset / verify URL straight out of the server
 * log — same fallback pattern the apps/web /api/waitlist route uses.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly siteUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.RESEND_FROM_EMAIL ?? 'PLOS <notifications@thenispace.com>';
    this.siteUrl = (process.env.PLOS_APP_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
  }

  async sendPasswordReset(opts: { to: string; token: string; name?: string | null }) {
    const resetUrl = `${this.siteUrl}/reset-password?token=${encodeURIComponent(opts.token)}`;
    const subject = 'Reset your PLOS password';
    const html = passwordResetHtml({ resetUrl, name: opts.name ?? null });

    if (!this.resend) {
      this.logger.log(
        `[dev: no RESEND_API_KEY] password-reset link for ${opts.to}: ${resetUrl}`,
      );
      return;
    }

    try {
      await this.resend.emails.send({ from: this.from, to: opts.to, subject, html });
    } catch (err) {
      this.logger.error('Failed to send password reset email', err);
    }
  }

  async sendEmailVerification(opts: { to: string; token: string; name?: string | null }) {
    const verifyUrl = `${this.siteUrl}/verify-email?token=${encodeURIComponent(opts.token)}`;
    const subject = 'Verify your PLOS email';
    const html = verifyEmailHtml({ verifyUrl, name: opts.name ?? null });

    if (!this.resend) {
      this.logger.log(
        `[dev: no RESEND_API_KEY] email-verify link for ${opts.to}: ${verifyUrl}`,
      );
      return;
    }

    try {
      await this.resend.emails.send({ from: this.from, to: opts.to, subject, html });
    } catch (err) {
      this.logger.error('Failed to send verification email', err);
    }
  }
}

function passwordResetHtml({ resetUrl, name }: { resetUrl: string; name: string | null }): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  return `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;color:#0a0a0a;">
      <h1 style="font-size:22px;margin:0 0 16px;">Reset your password</h1>
      <p style="margin:0 0 16px;color:#525252;">${greeting}</p>
      <p style="margin:0 0 24px;color:#525252;">
        Someone asked to reset the password for your PLOS account. If that was you,
        click the button below — the link expires in 30 minutes and can only be used once.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:14px 24px;background:#7c3aed;color:#fff;
                text-decoration:none;border-radius:9999px;font-weight:500;">
        Reset password
      </a>
      <p style="margin:24px 0 0;color:#737373;font-size:13px;">
        Didn't request this? You can safely ignore this email — your password stays the same.
      </p>
    </div>
  `;
}

function verifyEmailHtml({ verifyUrl, name }: { verifyUrl: string; name: string | null }): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Welcome,';
  return `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;color:#0a0a0a;">
      <h1 style="font-size:22px;margin:0 0 16px;">Verify your email</h1>
      <p style="margin:0 0 16px;color:#525252;">${greeting}</p>
      <p style="margin:0 0 24px;color:#525252;">
        One quick step — verify your email so we can send you reminders and
        account-recovery links if you ever need them.
      </p>
      <a href="${verifyUrl}"
         style="display:inline-block;padding:14px 24px;background:#7c3aed;color:#fff;
                text-decoration:none;border-radius:9999px;font-weight:500;">
        Verify email
      </a>
      <p style="margin:24px 0 0;color:#737373;font-size:13px;">
        This link expires in 7 days. If it does, request a fresh one from Settings → Profile.
      </p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

import crypto from 'node:crypto';
import { Resend } from 'resend';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTracker, formatINR } from '@/lib/tracker-catalog';

const DOWNLOAD_EXPIRY_DAYS = 7;
const DOWNLOAD_MAX_USES = 5;

type FulfillmentInput = {
  productSlug: string;
  email: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
};

type FulfillmentResult = {
  fulfilled: boolean;
  orderItemId?: string;
  downloadUrl?: string;
};

/**
 * Best-effort fulfillment used by /api/razorpay/verify.
 * If Supabase isn't configured, we still email the buyer a generic
 * "we'll send your link shortly" so they don't think they paid into a void.
 */
export async function fulfillDigitalOrder(input: FulfillmentInput): Promise<FulfillmentResult> {
  const tracker = getTracker(input.productSlug);
  if (!tracker) throw new Error(`Unknown product: ${input.productSlug}`);

  if (!isSupabaseConfigured()) {
    await sendFallbackEmail(input.email, tracker.title);
    return { fulfilled: false };
  }

  return await persistAndEmail(input);
}

/**
 * Idempotent variant used by the webhook safety net. If the order has
 * already been fulfilled by /verify, this becomes a no-op.
 */
export async function fulfillDigitalOrderIdempotent(
  input: FulfillmentInput,
): Promise<FulfillmentResult> {
  if (!isSupabaseConfigured()) return { fulfilled: false };
  if (!input.productSlug || !input.email) return { fulfilled: false };

  const supabase = getServiceSupabase();
  const { data: existing } = await supabase
    .schema('commerce')
    .from('orders')
    .select('id, status')
    .eq('razorpay_order_id', input.razorpayOrderId)
    .maybeSingle();

  if (existing && existing.status === 'fulfilled') {
    return { fulfilled: true };
  }

  return await persistAndEmail(input);
}

async function persistAndEmail(input: FulfillmentInput): Promise<FulfillmentResult> {
  const tracker = getTracker(input.productSlug);
  if (!tracker) throw new Error(`Unknown product: ${input.productSlug}`);

  const supabase = getServiceSupabase();
  const now = new Date();

  // Insert order (or update if it already exists from a prior partial flow).
  const { data: order, error: orderErr } = await supabase
    .schema('commerce')
    .from('orders')
    .upsert(
      {
        email: input.email,
        total_paise: tracker.pricePaise,
        status: 'paid',
        razorpay_order_id: input.razorpayOrderId,
        razorpay_payment_id: input.razorpayPaymentId,
        paid_at: now.toISOString(),
      },
      { onConflict: 'razorpay_order_id' },
    )
    .select('id')
    .single();

  if (orderErr || !order) throw new Error(`Order persist failed: ${orderErr?.message ?? 'no row'}`);

  // Insert order item.
  const { data: item, error: itemErr } = await supabase
    .schema('commerce')
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: tracker.slug,
      quantity: 1,
      price_paise: tracker.pricePaise,
    })
    .select('id')
    .single();

  if (itemErr || !item) throw new Error(`Order item persist failed: ${itemErr?.message ?? 'no row'}`);

  // Generate download token (256 bits, base64url).
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + DOWNLOAD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const { error: tokenErr } = await supabase
    .schema('commerce')
    .from('download_tokens')
    .insert({
      token,
      order_item_id: item.id,
      expires_at: expiresAt.toISOString(),
      max_uses: DOWNLOAD_MAX_USES,
    });

  if (tokenErr) throw new Error(`Token persist failed: ${tokenErr.message}`);

  // Mark order fulfilled.
  await supabase
    .schema('commerce')
    .from('orders')
    .update({ status: 'fulfilled', fulfilled_at: now.toISOString() })
    .eq('id', order.id);

  const downloadUrl = `${publicSiteUrl()}/api/download?token=${encodeURIComponent(token)}`;

  await sendReceiptEmail({
    to: input.email,
    productTitle: tracker.title,
    pricePaise: tracker.pricePaise,
    downloadUrl,
    expiresAt,
    maxUses: DOWNLOAD_MAX_USES,
  });

  return { fulfilled: true, orderItemId: item.id, downloadUrl };
}

function publicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

async function sendReceiptEmail(opts: {
  to: string;
  productTitle: string;
  pricePaise: number;
  downloadUrl: string;
  expiresAt: Date;
  maxUses: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // dev mode: skip silently. /verify still returns success.

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? 'NIS <notifications@thenispace.com>';

  await resend.emails.send({
    from,
    to: opts.to,
    subject: `Your ${opts.productTitle} download is ready`,
    html: receiptHtml({
      productTitle: opts.productTitle,
      pricePaise: opts.pricePaise,
      downloadUrl: opts.downloadUrl,
      expiresAt: opts.expiresAt,
      maxUses: opts.maxUses,
    }),
  });
}

async function sendFallbackEmail(to: string, productTitle: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? 'NIS <notifications@thenispace.com>';
  await resend.emails.send({
    from,
    to,
    subject: `Order received: ${productTitle}`,
    html: `<p>Thanks for buying <strong>${escapeHtml(productTitle)}</strong>. We&rsquo;ll email your download link shortly.</p>`,
  });
}

function receiptHtml(opts: {
  productTitle: string;
  pricePaise: number;
  downloadUrl: string;
  expiresAt: Date;
  maxUses: number;
}): string {
  const expiresFmt = opts.expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">Your download is ready</h1>
      <p style="margin: 0 0 24px; color: #525252;">
        Thanks for buying <strong>${escapeHtml(opts.productTitle)}</strong>
        (${escapeHtml(formatINR(opts.pricePaise))}).
      </p>

      <a href="${opts.downloadUrl}"
         style="display: inline-block; padding: 14px 24px; background: #7c3aed; color: white;
                text-decoration: none; border-radius: 9999px; font-weight: 500;">
        Download ${escapeHtml(opts.productTitle)}
      </a>

      <p style="margin: 24px 0 8px; color: #525252; font-size: 14px;">
        Link expires <strong>${escapeHtml(expiresFmt)}</strong> · max ${opts.maxUses} downloads.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />

      <p style="font-size: 13px; color: #737373; margin: 0;">
        Questions? Just reply to this email. — NIS
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

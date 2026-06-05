import crypto from 'node:crypto';
import { Resend } from 'resend';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTracker, formatINR, type Tracker } from '@/lib/tracker-catalog';

const DOWNLOAD_EXPIRY_DAYS = 7;
const DOWNLOAD_MAX_USES = 5;

type FulfillmentInput = {
  productSlug: string;
  email: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  // Authoritative amount charged for the whole order (server-computed). For a
  // multi-item cart, fulfillment runs once per line and each call upserts the
  // same order row — so without this every call would overwrite total_paise
  // with its own line price, leaving the order showing the last line's price.
  // Pass the cart total here so the order records what was actually charged.
  // Omitted on the single-item path, where the line price IS the order total.
  orderTotalPaise?: number;
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

  if (tracker.kind === 'bundle') {
    return await persistAndEmailBundle(input, tracker);
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

  // Route bundles to the bundle path — otherwise a bundle fulfilled via the
  // webhook safety net (buyer closed the tab before /verify) would be treated
  // as a single product: a token for the bundle slug, which has no file.
  const tracker = getTracker(input.productSlug);
  if (tracker?.kind === 'bundle') {
    return await persistAndEmailBundle(input, tracker);
  }

  return await persistAndEmail(input);
}

/**
 * Operator action (admin dashboard): re-issue a download for one already-paid
 * order item. Mints a FRESH token (new 7-day expiry, uses reset) and re-sends
 * the receipt email — for buyers whose link expired or hit its use cap. Old
 * tokens stay valid until they expire; this just grants a new one.
 */
export async function resendDownloadForOrderItem(
  orderItemId: string,
): Promise<{ ok: boolean; email?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Supabase not configured' };
  if (!orderItemId) return { ok: false, error: 'Missing order item id' };

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .schema('commerce')
    .from('order_items')
    .select(
      `id, price_paise,
       product:products!inner ( title, storage_path ),
       order:orders!inner ( email )`,
    )
    .eq('id', orderItemId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: 'Order item not found' };

  const product = Array.isArray(data.product) ? data.product[0] : data.product;
  const order = Array.isArray(data.order) ? data.order[0] : data.order;
  if (!product?.storage_path) {
    return { ok: false, error: 'This line has no deliverable file (e.g. a bundle SKU row).' };
  }
  if (!order?.email) return { ok: false, error: 'No buyer email on the order' };

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + DOWNLOAD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const { error: tokenErr } = await supabase
    .schema('commerce')
    .from('download_tokens')
    .insert({
      token,
      order_item_id: orderItemId,
      expires_at: expiresAt.toISOString(),
      max_uses: DOWNLOAD_MAX_USES,
    });

  if (tokenErr) return { ok: false, error: `Token create failed: ${tokenErr.message}` };

  await sendReceiptEmail({
    to: order.email,
    productTitle: product.title as string,
    pricePaise: data.price_paise as number,
    downloadUrl: downloadLink(token),
    expiresAt,
    maxUses: DOWNLOAD_MAX_USES,
  });

  return { ok: true, email: order.email as string };
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
        total_paise: input.orderTotalPaise ?? tracker.pricePaise,
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

  // Idempotency guard: if this product is already a line on this order, it's
  // already been fulfilled — a retried/double-clicked /verify, or the webhook
  // safety net firing after /verify. Return the existing item instead of
  // minting a second download token and sending a second receipt email.
  // (This covers every realistic *sequential* duplicate. To also close the
  // millisecond verify+webhook overlap, add the unique(order_id,product_id)
  // constraint noted in supabase/schema.sql.)
  const { data: already } = await supabase
    .schema('commerce')
    .from('order_items')
    .select('id')
    .eq('order_id', order.id)
    .eq('product_id', tracker.slug)
    .maybeSingle();

  if (already) {
    return { fulfilled: true, orderItemId: already.id as string };
  }

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

  const downloadUrl = downloadLink(token);

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

async function persistAndEmailBundle(
  input: FulfillmentInput,
  bundle: Tracker,
): Promise<FulfillmentResult> {
  const supabase = getServiceSupabase();
  const now = new Date();

  // One order row covering the whole bundle.
  const { data: order, error: orderErr } = await supabase
    .schema('commerce')
    .from('orders')
    .upsert(
      {
        email: input.email,
        total_paise: input.orderTotalPaise ?? bundle.pricePaise,
        status: 'paid',
        razorpay_order_id: input.razorpayOrderId,
        razorpay_payment_id: input.razorpayPaymentId,
        paid_at: now.toISOString(),
      },
      { onConflict: 'razorpay_order_id' },
    )
    .select('id')
    .single();

  if (orderErr || !order) {
    throw new Error(`Bundle order persist failed: ${orderErr?.message ?? 'no row'}`);
  }

  // Idempotency guard: the bundle SKU line means "this bundle was fulfilled on
  // this order". If it's already present, this is a re-run (retried /verify or
  // the webhook safety net) — don't re-deliver components or send a second
  // bundle email.
  const { data: bundleAlready } = await supabase
    .schema('commerce')
    .from('order_items')
    .select('id')
    .eq('order_id', order.id)
    .eq('product_id', bundle.slug)
    .maybeSingle();

  if (bundleAlready) {
    return { fulfilled: true, orderItemId: order.id };
  }

  // Order item for the bundle SKU itself.
  await supabase
    .schema('commerce')
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: bundle.slug,
      quantity: 1,
      price_paise: bundle.pricePaise,
    });

  // For every component tracker that has a real storage_path (i.e., is
  // immediately deliverable), create an order_item + download token so the
  // buyer gets it now. Queued trackers are listed in the email and will be
  // delivered manually when they ship.
  const components = (bundle.components ?? [])
    .map((slug) => getTracker(slug))
    .filter((t): t is Tracker => Boolean(t));

  const deliverable: Array<{ tracker: Tracker; downloadUrl: string; expiresAt: Date }> = [];

  for (const tracker of components) {
    // Skip if the tracker isn't ready for purchase yet — keep the bundle row
    // recorded above; we'll deliver these manually when each ships.
    if (!tracker.active) continue;

    const { data: item, error: itemErr } = await supabase
      .schema('commerce')
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: tracker.slug,
        quantity: 1,
        price_paise: 0, // included in the bundle price
      })
      .select('id')
      .single();

    if (itemErr || !item) continue;

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

    if (tokenErr) continue;

    deliverable.push({
      tracker,
      downloadUrl: downloadLink(token),
      expiresAt,
    });
  }

  await supabase
    .schema('commerce')
    .from('orders')
    .update({ status: 'fulfilled', fulfilled_at: now.toISOString() })
    .eq('id', order.id);

  const queued = components.filter((t) => !t.active);

  await sendBundleEmail({
    to: input.email,
    bundle,
    deliverable,
    queued,
    maxUses: DOWNLOAD_MAX_USES,
  });

  return { fulfilled: true, orderItemId: order.id };
}

function publicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

/**
 * The link we email the buyer points at the /download landing PAGE, not the
 * /api/download route. The page is read-only, so when email link-scanners
 * prefetch it (Gmail / Outlook SafeLinks / Mimecast) they don't spend any of
 * the buyer's downloads. The use is only counted when a human clicks through.
 */
function downloadLink(token: string): string {
  return `${publicSiteUrl()}/download?token=${encodeURIComponent(token)}`;
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

async function sendBundleEmail(opts: {
  to: string;
  bundle: Tracker;
  deliverable: Array<{ tracker: Tracker; downloadUrl: string; expiresAt: Date }>;
  queued: Tracker[];
  maxUses: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? 'NIS <notifications@thenispace.com>';

  const deliverableRows = opts.deliverable
    .map(
      ({ tracker, downloadUrl, expiresAt }) => `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #e5e5e5;">
            <strong>${escapeHtml(tracker.title)}</strong>
            <div style="color:#737373; font-size: 12px; margin-top: 2px;">Ready now</div>
          </td>
          <td style="padding: 10px 0; border-top: 1px solid #e5e5e5; text-align: right;">
            <a href="${downloadUrl}"
               style="padding: 8px 14px; background: #7c3aed; color: white;
                      text-decoration: none; border-radius: 9999px; font-size: 13px;">
              Download
            </a>
            <div style="color:#a3a3a3; font-size: 11px; margin-top: 4px;">
              expires ${escapeHtml(expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}
            </div>
          </td>
        </tr>`,
    )
    .join('');

  const queuedRows = opts.queued
    .map(
      (tracker) => `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #e5e5e5;">
            <strong>${escapeHtml(tracker.title)}</strong>
            <div style="color:#737373; font-size: 12px; margin-top: 2px;">${escapeHtml(tracker.tagline)}</div>
          </td>
          <td style="padding: 10px 0; border-top: 1px solid #e5e5e5; text-align: right; color:#a3a3a3; font-size: 12px;">
            shipping soon
          </td>
        </tr>`,
    )
    .join('');

  await resend.emails.send({
    from,
    to: opts.to,
    subject: `Your ${opts.bundle.title} order is confirmed`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
        <h1 style="font-size: 22px; margin: 0 0 8px;">Bundle confirmed</h1>
        <p style="margin: 0 0 20px; color: #525252;">
          Thanks for buying the <strong>${escapeHtml(opts.bundle.title)}</strong>
          (${escapeHtml(formatINR(opts.bundle.pricePaise))}).
        </p>

        <table style="width:100%; border-collapse: collapse; margin: 12px 0 24px;">
          ${deliverableRows}
          ${queuedRows}
        </table>

        ${opts.queued.length > 0 ? `
          <p style="margin: 0 0 8px; color: #525252; font-size: 14px;">
            We&rsquo;ll email each remaining tracker the day it ships — no extra action
            from you. You&rsquo;re also locked into today&rsquo;s price if we raise
            individual prices later.
          </p>` : ''}

        ${opts.deliverable.length > 0 ? `
          <p style="margin: 0; color: #737373; font-size: 13px;">
            Each link is good for ${opts.maxUses} downloads. Reply to this email if
            you need anything resent.
          </p>` : ''}

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0;" />
        <p style="font-size: 13px; color: #737373; margin: 0;">
          Questions? Reply to this email. — NIS
        </p>
      </div>
    `,
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

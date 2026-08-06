import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Resend } from 'resend';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTracker, formatINR, type Tracker } from '@/lib/tracker-catalog';

const DOWNLOAD_EXPIRY_DAYS = 7;
const DOWNLOAD_MAX_USES = 5;

export type MadeToOrderDetail = { label: string; value: string };

/** Defensive: cap count + lengths on client-supplied personalisation details. */
export function sanitizeMadeToOrderDetails(details: unknown): MadeToOrderDetail[] | undefined {
  if (!Array.isArray(details)) return undefined;
  const clean = details
    .filter(
      (d): d is MadeToOrderDetail =>
        !!d && typeof d.label === 'string' && typeof d.value === 'string' && d.value.trim().length > 0,
    )
    .slice(0, 30)
    .map((d) => ({ label: d.label.slice(0, 120), value: d.value.slice(0, 500) }));
  return clean.length ? clean : undefined;
}

type FulfillmentInput = {
  productSlug: string;
  email: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  /** Buyer's personalisation answers (made-to-order); undefined otherwise. */
  details?: MadeToOrderDetail[];
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

  // Made-to-order first: personalised products (the Wedding Box, video invites)
  // have no instant deliverable, so they must NOT fall through to the bundle or
  // single-download paths — those would mint a token / email a file we can't
  // hand over. Instead we record the paid order and email a details request.
  if (tracker.madeToOrder) {
    return await persistMadeToOrder(input, tracker);
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

  // Same routing as /verify: made-to-order before bundle before single, so the
  // webhook safety net (buyer closed the tab before /verify) doesn't mint a
  // token for a personalised SKU that has nothing to download.
  const tracker = getTracker(input.productSlug);
  if (tracker?.madeToOrder) {
    return await persistMadeToOrder(input, tracker);
  }
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
       product:products!inner ( id, title, storage_path ),
       order:orders!inner ( email )`,
    )
    .eq('id', orderItemId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: 'Order item not found' };

  const product = Array.isArray(data.product) ? data.product[0] : data.product;
  const order = Array.isArray(data.order) ? data.order[0] : data.order;

  // A line is deliverable if it has EITHER a stored file OR a catalog
  // deliveryUrl (link-delivered Google Sheets have no storage_path). Checking
  // storage_path alone used to reject every link-delivered tracker, which is
  // now all of them — so resend was silently broken for the whole catalog.
  const catalogEntry = product?.id ? getTracker(product.id as string) : undefined;
  const isDeliverable = Boolean(product?.storage_path) || Boolean(catalogEntry?.deliveryUrl);
  if (!isDeliverable) {
    return { ok: false, error: 'This line has no deliverable file or link (e.g. a bundle SKU row).' };
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
    guideUrl: catalogEntry?.welcomePath ? guideLink(token) : undefined,
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
    guideUrl: tracker.welcomePath ? guideLink(token) : undefined,
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

/**
 * Made-to-order fulfilment: personalised products (the Wedding Box, video
 * invites) have no instant deliverable. We record the paid order and its line
 * (so it shows in the admin dashboard and revenue), leave the order `paid`
 * (i.e. awaiting manual fulfilment — NOT `fulfilled`), mint NO download token,
 * and email the buyer a request for the details we need to craft their suite.
 */
async function persistMadeToOrder(
  input: FulfillmentInput,
  tracker: Tracker,
): Promise<FulfillmentResult> {
  const supabase = getServiceSupabase();
  const now = new Date();

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

  if (orderErr || !order) {
    throw new Error(`Made-to-order persist failed: ${orderErr?.message ?? 'no row'}`);
  }

  // Idempotency: if this SKU is already a line on the order, it's a re-run
  // (retried /verify or the webhook safety net) — don't insert a duplicate line
  // or send a second details request.
  const { data: already } = await supabase
    .schema('commerce')
    .from('order_items')
    .select('id, details')
    .eq('order_id', order.id)
    .eq('product_id', tracker.slug)
    .maybeSingle();

  if (already) {
    // Idempotent re-run. If details arrived now but weren't stored (e.g. the
    // webhook fulfilled first, without them), backfill the row and send the
    // confirmation + ops brief once — so neither the admin view nor the emails
    // are lost to a verify/webhook race.
    if (input.details?.length && !already.details) {
      await supabase
        .schema('commerce')
        .from('order_items')
        .update({ details: input.details })
        .eq('id', already.id as string);
      await sendMadeToOrderConfirmedEmail({
        to: input.email,
        productTitle: tracker.title,
        pricePaise: tracker.pricePaise,
        details: input.details,
        attachmentPath: tracker.emailAttachmentPath,
      });
      await sendMadeToOrderOpsEmail({
        buyerEmail: input.email,
        productTitle: tracker.title,
        pricePaise: tracker.pricePaise,
        razorpayOrderId: input.razorpayOrderId,
        details: input.details,
      });
    }
    return { fulfilled: true, orderItemId: already.id as string };
  }

  const { data: item, error: itemErr } = await supabase
    .schema('commerce')
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: tracker.slug,
      quantity: 1,
      price_paise: tracker.pricePaise,
      details: input.details ?? null,
    })
    .select('id')
    .single();

  if (itemErr || !item) {
    throw new Error(`Made-to-order item persist failed: ${itemErr?.message ?? 'no row'}`);
  }

  // Deliberately NO download token and NO status → 'fulfilled'. The order stays
  // `paid` until it's personalised and sent by hand.
  if (input.details?.length) {
    // Details collected up front (the pre-payment flow): confirm to the buyer,
    // and hand the build brief to ops so a human can personalise it.
    await sendMadeToOrderConfirmedEmail({
      to: input.email,
      productTitle: tracker.title,
      pricePaise: tracker.pricePaise,
      details: input.details,
      attachmentPath: tracker.emailAttachmentPath,
    });
    await sendMadeToOrderOpsEmail({
      buyerEmail: input.email,
      productTitle: tracker.title,
      pricePaise: tracker.pricePaise,
      razorpayOrderId: input.razorpayOrderId,
      details: input.details,
    });
  } else {
    // No details (e.g. the payment.captured webhook fulfilled before /verify
    // could pass them). Ask by reply — never the old general Google Form.
    await sendMadeToOrderDetailsNeededEmail({
      to: input.email,
      productTitle: tracker.title,
      pricePaise: tracker.pricePaise,
      attachmentPath: tracker.emailAttachmentPath,
    });
  }

  return { fulfilled: true, orderItemId: item.id };
}

/**
 * Where a buyer's reply actually lands.
 *
 * Our emails told buyers "Questions? Just reply to this email" — but they're
 * sent FROM notifications@thenispace.com and the domain has **no MX record**,
 * so nothing on the internet accepts mail for it. Every reply bounced into the
 * void: a buyer with a broken download had no way to reach us.
 *
 * Set SUPPORT_EMAIL to a real inbox and Resend routes replies there. If it's
 * unset we do NOT print the "reply to this email" promise — better to say
 * nothing than to promise a channel that silently swallows people.
 */
function supportEmail(): string | undefined {
  const v = process.env.SUPPORT_EMAIL?.trim();
  return v ? v : undefined;
}

/**
 * Internal inbox that receives a made-to-order build brief (buyer + details) so
 * a human can personalise and send it. Defaults to SUPPORT_EMAIL when its own
 * var is unset; when neither exists the ops email is skipped (best-effort).
 */
function opsEmail(): string | undefined {
  return process.env.OPS_NOTIFY_EMAIL?.trim() || supportEmail();
}

/** Renders the buyer's personalisation answers as an HTML table for emails. */
function detailsRecapHtml(details: MadeToOrderDetail[]): string {
  const rows = details
    .map(
      (d) => `
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #737373; font-size: 13px; vertical-align: top; white-space: nowrap;">${escapeHtml(d.label)}</td>
          <td style="padding: 6px 0; color: #0a0a0a; font-size: 14px;">${escapeHtml(d.value)}</td>
        </tr>`,
    )
    .join('');
  return `<table style="margin: 8px 0 0; border-collapse: collapse;">${rows}</table>`;
}

/**
 * Loads a repo-bundled PDF (path relative to apps/web, e.g.
 * `assets/welcome-wedding-box.pdf`) as a Resend attachment. The file ships in
 * the Docker image (`COPY apps/web ./apps/web`) and is read from
 * `process.cwd()` (= /app/apps/web at runtime). Best-effort: any failure
 * (missing file, read error) returns an empty list so the confirmation email
 * is never blocked on the attachment.
 */
async function loadEmailAttachments(
  attachmentPath?: string,
): Promise<Array<{ filename: string; content: Buffer }>> {
  if (!attachmentPath) return [];
  try {
    const content = await readFile(path.join(process.cwd(), attachmentPath));
    return [{ filename: path.basename(attachmentPath), content }];
  } catch (err) {
    console.error(`[fulfillment] welcome attachment read failed (${attachmentPath})`, err);
    return [];
  }
}

/** The sign-off line — only promises a reply when a reply can actually arrive. */
function supportLine(): string {
  const s = supportEmail();
  return s
    ? 'Questions? Just reply to this email. — NIS'
    : 'Questions? Reach us any time at thenispace.com. — NIS';
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

/**
 * The Start-Here guide. Points straight at the API route (unlike the download
 * link, which goes via a landing page to stop link-scanners spending a use) —
 * safe here because /api/guide never spends a download.
 */
function guideLink(token: string): string {
  return `${publicSiteUrl()}/api/guide?token=${encodeURIComponent(token)}`;
}

async function sendReceiptEmail(opts: {
  to: string;
  productTitle: string;
  pricePaise: number;
  downloadUrl: string;
  /** Optional — only trackers with a `welcomePath` have a guide. */
  guideUrl?: string;
  expiresAt: Date;
  maxUses: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // dev mode: skip silently. /verify still returns success.

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? 'NIS <notifications@thenispace.com>';

  await resend.emails.send({
    from,
    replyTo: supportEmail(),
    to: opts.to,
    subject: `Your ${opts.productTitle} download is ready`,
    html: receiptHtml({
      productTitle: opts.productTitle,
      pricePaise: opts.pricePaise,
      downloadUrl: opts.downloadUrl,
      guideUrl: opts.guideUrl,
      expiresAt: opts.expiresAt,
      maxUses: opts.maxUses,
    }),
  });
}

async function sendMadeToOrderConfirmedEmail(opts: {
  to: string;
  productTitle: string;
  pricePaise: number;
  details: MadeToOrderDetail[];
  /** Repo-relative (to apps/web) path to a welcome PDF to attach, if any. */
  attachmentPath?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // dev mode: skip silently. /verify still returns success.

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? 'NIS <notifications@thenispace.com>';
  const attachments = await loadEmailAttachments(opts.attachmentPath);

  await resend.emails.send({
    from,
    replyTo: supportEmail(),
    to: opts.to,
    subject: `Order confirmed — your ${opts.productTitle} is on the way`,
    ...(attachments.length ? { attachments } : {}),
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">Payment received 🎉</h1>
        <p style="margin: 0 0 8px; color: #525252;">
          Thanks for buying <strong>${escapeHtml(opts.productTitle)}</strong>
          (${escapeHtml(formatINR(opts.pricePaise))}). This one is <strong>made to order</strong> —
          we already have your details, so there&rsquo;s nothing more you need to do.
        </p>
        <p style="margin: 16px 0 4px; color: #525252;">Here&rsquo;s what you told us:</p>
        ${detailsRecapHtml(opts.details)}
        <p style="margin: 20px 0 0; color: #525252; font-size: 14px;">
          We&rsquo;ll personalise everything by hand and email it to you shortly. If anything
          above looks wrong, just reply and we&rsquo;ll fix it.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0;" />
        <p style="font-size: 13px; color: #737373; margin: 0;">${supportLine()}</p>
      </div>
    `,
  });
}

/**
 * Fallback when a made-to-order payment lands WITHOUT details — e.g. the
 * payment.captured webhook fulfilled before /verify could pass them. We ask by
 * reply (never the old Google Form), and only promise a reply when SUPPORT_EMAIL
 * can actually receive it.
 */
async function sendMadeToOrderDetailsNeededEmail(opts: {
  to: string;
  productTitle: string;
  pricePaise: number;
  attachmentPath?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? 'NIS <notifications@thenispace.com>';
  const canReply = Boolean(supportEmail());
  const attachments = await loadEmailAttachments(opts.attachmentPath);

  const detailsList = `
    <ul style="margin: 8px 0 0; padding-left: 20px; color: #525252; font-size: 14px; line-height: 1.7;">
      <li>Bride&rsquo;s and groom&rsquo;s names</li>
      <li>Which ceremony (or ceremonies) the invite is for</li>
      <li>Date(s) and venue(s)</li>
      <li>Anything you&rsquo;d like customised (a special request)</li>
    </ul>`;

  const intakeBlock = canReply
    ? `<p style="margin: 20px 0 0; color: #525252; font-size: 14px;"><strong>Just reply to this email</strong> with the list above and we&rsquo;ll get started.</p>`
    : `<p style="margin: 20px 0 0; color: #525252; font-size: 14px;">We&rsquo;ll email you shortly to collect these details.</p>`;

  await resend.emails.send({
    from,
    replyTo: supportEmail(),
    to: opts.to,
    subject: `Your ${opts.productTitle} order is confirmed — one quick step`,
    ...(attachments.length ? { attachments } : {}),
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">Order confirmed 🎉</h1>
        <p style="margin: 0 0 8px; color: #525252;">
          Thanks for buying <strong>${escapeHtml(opts.productTitle)}</strong>
          (${escapeHtml(formatINR(opts.pricePaise))}).
        </p>
        <p style="margin: 0 0 4px; color: #525252;">
          This one is <strong>made to order</strong> — we personalise it by hand. To get
          started we just need a few details:
        </p>
        ${detailsList}
        ${intakeBlock}
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0;" />
        <p style="font-size: 13px; color: #737373; margin: 0;">${supportLine()}</p>
      </div>
    `,
  });
}

/** Internal build brief so a human can personalise + send the order. */
async function sendMadeToOrderOpsEmail(opts: {
  buyerEmail: string;
  productTitle: string;
  pricePaise: number;
  razorpayOrderId: string;
  details: MadeToOrderDetail[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = opsEmail();
  if (!apiKey || !to) return; // best-effort; skip if no ops inbox is configured.

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? 'NIS <notifications@thenispace.com>';

  await resend.emails.send({
    from,
    replyTo: opts.buyerEmail,
    to,
    subject: `🎬 Make: ${opts.productTitle} — ${opts.buyerEmail}`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0a0a0a;">
        <h1 style="font-size: 18px; margin: 0 0 12px;">New made-to-order to build</h1>
        <p style="margin: 0 0 4px; color: #525252; font-size: 14px;">
          <strong>${escapeHtml(opts.productTitle)}</strong> · ${escapeHtml(formatINR(opts.pricePaise))}
          · buyer <a href="mailto:${escapeHtml(opts.buyerEmail)}">${escapeHtml(opts.buyerEmail)}</a>
        </p>
        <p style="margin: 0 0 12px; color: #737373; font-size: 12px;">Razorpay order ${escapeHtml(opts.razorpayOrderId)}</p>
        ${detailsRecapHtml(opts.details)}
      </div>
    `,
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
    replyTo: supportEmail(),
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
          ${supportLine()}
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
    replyTo: supportEmail(),
    to,
    subject: `Order received: ${productTitle}`,
    html: `<p>Thanks for buying <strong>${escapeHtml(productTitle)}</strong>. We&rsquo;ll email your download link shortly.</p>`,
  });
}

function receiptHtml(opts: {
  productTitle: string;
  pricePaise: number;
  downloadUrl: string;
  guideUrl?: string;
  expiresAt: Date;
  maxUses: number;
}): string {
  const expiresFmt = opts.expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Secondary CTA — only for trackers that ship a Start-Here guide. Styled as a
  // quiet outline button so it never competes with the real download.
  const guideBlock = opts.guideUrl
    ? `
      <p style="margin: 24px 0 10px; color: #525252; font-size: 14px;">
        New to it? The guide walks you through setup in 60 seconds.
      </p>
      <a href="${opts.guideUrl}"
         style="display: inline-block; padding: 12px 22px; background: #ffffff; color: #7c3aed;
                text-decoration: none; border: 1px solid #ddd6fe; border-radius: 9999px;
                font-weight: 500; font-size: 14px;">
        Get your Start-Here guide
      </a>`
    : '';

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
      ${guideBlock}

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />

      <p style="font-size: 13px; color: #737373; margin: 0;">
        ${supportLine()}
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

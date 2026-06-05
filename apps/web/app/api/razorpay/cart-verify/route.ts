import { NextResponse } from 'next/server';
import { verifySignature, requireServerEnv } from '@nis/razorpay-sdk/server';
import { fulfillDigitalOrder } from '@/lib/fulfillment';
import { getPurchasableTracker } from '@/lib/tracker-catalog';

export const runtime = 'nodejs';

// Same clamp the fulfillment loop uses — keep the total and the loop in sync.
const clampQty = (qty: number) => Math.max(1, Math.min(5, Math.floor(qty) || 1));

type VerifyItem = { slug: string; qty: number };

type VerifyRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items: VerifyItem[];
  email: string;
};

export async function POST(req: Request) {
  let body: VerifyRequest;
  try {
    body = (await req.json()) as VerifyRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (
    !body.razorpay_order_id ||
    !body.razorpay_payment_id ||
    !body.razorpay_signature ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    !body.email
  ) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  let keySecret: string;
  try {
    ({ keySecret } = requireServerEnv());
  } catch {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 });
  }

  const ok = verifySignature({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
    keySecret,
  });

  if (!ok) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Authoritative order total, computed server-side from the catalog (never
  // trust client prices). Recorded on the order so a multi-item cart shows what
  // was actually charged, not just the last fulfilled line's price.
  const orderTotalPaise = body.items.reduce((sum, item) => {
    const tracker = getPurchasableTracker(item.slug);
    return sum + (tracker ? tracker.pricePaise * clampQty(item.qty) : 0);
  }, 0);

  // Fulfill each line. Each line is its own digital product email.
  // If one fails we still return ok:true so the buyer doesn't think the
  // whole order vanished — the failed slugs are flagged in `partial`.
  const results: Array<{ slug: string; ok: boolean; error?: string }> = [];
  for (const item of body.items) {
    for (let i = 0; i < clampQty(item.qty); i++) {
      try {
        await fulfillDigitalOrder({
          productSlug: item.slug,
          email: body.email,
          razorpayOrderId: body.razorpay_order_id,
          razorpayPaymentId: body.razorpay_payment_id,
          orderTotalPaise,
        });
        results.push({ slug: item.slug, ok: true });
      } catch (err) {
        results.push({
          slug: item.slug,
          ok: false,
          error: err instanceof Error ? err.message : 'fulfill failed',
        });
      }
    }
  }

  const partial = results.some((r) => !r.ok);
  return NextResponse.json({ ok: true, partial, results });
}

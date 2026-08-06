import { NextResponse } from 'next/server';
import { verifySignature, requireServerEnv, fetchOrder } from '@nis/razorpay-sdk/server';
import { fulfillDigitalOrder, type MadeToOrderDetail } from '@/lib/fulfillment';

export const runtime = 'nodejs';

type VerifyRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  // Client-echoed — kept only as a last-resort fallback for logging. The
  // authoritative product + email come from the order's server-set notes.
  productSlug?: string;
  email?: string;
  // Buyer's own personalisation answers (made-to-order). Safe to accept from
  // the client: they can only alter their own wedding details, and the product
  // (which decides what they receive) is bound server-side below.
  details?: MadeToOrderDetail[];
};

/** Defensive: cap count + lengths on client-supplied personalisation details. */
function sanitizeDetails(details: unknown): MadeToOrderDetail[] | undefined {
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

export async function POST(req: Request) {
  let body: VerifyRequest;
  try {
    body = (await req.json()) as VerifyRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
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

  // Bind the product to the SERVER order, not the client echo. This closes the
  // gap where a buyer could pay for a ₹199 order and claim a ₹999 slug here.
  let productSlug: string;
  let email: string;
  try {
    const order = await fetchOrder(body.razorpay_order_id);
    productSlug = order.notes?.productSlug ?? '';
    email = order.notes?.buyerEmail ?? body.email ?? '';
  } catch {
    // Razorpay fetch failed. The payment.captured webhook reads the same
    // authoritative notes and will fulfil — so report success (the buyer DID
    // pay) rather than fulfilling off an untrusted client slug.
    return NextResponse.json({ ok: true, fulfilled: false, deferred: true });
  }

  if (!productSlug || !email) {
    return NextResponse.json({ ok: true, fulfilled: false, error: 'Order missing product/email notes' });
  }

  try {
    const result = await fulfillDigitalOrder({
      productSlug,
      email,
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      details: sanitizeDetails(body.details),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: true, fulfilled: false, error: message });
  }
}

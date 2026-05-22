import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@nis/razorpay-sdk/server';

export const runtime = 'nodejs';

/**
 * Razorpay webhook handler. Configure in Dashboard → Webhooks with secret
 * stored as RAZORPAY_WEBHOOK_SECRET. Subscribe to payment.captured at minimum.
 *
 * This route is a SAFETY NET for the client-side /verify flow — if the buyer
 * closes their browser before /verify fires, the webhook still records the
 * payment and triggers fulfillment.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  type WebhookPayload = {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id: string;
          email?: string;
          notes?: Record<string, string>;
        };
      };
    };
  };

  const event = JSON.parse(rawBody) as WebhookPayload;

  // We only react to payment.captured for now. Other events (refunds,
  // disputes) get logged and handled in Week 4.
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) return NextResponse.json({ ok: true, ignored: 'no_payment' });

  const { fulfillDigitalOrderIdempotent } = await import('@/lib/fulfillment');
  await fulfillDigitalOrderIdempotent({
    productSlug: payment.notes?.productSlug ?? '',
    email: payment.email ?? payment.notes?.buyerEmail ?? '',
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
  });

  return NextResponse.json({ ok: true });
}

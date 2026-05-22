import { NextResponse } from 'next/server';
import { verifySignature, requireServerEnv } from '@nis/razorpay-sdk/server';
import { fulfillDigitalOrder } from '@/lib/fulfillment';

export const runtime = 'nodejs';

type VerifyRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  productSlug: string;
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
    !body.productSlug ||
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

  try {
    const result = await fulfillDigitalOrder({
      productSlug: body.productSlug,
      email: body.email,
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: true, fulfilled: false, error: message });
  }
}

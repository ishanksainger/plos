import { NextResponse } from 'next/server';
import { createOrder } from '@nis/razorpay-sdk/server';
import { getTracker } from '@/lib/tracker-catalog';
import { rateLimit, callerIp, rateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const RL = { bucket: 'razorpay-order', max: 10, windowSec: 60 };

type OrderRequest = { productSlug: string; email?: string };

export async function POST(req: Request) {
  const limit = await rateLimit({ ...RL, key: callerIp(req) });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Slow down — too many order attempts. Try again in a minute.' },
      { status: 429, headers: rateLimitHeaders(limit, RL.max) },
    );
  }

  let body: OrderRequest;
  try {
    body = (await req.json()) as OrderRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const tracker = getTracker(body.productSlug);
  if (!tracker) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
  }

  try {
    const result = await createOrder({
      amountPaise: tracker.pricePaise,
      currency: 'INR',
      receipt: `nis_${tracker.slug}_${Date.now()}`,
      notes: {
        productSlug: tracker.slug,
        productTitle: tracker.title,
        ...(body.email ? { buyerEmail: body.email } : {}),
      },
    });

    return NextResponse.json({
      mode: 'live',
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('RAZORPAY_KEY_ID')) {
      return NextResponse.json(
        {
          mode: 'unconfigured',
          error: 'Razorpay keys not configured',
          hint: 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to apps/web/.env.local',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

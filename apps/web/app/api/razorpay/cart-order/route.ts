import { NextResponse } from 'next/server';
import { createOrder } from '@nis/razorpay-sdk/server';
import { getPurchasableTracker } from '@/lib/tracker-catalog';
import { rateLimit, callerIp, rateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const RL = { bucket: 'razorpay-cart-order', max: 10, windowSec: 60 };

type CartItemInput = { slug: string; qty: number };
type CartOrderRequest = { items: CartItemInput[]; email?: string };

const MAX_QTY_PER_LINE = 5;

export async function POST(req: Request) {
  const limit = await rateLimit({ ...RL, key: callerIp(req) });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Slow down — too many checkout attempts. Try again in a minute.' },
      { status: 429, headers: rateLimitHeaders(limit, RL.max) },
    );
  }

  let body: CartOrderRequest;
  try {
    body = (await req.json()) as CartOrderRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const resolved: Array<{ slug: string; title: string; qty: number; pricePaise: number }> = [];
  for (const raw of body.items) {
    const tracker = getPurchasableTracker(raw?.slug);
    if (!tracker) {
      return NextResponse.json(
        { error: `Item unavailable: ${raw?.slug ?? 'unknown'}` },
        { status: 400 },
      );
    }
    const qty = Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(Number(raw.qty) || 1)));
    resolved.push({
      slug: tracker.slug,
      title: tracker.title,
      qty,
      pricePaise: tracker.pricePaise,
    });
  }

  const totalPaise = resolved.reduce((sum, r) => sum + r.pricePaise * r.qty, 0);

  try {
    const result = await createOrder({
      amountPaise: totalPaise,
      currency: 'INR',
      receipt: `nis_cart_${Date.now()}`,
      notes: {
        kind: 'cart',
        // Razorpay notes are key/value strings — serialise the cart shape.
        cart: JSON.stringify(resolved.map(({ slug, qty }) => ({ slug, qty }))),
        ...(body.email ? { buyerEmail: body.email } : {}),
      },
    });

    return NextResponse.json({
      mode: 'live',
      ...result,
      items: resolved,
      totalPaise,
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

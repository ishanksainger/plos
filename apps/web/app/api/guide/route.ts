import { NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTracker } from '@/lib/tracker-catalog';

export const runtime = 'nodejs';

const SIGNED_URL_TTL_SECONDS = 60; // short — the buyer's browser only needs it long enough to redirect.

/**
 * Serves the "Start Here" welcome guide (a PDF) that rides along in the receipt
 * email next to the real download link.
 *
 * Why this route exists at all: the guide contains the product's force-copy
 * link, so it CANNOT be hosted publicly — a bare Storage URL would hand the
 * sheet out for free. It's gated by the buyer's own download token, exactly
 * like /api/download.
 *
 * The one deliberate difference: this does NOT spend one of the buyer's 5
 * downloads. The guide is a companion doc, not the product — re-reading it
 * should never cost someone a download of the thing they paid for.
 */

// Link-scanners issue HEAD to "verify" URLs. Answer cheaply.
export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = getServiceSupabase();

  const { data: tokenRow, error: tokenErr } = await supabase
    .schema('commerce')
    .from('download_tokens')
    .select(
      `token, expires_at, used_count, max_uses,
       order_item:order_items!inner (
         id,
         product:products!inner ( id, title )
       )`,
    )
    .eq('token', token)
    .maybeSingle();

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  if (new Date(tokenRow.expires_at as string) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }

  // The joined relation comes back as an array-or-object depending on PostgREST
  // disambiguation. Normalize both shapes (same as /api/download).
  const orderItem = Array.isArray(tokenRow.order_item)
    ? tokenRow.order_item[0]
    : tokenRow.order_item;
  const product = orderItem?.product
    ? Array.isArray(orderItem.product)
      ? orderItem.product[0]
      : orderItem.product
    : null;

  const productId = product?.id as string | undefined;
  const welcomePath = productId ? getTracker(productId)?.welcomePath : undefined;

  if (!welcomePath) {
    return NextResponse.json({ error: 'No guide for this product' }, { status: 404 });
  }

  const bucket = process.env.SUPABASE_PRODUCTS_BUCKET ?? 'products';
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(welcomePath, SIGNED_URL_TTL_SECONDS);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: `Could not sign URL: ${signErr?.message ?? 'unknown'}` },
      { status: 500 },
    );
  }

  // Note: no used_count increment — see the comment at the top of this file.
  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}

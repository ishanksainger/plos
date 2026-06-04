import { NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

const SIGNED_URL_TTL_SECONDS = 60; // short — buyer's browser only needs it long enough to redirect.

// Link-scanners sometimes issue a HEAD to "verify" a URL. Answer cheaply and
// WITHOUT spending a download — only a real GET (a human click) counts. Next
// would otherwise auto-derive HEAD from GET and run its side effects.
export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = getServiceSupabase();

  // 1. Look up the token + joined product file path.
  const { data: tokenRow, error: tokenErr } = await supabase
    .schema('commerce')
    .from('download_tokens')
    .select(
      `token, expires_at, used_count, max_uses,
       order_item:order_items!inner (
         id,
         product:products!inner ( storage_path, title )
       )`,
    )
    .eq('token', token)
    .maybeSingle();

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  // 2. Validate expiry and usage.
  const expiresAt = new Date(tokenRow.expires_at as string);
  if (expiresAt < new Date()) {
    return NextResponse.json({ error: 'Download link expired' }, { status: 410 });
  }
  if (tokenRow.used_count >= tokenRow.max_uses) {
    return NextResponse.json({ error: 'Download limit reached' }, { status: 410 });
  }

  // The joined relation comes back as an array-or-object depending on PostgREST
  // disambiguation. Normalize both shapes.
  const orderItem = Array.isArray(tokenRow.order_item)
    ? tokenRow.order_item[0]
    : tokenRow.order_item;
  const product = orderItem?.product
    ? Array.isArray(orderItem.product)
      ? orderItem.product[0]
      : orderItem.product
    : null;

  const storagePath = product?.storage_path as string | undefined;
  if (!storagePath) {
    return NextResponse.json({ error: 'File not configured' }, { status: 500 });
  }

  // 3. Generate a short-lived signed URL from Supabase Storage.
  const bucket = process.env.SUPABASE_PRODUCTS_BUCKET ?? 'products';
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: `Could not sign URL: ${signErr?.message ?? 'unknown'}` },
      { status: 500 },
    );
  }

  // 4. Spend one use. The extra `.eq('used_count', …)` makes this an optimistic
  //    compare-and-set: two requests that both read the same used_count can't
  //    both succeed, so we never over-count past max_uses.
  await supabase
    .schema('commerce')
    .from('download_tokens')
    .update({ used_count: tokenRow.used_count + 1 })
    .eq('token', token)
    .eq('used_count', tokenRow.used_count);

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}

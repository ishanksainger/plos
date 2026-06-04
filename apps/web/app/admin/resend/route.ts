import { NextResponse } from 'next/server';
import { resendDownloadForOrderItem } from '@/lib/fulfillment';

// Lives under /admin/* so it inherits the Basic-Auth gate in middleware.ts,
// and a same-origin form POST from /admin/orders carries the auth header.
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const orderItemId = String(form.get('orderItemId') ?? '');

  const result = await resendDownloadForOrderItem(orderItemId);

  // Redirect back to the dashboard with a flash result (303 = switch to GET).
  const url = new URL('/admin/orders', req.url);
  if (result.ok) {
    url.searchParams.set('resent', result.email ?? '1');
  } else {
    url.searchParams.set('error', result.error ?? 'Resend failed');
  }
  return NextResponse.redirect(url, 303);
}

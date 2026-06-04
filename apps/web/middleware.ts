import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// HTTP Basic Auth for the /admin area. Credentials come from ADMIN_USER +
// ADMIN_PASSWORD (server env, never NEXT_PUBLIC_). If either is unset the
// admin area behaves as if it doesn't exist (404) — so a misconfigured deploy
// fails closed rather than exposing orders.
export const config = { matcher: ['/admin/:path*'] };

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse('Not found', { status: 404 });
  }

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    // atob is available on the Edge runtime middleware runs in.
    const decoded = atob(header.slice('Basic '.length));
    const sep = decoded.indexOf(':');
    const u = decoded.slice(0, sep);
    const p = decoded.slice(sep + 1);
    if (u === user && p === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="NIS Admin", charset="UTF-8"' },
  });
}

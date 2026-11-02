import { timingSafeEqual } from 'node:crypto';

// Basic-Auth check for the admin page and routes themselves. middleware.ts is
// the front door; repeating the check inside each admin handler means a
// middleware bypass (the CVE-2025-29927 class) still can't reach order data.
// Same contract as middleware.ts: if ADMIN_USER or ADMIN_PASSWORD is unset,
// nobody is authorised, so a misconfigured deploy fails closed.

function same(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isAdminAuthorized(
  authorization: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const user = env.ADMIN_USER;
  const pass = env.ADMIN_PASSWORD;
  if (!user || !pass || !authorization?.startsWith('Basic ')) return false;

  const decoded = Buffer.from(authorization.slice('Basic '.length), 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  if (sep < 0) return false;

  // Compare both halves every time so a wrong user and a wrong password take the same path.
  const userOk = same(decoded.slice(0, sep), user);
  const passOk = same(decoded.slice(sep + 1), pass);
  return userOk && passOk;
}

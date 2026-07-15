import { NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { rateLimit, callerIp, rateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Generous: a burst of navigations from one IP is normal browsing. This only
// stops someone hammering the endpoint to inflate the counts.
const RL = { bucket: 'pv', max: 60, windowSec: 60 };

type PvRequest = { p?: string; s?: string };

// Keep only a clean, same-site path: leading slash, no query/hash, capped
// length, conservative charset. Anything else is dropped (returns null).
function sanitisePath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let p = raw.trim();
  if (!p.startsWith('/')) return null;
  p = p.split(/[?#]/)[0].slice(0, 200);
  return /^\/[\w\-/.]*$/.test(p) ? p : null;
}

const sanitiseSession = (s: unknown) =>
  typeof s === 'string' && /^[\w-]{1,64}$/.test(s) ? s : null;

export async function POST(req: Request) {
  const limit = await rateLimit({ ...RL, key: callerIp(req) });
  if (!limit.ok) {
    return new NextResponse(null, {
      status: 429,
      headers: rateLimitHeaders(limit, RL.max),
    });
  }

  let body: PvRequest;
  try {
    body = (await req.json()) as PvRequest;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const path = sanitisePath(body.p);
  if (!path) return new NextResponse(null, { status: 204 });
  const session_id = sanitiseSession(body.s);

  // No store configured, or no service key → silently no-op. The counter is a
  // best-effort signal, never a hard dependency.
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const supabase = getServiceSupabase();
    await supabase.schema('marketing').from('page_views').insert({ path, session_id });
  } catch {
    // Analytics must never surface an error to the visitor.
  }

  return new NextResponse(null, { status: 204 });
}

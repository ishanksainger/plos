/**
 * Small rate limiter for Next.js API routes.
 *
 * Modes (auto-detected at call time):
 *   - Upstash Redis REST  → set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   - In-memory fallback  → used everywhere else (dev, Vercel without Upstash)
 *
 * The in-memory store is fine for a single instance and dev; it does NOT
 * survive a redeploy and does NOT share state across Vercel functions, so
 * for any meaningful production protection wire Upstash. Both code paths
 * have the same API + sliding-window semantics.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** A stable identifier for this limit (e.g. `'waitlist'`). */
  bucket: string;
  /** Max hits per `windowSec` per key. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
  /** Per-caller key, usually IP. */
  key: string;
}

const memoryStore = new Map<string, number[]>();

function inMemoryHit({ bucket, max, windowSec, key }: RateLimitOptions): RateLimitResult {
  const fullKey = `${bucket}:${key}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const cutoff = now - windowMs;

  const hits = (memoryStore.get(fullKey) ?? []).filter((t) => t > cutoff);
  if (hits.length >= max) {
    return {
      ok: false,
      remaining: 0,
      resetAt: hits[0] + windowMs,
    };
  }

  hits.push(now);
  memoryStore.set(fullKey, hits);
  return {
    ok: true,
    remaining: max - hits.length,
    resetAt: now + windowMs,
  };
}

/**
 * Upstash REST sliding window via Lua-free sorted-set commands. We use the
 * REST API (no client lib) so this works on the edge and Node runtimes
 * without a dep bump.
 */
async function upstashHit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const fullKey = `rl:${opts.bucket}:${opts.key}`;
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const cutoff = now - windowMs;
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  // Pipeline: prune old entries, add new, count, set TTL.
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['ZREMRANGEBYSCORE', fullKey, '-inf', String(cutoff)],
      ['ZADD', fullKey, String(now), member],
      ['ZCARD', fullKey],
      ['PEXPIRE', fullKey, String(windowMs)],
    ]),
    cache: 'no-store',
  });
  if (!res.ok) {
    // Fail open — return ok so a Redis outage doesn't take down sales.
    return { ok: true, remaining: opts.max, resetAt: now + windowMs };
  }
  const json = (await res.json()) as Array<{ result?: unknown }>;
  const count = Number(json?.[2]?.result ?? 0);
  if (count > opts.max) {
    return { ok: false, remaining: 0, resetAt: now + windowMs };
  }
  return {
    ok: true,
    remaining: Math.max(0, opts.max - count),
    resetAt: now + windowMs,
  };
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return upstashHit(opts);
  }
  return inMemoryHit(opts);
}

/**
 * Pull a caller IP from the standard proxy headers Vercel sets. Falls back
 * to a constant string so dev (no proxy) still rate-limits per-process.
 */
export function callerIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

/**
 * Standard headers per the IETF draft. Useful for clients that want to
 * surface remaining quota; not required for the protection to work.
 */
export function rateLimitHeaders(result: RateLimitResult, max: number): Headers {
  const h = new Headers();
  h.set('X-RateLimit-Limit', String(max));
  h.set('X-RateLimit-Remaining', String(result.remaining));
  h.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  return h;
}

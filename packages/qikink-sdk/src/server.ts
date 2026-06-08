/**
 * Server-only Qikink Open API client. Never import this from a client component.
 *
 * Usage rules (see CLAUDE.md):
 *   - All Qikink calls go through this module — never hand-roll fetch to
 *     qikink.com anywhere else.
 *   - Build + smoke-test against SANDBOX first; only swap to live keys once
 *     Qikink approves the live request.
 *   - Qikink's API is RUPEE-denominated; our app stores paise. Convert at the
 *     boundary with `paiseToRupeeString()` before building a line item.
 *
 * Relies on the runtime `fetch` (Node 18+ / the Next.js server runtime).
 */

import { QIKINK_SANDBOX_BASE, modeForBaseUrl } from './mode';
import type {
  QikinkConfig,
  QikinkCreateOrderInput,
  QikinkCreateOrderResponse,
  QikinkGetOrderParams,
  QikinkMode,
  QikinkOrder,
  QikinkTokenResponse,
} from './types';

/** Thrown for any non-2xx Qikink response. Carries status + parsed body for the route boundary. */
export class QikinkError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'QikinkError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Reads QIKINK_CLIENT_ID + QIKINK_CLIENT_SECRET (+ optional QIKINK_API_BASE,
 * defaulting to sandbox) from process.env. Throws if creds are missing — catch
 * at the API route boundary and return a 503 so the UI can show "merch not
 * configured" rather than a 500.
 */
export function requireServerEnv(): QikinkConfig {
  const clientId = process.env.QIKINK_CLIENT_ID;
  const clientSecret = process.env.QIKINK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET not set. Add sandbox creds from ' +
        'dashboard.qikink.com -> Integrations -> Open API to apps/web/.env.local',
    );
  }
  const baseUrl = (process.env.QIKINK_API_BASE ?? QIKINK_SANDBOX_BASE).replace(/\/+$/, '');
  return { clientId, clientSecret, baseUrl };
}

// --- token cache ------------------------------------------------------------
// Qikink access tokens are not long-lived. We cache with a conservative soft
// TTL keyed by baseUrl+clientId, and also transparently re-auth once on a 401
// (see `request`). The cache is module-scoped — fine for a single server proc.
const TOKEN_SOFT_TTL_MS = 45 * 60 * 1000;
let _token: { value: string; key: string; fetchedAt: number } | null = null;

function tokenKey(cfg: QikinkConfig): string {
  return `${cfg.baseUrl}::${cfg.clientId}`;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Non-JSON body (e.g. an HTML error page) — return raw text so callers can log it.
    return text;
  }
}

async function fetchToken(cfg: QikinkConfig): Promise<string> {
  const body = new URLSearchParams();
  body.set('ClientId', cfg.clientId);
  body.set('client_secret', cfg.clientSecret);

  const res = await fetch(`${cfg.baseUrl}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = (await safeJson(res)) as QikinkTokenResponse | string | null;
  if (!res.ok) {
    throw new QikinkError(`Qikink token request failed (${res.status})`, res.status, json);
  }
  const token =
    typeof json === 'object' && json !== null
      ? (json.Accesstoken ?? json.accesstoken ?? json.access_token)
      : undefined;
  if (!token) {
    throw new QikinkError('Qikink token response had no Accesstoken', res.status, json);
  }
  return token;
}

/** Returns a cached token if fresh, else fetches a new one. Set `force` to bypass the cache. */
export async function getAccessToken(
  cfg: QikinkConfig = requireServerEnv(),
  force = false,
): Promise<string> {
  const key = tokenKey(cfg);
  if (!force && _token && _token.key === key && Date.now() - _token.fetchedAt < TOKEN_SOFT_TTL_MS) {
    return _token.value;
  }
  const value = await fetchToken(cfg);
  _token = { value, key, fetchedAt: Date.now() };
  return value;
}

type RequestOpts = {
  method: 'GET' | 'POST';
  /** Absolute path, e.g. '/api/order/create'. */
  path: string;
  query?: Record<string, string | number | undefined>;
  json?: unknown;
};

/**
 * Authenticated request to Qikink. Attaches ClientId + Accesstoken headers and
 * transparently re-authenticates once if the token was rejected (401).
 */
async function request<T>(cfg: QikinkConfig, opts: RequestOpts): Promise<T> {
  const doFetch = (token: string): Promise<Response> => {
    const url = new URL(opts.path, cfg.baseUrl);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    const headers: Record<string, string> = {
      ClientId: cfg.clientId,
      Accesstoken: token,
      Accept: 'application/json',
    };
    let body: string | undefined;
    if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.json);
    }
    return fetch(url.toString(), { method: opts.method, headers, body });
  };

  let token = await getAccessToken(cfg);
  let res = await doFetch(token);

  if (res.status === 401) {
    // Token likely expired — re-auth once and retry.
    token = await getAccessToken(cfg, true);
    res = await doFetch(token);
  }

  const parsed = await safeJson(res);
  if (!res.ok) {
    throw new QikinkError(
      `Qikink ${opts.method} ${opts.path} failed (${res.status})`,
      res.status,
      parsed,
    );
  }
  return parsed as T;
}

// --- public API -------------------------------------------------------------

/** POST /api/order/create — submit a print-on-demand order for fulfilment. */
export async function createOrder(
  input: QikinkCreateOrderInput,
  cfg: QikinkConfig = requireServerEnv(),
): Promise<QikinkCreateOrderResponse> {
  return request<QikinkCreateOrderResponse>(cfg, {
    method: 'POST',
    path: '/api/order/create',
    json: input,
  });
}

/** GET /api/order — list orders, optionally filtered by id or date range. */
export async function listOrders(
  params: QikinkGetOrderParams = {},
  cfg: QikinkConfig = requireServerEnv(),
): Promise<QikinkOrder[]> {
  const res = await request<QikinkOrder[] | { orders?: QikinkOrder[] }>(cfg, {
    method: 'GET',
    path: '/api/order',
    query: { id: params.id, from_date: params.from_date, to_date: params.to_date },
  });
  // Qikink returns either a bare array or an object wrapping `orders`.
  if (Array.isArray(res)) return res;
  return res.orders ?? [];
}

/** Convenience wrapper around listOrders for a single order id. */
export async function getOrder(
  id: string | number,
  cfg: QikinkConfig = requireServerEnv(),
): Promise<QikinkOrder | null> {
  const orders = await listOrders({ id }, cfg);
  return orders[0] ?? null;
}

// --- helpers ----------------------------------------------------------------

/**
 * Qikink's API is rupee-denominated and wants string amounts; our app stores
 * paise. Convert at the boundary: 24900 -> "249", 24950 -> "249.50".
 */
export function paiseToRupeeString(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

/** Which Qikink environment the resolved config points at — for diagnostics/logging. */
export function currentMode(cfg: QikinkConfig = requireServerEnv()): QikinkMode {
  return modeForBaseUrl(cfg.baseUrl);
}

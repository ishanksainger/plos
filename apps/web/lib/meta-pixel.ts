// Thin, SSR-safe wrapper over the Meta (Facebook) Pixel global `window.fbq`.
//
// The base pixel snippet + the automatic PageView (incl. SPA route changes)
// live in `components/MetaPixel.tsx`. This module is the typed surface the
// commerce components call for the funnel events: ViewContent, InitiateCheckout
// and Purchase. Every call is a no-op when the pixel hasn't loaded (dev without
// the script, an ad-blocker, SSR) so callers never need to guard.
//
// Money note: Meta wants `value` in the major currency unit (rupees), never
// paise. Callers convert at the boundary — the catalog stores paise.

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fbq's real signature is variadic/overloaded; Meta ships no types.
    fbq?: (...args: any[]) => void;
    _fbq?: unknown;
  }
}

type Currency = 'INR';

function fbq(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  const fn = window.fbq;
  if (typeof fn !== 'function') return;
  fn(...args);
}

/** Product detail view. `value` in rupees. */
export function trackViewContent(params: {
  contentName: string;
  contentIds?: string[];
  value: number;
  currency?: Currency;
}): void {
  fbq('track', 'ViewContent', {
    content_name: params.contentName,
    content_type: 'product',
    ...(params.contentIds ? { content_ids: params.contentIds } : {}),
    value: params.value,
    currency: params.currency ?? 'INR',
  });
}

/** Buy clicked, fired just before the Razorpay sheet opens. `value` in rupees. */
export function trackInitiateCheckout(params: {
  contentName?: string;
  contentIds?: string[];
  numItems?: number;
  value: number;
  currency?: Currency;
}): void {
  fbq('track', 'InitiateCheckout', {
    ...(params.contentName ? { content_name: params.contentName } : {}),
    content_type: 'product',
    ...(params.contentIds ? { content_ids: params.contentIds } : {}),
    ...(params.numItems ? { num_items: params.numItems } : {}),
    value: params.value,
    currency: params.currency ?? 'INR',
  });
}

// Purchase must fire exactly once per order. The Razorpay success handler only
// runs once per checkout, but a buyer can refresh a success screen or a handler
// can re-run — so we also persist the set of order ids we've already reported
// and pass an eventID, which lets Meta collapse any accidental duplicate (and a
// future server-side CAPI event for the same order).
const PURCHASE_FIRED_KEY = 'nis_fb_purchased_orders';
const MAX_REMEMBERED = 50;

function firedOrderIds(): string[] {
  try {
    const raw = window.localStorage.getItem(PURCHASE_FIRED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function rememberOrderId(orderId: string): void {
  try {
    const ids = firedOrderIds();
    if (ids.includes(orderId)) return;
    ids.push(orderId);
    window.localStorage.setItem(
      PURCHASE_FIRED_KEY,
      JSON.stringify(ids.slice(-MAX_REMEMBERED)),
    );
  } catch {
    /* localStorage unavailable (private mode, quota) — dedup degrades to the
       once-per-handler-run guarantee, which is still correct for a refresh. */
  }
}

/**
 * Fire Purchase once for a completed, verified order.
 * `orderId` = the Razorpay order id (the dedup key). `value` in rupees.
 * Returns true if the event was sent, false if it was suppressed as a duplicate.
 */
export function trackPurchase(params: {
  orderId: string;
  contentName: string;
  contentIds?: string[];
  value: number;
  currency?: Currency;
}): boolean {
  if (typeof window === 'undefined') return false;
  if (!params.orderId || firedOrderIds().includes(params.orderId)) return false;
  rememberOrderId(params.orderId);
  fbq(
    'track',
    'Purchase',
    {
      content_name: params.contentName,
      content_type: 'product',
      ...(params.contentIds ? { content_ids: params.contentIds } : {}),
      value: params.value,
      currency: params.currency ?? 'INR',
    },
    { eventID: `purchase_${params.orderId}` },
  );
  return true;
}

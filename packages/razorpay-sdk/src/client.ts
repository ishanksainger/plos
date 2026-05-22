/**
 * Browser-only helpers. Lazily loads Razorpay's hosted checkout script
 * and opens the checkout modal.
 */

import type { RazorpayCheckoutOptions } from './types';

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: new (options: unknown) => { open: () => void; on: (event: string, cb: () => void) => void };
  }
}

let _scriptPromise: Promise<void> | null = null;

export function loadCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadCheckoutScript called on server'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (_scriptPromise) return _scriptPromise;

  _scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.head.appendChild(s);
  });

  return _scriptPromise;
}

export async function openCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  await loadCheckoutScript();
  if (!window.Razorpay) throw new Error('Razorpay global not present after script load');

  const rzp = new window.Razorpay({
    key: opts.keyId,
    order_id: opts.orderId,
    amount: opts.amountPaise,
    currency: opts.currency ?? 'INR',
    name: opts.name,
    description: opts.description,
    prefill: opts.prefill,
    notes: opts.notes,
    theme: { color: opts.themeColor ?? '#7c3aed' },
    handler: opts.handler,
    modal: { ondismiss: opts.onDismiss },
  });

  rzp.open();
}

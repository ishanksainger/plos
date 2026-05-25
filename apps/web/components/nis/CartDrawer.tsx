'use client';

import { useEffect, useState } from 'react';
import { openCheckout } from '@nis/razorpay-sdk/client';
import {
  useCart,
  resolveCart,
  subtotalPaise,
  totalCount,
} from '@/lib/cart-store';
import { formatINR } from '@/lib/tracker-catalog';

type Status =
  | { kind: 'idle' }
  | { kind: 'collecting_email' }
  | { kind: 'creating_order' }
  | { kind: 'awaiting_payment' }
  | { kind: 'verifying' }
  | { kind: 'success'; message: string }
  | { kind: 'partial'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'unconfigured' };

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export function CartDrawer() {
  const items = useCart((s) => s.items);
  const drawerOpen = useCart((s) => s.drawerOpen);
  const closeDrawer = useCart((s) => s.closeDrawer);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Hydrate-safe rendering: zustand persist hydrates on mount, so the SSR
  // pass would show "empty cart" even when localStorage has items. We render
  // nothing on the server / first render to avoid the flash.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Esc closes.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  const lines = resolveCart(items);
  const subtotal = subtotalPaise(items);
  const count = totalCount(items);

  const isWorking =
    status.kind === 'creating_order' ||
    status.kind === 'awaiting_payment' ||
    status.kind === 'verifying';

  async function handleCheckout() {
    if (lines.length === 0) return;
    if (!isValidEmail(email)) {
      setStatus({ kind: 'collecting_email' });
      return;
    }

    setStatus({ kind: 'creating_order' });
    try {
      const payload = {
        items: lines.map(({ line }) => ({ slug: line.slug, qty: line.qty })),
        email,
      };
      const orderRes = await fetch('/api/razorpay/cart-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (orderRes.status === 503) {
        setStatus({ kind: 'unconfigured' });
        return;
      }
      if (!orderRes.ok) {
        const data = (await orderRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Order create failed (${orderRes.status})`);
      }

      const order = (await orderRes.json()) as {
        orderId: string;
        amountPaise: number;
        keyId: string;
      };

      setStatus({ kind: 'awaiting_payment' });

      await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        name: 'NIS',
        description:
          lines.length === 1
            ? lines[0].tracker.title
            : `${lines.length} items · NIS Trackers`,
        prefill: { email },
        themeColor: '#7c3aed',
        onDismiss: () => setStatus({ kind: 'idle' }),
        handler: async (verifyPayload) => {
          setStatus({ kind: 'verifying' });
          const verifyRes = await fetch('/api/razorpay/cart-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...verifyPayload,
              items: payload.items,
              email,
            }),
          });
          if (!verifyRes.ok) {
            const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
            setStatus({
              kind: 'error',
              message:
                data.error ??
                'Payment received but verification failed. Check your email — we will follow up.',
            });
            return;
          }
          const data = (await verifyRes.json()) as { ok: boolean; partial?: boolean };
          if (data.partial) {
            setStatus({
              kind: 'partial',
              message:
                'Payment received. Some downloads may take a moment — check your email (also spam).',
            });
          } else {
            setStatus({
              kind: 'success',
              message:
                'Payment received. Check your email for the download links (also check spam).',
            });
          }
          clear();
        },
      });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  }

  // Don't render the drawer before hydration on the client.
  if (!hydrated) {
    return null;
  }

  return (
    <div
      className={`nis-cart-overlay ${drawerOpen ? 'open' : ''}`}
      aria-hidden={!drawerOpen}
      {...(!drawerOpen ? { inert: '' as unknown as boolean } : {})}
    >
      <button
        type="button"
        className="nis-cart-backdrop"
        aria-label="Close cart"
        onClick={closeDrawer}
      />
      <aside
        className="nis-cart-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <header className="nis-cart-head">
          <div>
            <div className="nis-section-eyebrow" style={{ marginBottom: 4 }}>
              Cart
            </div>
            <h2 className="nis-h3" style={{ margin: 0 }}>
              {count === 0
                ? 'Your cart is empty'
                : `${count} item${count === 1 ? '' : 's'}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="nis-cart-close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div className="nis-cart-body">
          {lines.length === 0 ? (
            <p className="nis-cart-empty">
              Nothing here yet. Browse the <a href="/trackers">trackers</a> and
              add one to your cart.
            </p>
          ) : (
            <ul className="nis-cart-lines">
              {lines.map(({ line, tracker }) => (
                <li key={line.slug} className="nis-cart-line">
                  <div className="nis-cart-line-main">
                    <div className="nis-cart-line-title">{tracker.title}</div>
                    <div className="nis-cart-line-sub">
                      {tracker.fileType.toUpperCase()}
                      {tracker.pages ? ` · ${tracker.pages} sheets` : ''}
                    </div>
                  </div>
                  <div className="nis-cart-line-qty">
                    <button
                      type="button"
                      onClick={() => setQty(line.slug, line.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span aria-live="polite">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(line.slug, line.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="nis-cart-line-price">
                    {formatINR(tracker.pricePaise * line.qty)}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.slug)}
                    aria-label={`Remove ${tracker.title}`}
                    className="nis-cart-line-remove"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="nis-cart-foot">
          {lines.length > 0 && (
            <>
              <div className="nis-cart-subtotal">
                <span>Subtotal</span>
                <strong>{formatINR(subtotal)}</strong>
              </div>
              <label className="nis-cart-email">
                <span>Email for the download link</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isWorking}
                />
              </label>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isWorking}
                className="nis-btn nis-btn-primary nis-cart-checkout"
              >
                {labelFor(status, subtotal)}
              </button>
              <StatusLine status={status} />
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}

function labelFor(status: Status, subtotal: number): string {
  if (status.kind === 'creating_order') return 'Creating order…';
  if (status.kind === 'awaiting_payment') return 'Awaiting payment…';
  if (status.kind === 'verifying') return 'Verifying…';
  return `Checkout · ${formatINR(subtotal)}`;
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === 'collecting_email') {
    return <p className="nis-cart-status warn">Enter a valid email first.</p>;
  }
  if (status.kind === 'unconfigured') {
    return (
      <p className="nis-cart-status warn">
        Razorpay isn&rsquo;t configured yet. Add test keys to{' '}
        <code>.env.local</code> to enable checkout.
      </p>
    );
  }
  if (status.kind === 'success') {
    return <p className="nis-cart-status ok">{status.message}</p>;
  }
  if (status.kind === 'partial') {
    return <p className="nis-cart-status warn">{status.message}</p>;
  }
  if (status.kind === 'error') {
    return <p className="nis-cart-status err">{status.message}</p>;
  }
  return null;
}

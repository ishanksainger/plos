'use client';

import { useState } from 'react';
import { openCheckout } from '@nis/razorpay-sdk/client';
import { useCart } from '@/lib/cart-store';
import { getPurchasableTracker, formatINR } from '@/lib/tracker-catalog';

type BuyStatus =
  | { kind: 'idle' }
  | { kind: 'collecting_email' }
  | { kind: 'creating_order' }
  | { kind: 'awaiting_payment' }
  | { kind: 'verifying' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'unconfigured' };

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export function TrackerActions({ slug }: { slug: string }) {
  const tracker = getPurchasableTracker(slug);
  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const inCart = items.some((l) => l.slug === slug);

  const [showBuyNow, setShowBuyNow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<BuyStatus>({ kind: 'idle' });

  if (!tracker) {
    return (
      <div className="nis-tracker-actions">
        <button className="nis-btn" disabled title="Not yet available">
          Coming soon
        </button>
        <button
          className="nis-btn"
          type="button"
          onClick={() => {
            // Re-use the waitlist hook on /plos for "notify me" by sending the
            // user there. Once a per-tracker notify endpoint exists we can
            // pass the slug.
            window.location.assign('/plos#waitlist');
          }}
        >
          Notify me
        </button>
      </div>
    );
  }

  const isWorking =
    status.kind === 'creating_order' ||
    status.kind === 'awaiting_payment' ||
    status.kind === 'verifying';

  async function buyNow() {
    if (!isValidEmail(email)) {
      setStatus({ kind: 'collecting_email' });
      return;
    }
    setStatus({ kind: 'creating_order' });

    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: slug, email }),
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
        description: tracker!.title,
        prefill: { email },
        themeColor: '#7c3aed',
        onDismiss: () => setStatus({ kind: 'idle' }),
        handler: async (payload) => {
          setStatus({ kind: 'verifying' });
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, productSlug: slug, email }),
          });
          if (!verifyRes.ok) {
            const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
            setStatus({
              kind: 'error',
              message: data.error ?? 'Payment received but verification failed. Check your email.',
            });
            return;
          }
          setStatus({
            kind: 'success',
            message: 'Payment received. Check your email for the download link (also check spam).',
          });
        },
      });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  }

  return (
    <div className="nis-tracker-actions">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          className="nis-btn nis-btn-primary"
          style={{ padding: '12px 22px', fontSize: 14 }}
          type="button"
          onClick={() => add(slug)}
          disabled={isWorking}
        >
          {inCart ? 'Added · open cart' : 'Add to cart'}
        </button>
        <button
          className="nis-btn"
          style={{ padding: '12px 22px', fontSize: 14 }}
          type="button"
          onClick={() => setShowBuyNow((v) => !v)}
          disabled={isWorking}
        >
          {showBuyNow ? 'Hide buy now' : `Buy now · ${formatINR(tracker.pricePaise)}`}
        </button>
      </div>

      {showBuyNow && (
        <div className="nis-tracker-buynow">
          <label className="nis-cart-email" style={{ width: '100%' }}>
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
            className="nis-btn nis-btn-primary"
            style={{ padding: '12px 22px', fontSize: 14 }}
            disabled={isWorking}
            onClick={buyNow}
          >
            {labelFor(status, tracker.pricePaise)}
          </button>
          <BuyStatusLine status={status} />
        </div>
      )}
    </div>
  );
}

function labelFor(status: BuyStatus, pricePaise: number): string {
  if (status.kind === 'creating_order') return 'Creating order…';
  if (status.kind === 'awaiting_payment') return 'Awaiting payment…';
  if (status.kind === 'verifying') return 'Verifying…';
  return `Pay ${formatINR(pricePaise)}`;
}

function BuyStatusLine({ status }: { status: BuyStatus }) {
  if (status.kind === 'collecting_email')
    return <p className="nis-cart-status warn">Enter a valid email first.</p>;
  if (status.kind === 'unconfigured')
    return (
      <p className="nis-cart-status warn">
        Razorpay isn&rsquo;t configured. Add test keys to <code>.env.local</code>.
      </p>
    );
  if (status.kind === 'success')
    return <p className="nis-cart-status ok">{status.message}</p>;
  if (status.kind === 'error')
    return <p className="nis-cart-status err">{status.message}</p>;
  return null;
}

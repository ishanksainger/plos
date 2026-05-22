'use client';

import { useState } from 'react';
import { openCheckout } from '@nis/razorpay-sdk/client';
import { formatINR } from '@/lib/tracker-catalog';

type Props = {
  productSlug: string;
  productTitle: string;
  pricePaise: number;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'collecting_email' }
  | { kind: 'creating_order' }
  | { kind: 'awaiting_payment' }
  | { kind: 'verifying' }
  | { kind: 'success'; downloadHint: string }
  | { kind: 'error'; message: string }
  | { kind: 'unconfigured' };

export function BuyButton({ productSlug, productTitle, pricePaise }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [email, setEmail] = useState('');

  async function handleBuy() {
    if (!email || !isValidEmail(email)) {
      setStatus({ kind: 'collecting_email' });
      return;
    }

    setStatus({ kind: 'creating_order' });

    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, email }),
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
        description: productTitle,
        prefill: { email },
        themeColor: '#7c3aed',
        onDismiss: () => setStatus({ kind: 'idle' }),
        handler: async (payload) => {
          setStatus({ kind: 'verifying' });
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, productSlug, email }),
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
            downloadHint:
              'Payment received. Check your email for the download link (also check spam).',
          });
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setStatus({ kind: 'error', message });
    }
  }

  const isWorking =
    status.kind === 'creating_order' ||
    status.kind === 'awaiting_payment' ||
    status.kind === 'verifying';

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-4 py-3 rounded-full bg-bg-card border border-border text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent-electric"
          disabled={isWorking}
        />
        <button
          type="button"
          onClick={handleBuy}
          disabled={isWorking}
          className="px-6 py-3 rounded-full bg-accent-electric text-fg-on-accent font-medium hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap"
        >
          {isWorking ? labelFor(status) : `Buy · ${formatINR(pricePaise)}`}
        </button>
      </div>

      <StatusMessage status={status} />
    </div>
  );
}

function StatusMessage({ status }: { status: Status }) {
  switch (status.kind) {
    case 'collecting_email':
      return <p className="text-sm text-accent-warning">Enter a valid email first.</p>;
    case 'unconfigured':
      return (
        <p className="text-sm text-accent-warning">
          Razorpay isn&apos;t configured yet. Add test keys to{' '}
          <code className="text-fg-primary">.env.local</code> to enable checkout.
        </p>
      );
    case 'success':
      return <p className="text-sm text-accent-success">{status.downloadHint}</p>;
    case 'error':
      return <p className="text-sm text-accent-danger">{status.message}</p>;
    default:
      return null;
  }
}

function labelFor(status: Status): string {
  if (status.kind === 'creating_order') return 'Creating order…';
  if (status.kind === 'awaiting_payment') return 'Awaiting payment…';
  if (status.kind === 'verifying') return 'Verifying…';
  return '…';
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

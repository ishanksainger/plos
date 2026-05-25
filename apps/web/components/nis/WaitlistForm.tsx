'use client';

import { useState } from 'react';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

interface Props {
  source?: string;
  /** Headline above the form. */
  title?: string;
  /** Smaller copy under the headline. */
  subtitle?: string;
  /** Label for the email input. Defaults to "Email". */
  emailLabel?: string;
  /** Button copy. Defaults to "Join the waitlist". */
  ctaLabel?: string;
}

export function WaitlistForm({
  source = 'plos',
  title = 'Be first when PLOS opens.',
  subtitle = 'No spam — one note when invites open, and one when the public launch hits. Unsubscribe in a click.',
  emailLabel = 'Email',
  ctaLabel = 'Join the waitlist',
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus({ kind: 'error', message: 'Enter a valid email.' });
      return;
    }
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus({
          kind: 'error',
          message: data.error ?? 'Could not submit right now. Try again in a minute.',
        });
        return;
      }
      setStatus({ kind: 'success' });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Could not reach the server. Try again in a minute.',
      });
    }
  }

  if (status.kind === 'success') {
    return (
      <div className="nis-waitlist nis-waitlist-success">
        <div className="nis-section-eyebrow">You&rsquo;re in</div>
        <h3 className="nis-h3" style={{ marginTop: 4 }}>
          We&rsquo;ll write before everyone else does.
        </h3>
        <p style={{ color: 'var(--ink-2)', margin: '8px 0 0', fontSize: 14 }}>
          Watch for an email from <strong>hello@thenispace.com</strong>. Add us
          to your contacts so it doesn&rsquo;t land in promotions.
        </p>
      </div>
    );
  }

  const isWorking = status.kind === 'submitting';

  return (
    <form className="nis-waitlist" onSubmit={submit} noValidate>
      <div className="nis-section-eyebrow">Early access</div>
      <h3 className="nis-h3" style={{ marginTop: 4, marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ color: 'var(--ink-2)', margin: '0 0 18px', fontSize: 14, maxWidth: '46ch' }}>
        {subtitle}
      </p>
      <div className="nis-waitlist-row">
        <label className="nis-waitlist-field" htmlFor={`waitlist-email-${source}`}>
          <span>{emailLabel}</span>
          <input
            id={`waitlist-email-${source}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isWorking}
            required
          />
        </label>
        <button
          type="submit"
          className="nis-btn nis-btn-primary"
          disabled={isWorking}
          style={{ padding: '12px 22px', fontSize: 14 }}
        >
          {isWorking ? 'Sending…' : ctaLabel}
        </button>
      </div>
      {status.kind === 'error' && (
        <p className="nis-cart-status err" style={{ marginTop: 10 }}>
          {status.message}
        </p>
      )}
    </form>
  );
}

'use client';

import { useState } from 'react';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/**
 * Compact footer-friendly newsletter form. Reuses /api/waitlist with
 * source=newsletter so the same Supabase table holds every email signal
 * we capture across the site.
 */
export function NewsletterRow() {
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
        body: JSON.stringify({ email, source: 'newsletter' }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus({
          kind: 'error',
          message: data.error ?? 'Could not submit. Try again in a minute.',
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
      <p className="nis-newsletter-success">
        Thanks — we&rsquo;ll write when there&rsquo;s something worth saying.
      </p>
    );
  }

  const isWorking = status.kind === 'submitting';

  return (
    <form className="nis-newsletter" onSubmit={submit} noValidate>
      <label htmlFor="nis-newsletter-email" className="nis-newsletter-label">
        A slow newsletter
      </label>
      <p className="nis-newsletter-help">
        One note a month. Studio updates + new trackers. Unsubscribe in a click.
      </p>
      <div className="nis-newsletter-row">
        <input
          id="nis-newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isWorking}
          aria-label="Email address"
          required
        />
        <button
          type="submit"
          className="nis-btn nis-btn-primary"
          disabled={isWorking}
        >
          {isWorking ? '…' : 'Subscribe'}
        </button>
      </div>
      {status.kind === 'error' && (
        <p className="nis-newsletter-err">{status.message}</p>
      )}
    </form>
  );
}

'use client';

import { useState } from 'react';
import {
  madeToOrderSpec,
  missingRequired,
  buildDetailsSummary,
  type MtoAnswers,
  type MtoDetail,
} from '@/lib/made-to-order-fields';

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/**
 * The pre-payment personalisation form for a made-to-order SKU. Collects the
 * buyer's email + the item-scoped details, validates required fields, and hands
 * a clean {label,value}[] summary back to the caller, which then opens Razorpay.
 * Details are gathered BEFORE payment, so no one pays into an apparent void.
 */
export function MadeToOrderForm({
  slug,
  disabled,
  submitLabel,
  onSubmit,
}: {
  slug: string;
  disabled: boolean;
  submitLabel: string;
  onSubmit: (email: string, details: MtoDetail[]) => void;
}) {
  const spec = madeToOrderSpec(slug);
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<MtoAnswers>({});
  const [err, setErr] = useState<string | null>(null);

  if (!spec) return null;

  const set = (name: string, v: string) => setAnswers((a) => ({ ...a, [name]: v }));

  function submit() {
    if (!isValidEmail(email)) {
      setErr('Enter a valid email so we can send your order.');
      return;
    }
    const missing = missingRequired(spec!, answers);
    if (missing.length) {
      const field = spec!.fields.find((f) => f.name === missing[0]);
      setErr(`Please fill in: ${field?.label ?? missing[0]}.`);
      return;
    }
    setErr(null);
    onSubmit(email.trim(), buildDetailsSummary(spec!, answers));
  }

  return (
    <div className="nis-tracker-buynow" style={{ display: 'grid', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--nis-fg-muted)' }}>{spec.intro}</p>

      <label className="nis-cart-email" style={{ width: '100%' }}>
        <span>Email for your order</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={disabled}
        />
      </label>

      {spec.fields.map((f) => (
        <label key={f.name} className="nis-cart-email" style={{ width: '100%' }}>
          <span>
            {f.label}
            {f.required ? ' *' : ''}
          </span>
          {f.kind === 'radio' ? (
            <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
              {f.options?.map((opt) => (
                <label
                  key={opt}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400, cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name={f.name}
                    value={opt}
                    checked={answers[f.name] === opt}
                    onChange={() => set(f.name, opt)}
                    disabled={disabled}
                    style={{ width: 'auto' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : f.kind === 'textarea' ? (
            <textarea
              value={answers[f.name] ?? ''}
              onChange={(e) => set(f.name, e.target.value)}
              placeholder={f.placeholder}
              disabled={disabled}
              rows={3}
            />
          ) : (
            <input
              type="text"
              value={answers[f.name] ?? ''}
              onChange={(e) => set(f.name, e.target.value)}
              placeholder={f.placeholder}
              disabled={disabled}
            />
          )}
        </label>
      ))}

      {err && <p className="nis-cart-status warn">{err}</p>}

      <button
        type="button"
        className="nis-btn nis-btn-primary"
        style={{ padding: '12px 22px', fontSize: 14 }}
        disabled={disabled}
        onClick={submit}
      >
        {submitLabel}
      </button>
    </div>
  );
}

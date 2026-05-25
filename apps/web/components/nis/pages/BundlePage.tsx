'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import {
  BUNDLE,
  formatINR,
  getBundlePricing,
} from '@/lib/tracker-catalog';

export function BundlePage() {
  const { components, totalIndividualPaise, bundlePricePaise, savingsPaise, discountPercent } =
    getBundlePricing();

  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const inCart = items.some((l) => l.slug === BUNDLE.slug);

  return (
    <section className="nis-section nis-bundle">
      <Link
        href="/trackers"
        className="nis-btn"
        style={{ marginBottom: 28 }}
      >
        <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
          <path d="M13 5H1m0 0l4-4M1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        All trackers
      </Link>

      <header className="nis-bundle-head">
        <div className="nis-section-eyebrow">Bundle · {discountPercent}% off</div>
        <h1
          className="nis-h2"
          style={{
            fontSize: 'clamp(44px, 7vw, 96px)',
            margin: '8px 0 18px',
            lineHeight: 0.94,
            maxWidth: '16ch',
          }}
        >
          One price.{' '}
          <em
            style={{
              fontFamily: 'var(--nis-font-serif)',
              fontStyle: 'italic',
              color: 'var(--accent)',
            }}
          >
            Every tracker.
          </em>
        </h1>
        <p className="nis-bundle-lede">
          {BUNDLE.description}
        </p>

        <div className="nis-bundle-price">
          <div className="nis-bundle-price-figure">
            <div className="nis-bundle-was">
              <span className="muted">If bought separately</span>{' '}
              <s>{formatINR(totalIndividualPaise)}</s>
            </div>
            <div className="nis-bundle-now">
              <span className="amount">{formatINR(bundlePricePaise)}</span>
              <span className="save">save {formatINR(savingsPaise)}</span>
            </div>
          </div>
          <button
            type="button"
            className="nis-btn nis-btn-primary"
            style={{ padding: '14px 24px', fontSize: 15 }}
            onClick={() => add(BUNDLE.slug)}
          >
            {inCart ? 'Added · open cart' : 'Add bundle to cart'}
          </button>
        </div>

        <p className="nis-bundle-fineprint">
          Lifetime access · price locked. The first tracker reaches you within
          minutes; the rest as each ships. Refunds within 7 days per our{' '}
          <Link href="/refund">refund policy</Link>.
        </p>
      </header>

      <div className="section-divider" />

      <section style={{ marginTop: 48 }}>
        <div className="nis-section-eyebrow" style={{ marginBottom: 8 }}>
          What&rsquo;s inside
        </div>
        <h2 className="nis-h2" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginBottom: 28 }}>
          Four sheets, one set.
        </h2>

        <ol className="nis-bundle-list">
          {components.map((t, i) => (
            <li key={t.slug} className="nis-bundle-row">
              <span className="nis-bundle-num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="nis-bundle-row-main">
                <div className="nis-bundle-row-head">
                  <Link
                    href={`/trackers/${t.slug}`}
                    className="nis-bundle-row-title"
                  >
                    {t.title}
                  </Link>
                  <span className="nis-bundle-row-status" data-status={t.active ? 'live' : 'queued'}>
                    {t.active ? 'Live now' : 'Ships soon'}
                  </span>
                </div>
                <p className="nis-bundle-row-tagline">{t.tagline}</p>
              </div>
              <div className="nis-bundle-row-price">
                {formatINR(t.pricePaise)}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="section-divider" />

      <section style={{ marginTop: 48 }}>
        <div className="nis-section-eyebrow" style={{ marginBottom: 8 }}>
          Common questions
        </div>
        <div className="nis-bundle-faq">
          <Faq q="When do I get the trackers that aren't live yet?">
            We email each one the day it ships. You&rsquo;ll see a note in this
            confirmation, and a new mail per tracker as it lands. No extra
            payment, no extra step.
          </Faq>
          <Faq q="What if I only need one tracker right now?">
            Buy the single one from its detail page. The bundle is for people
            who want the whole library on a single transaction, or who want
            to lock in today&rsquo;s price.
          </Faq>
          <Faq q="What happens if prices change later?">
            Your bundle is locked at today&rsquo;s price. If we raise individual
            tracker prices next quarter, you&rsquo;re unaffected.
          </Faq>
          <Faq q="Can I refund the bundle?">
            Yes, within 7 days of purchase as long as you&rsquo;ve downloaded the
            live tracker fewer than 3 times. See the{' '}
            <Link href="/refund">refund policy</Link>.
          </Faq>
        </div>
      </section>
    </section>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="nis-bundle-faq-item">
      <summary>{q}</summary>
      <div className="nis-bundle-faq-body">{children}</div>
    </details>
  );
}

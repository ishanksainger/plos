'use client';

import { ImageSlot } from '@/components/nis/ImageSlot';
import { fmtINR, NIS_MERCH } from '@/lib/nis-data';

const CATEGORIES = ['All', 'Apparel', 'Stationery', 'Stickers', 'Bundles'];

export function ShopPage() {
  return (
    <section className="nis-section">
      <div className="nis-section-head">
        <div>
          <div className="nis-section-eyebrow">03 · Shop</div>
          <h1 className="nis-h2">Small store. Well-made things.</h1>
        </div>
        <p className="nis-section-body">
          A handful of tees, notebooks, and small goods that we use ourselves. Printed in India, shipped India-wide, returns within seven days no questions. Checkout and payments via Razorpay or UPI.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {CATEGORIES.map((c, i) => (
          <button
            key={c}
            className="nis-btn"
            style={i === 0 ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {}}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="nis-merch-grid">
        {NIS_MERCH.map((m) => (
          <button key={m.slot} className="nis-merch">
            <div className="nis-merch-art">
              <ImageSlot
                id={`merch-${m.slot}`}
                placeholder={m.name}
                style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' } as React.CSSProperties}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  fontFamily: 'var(--nis-font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: 'var(--ink-3)',
                }}
              >
                {m.kind}
              </div>
            </div>
            <div className="nis-merch-meta">
              <span className="name">{m.name}</span>
              <span className="price">{fmtINR(m.price)}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

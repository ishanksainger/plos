'use client';

import { ImageSlot } from '@/components/nis/ImageSlot';

const TEAM = [
  { name: 'Ishank', role: 'Code, strategy, ops',    slot: 'about-ishank' },
  { name: 'Nikita', role: 'Brand, 3D, illustration', slot: 'about-nikita' },
];

const BELIEFS: [string, string][] = [
  ['Small is the brief.', 'Two people, one brand, four pillars. We will not build "for everyone."'],
  ['India first.', 'INR, GST, UPI, festival cycles. We will not localize for India later; that is where we start.'],
  ['Quiet by default.', 'No popups, no growth-hack copy. The work shows up; we put a price on it; that is the sales pitch.'],
  ['Sheets first, software next.', 'Spreadsheets fund the runway. PLOS gets to grow slowly, well.'],
];

export function AboutPage() {
  return (
    <section className="nis-section">
      <div className="nis-section-head">
        <div>
          <div className="nis-section-eyebrow">Studio</div>
          <h1 className="nis-h2">A small studio in India.</h1>
        </div>
        <p className="nis-section-body">
          NIS — Nest of Innovative Space — is two people. Ishank writes the code and the strategy. Nikita owns the brand and the 3D scenes. The first product was a freelancer GST tracker on Etsy. The second was a life-OS for ourselves. We&apos;re building both, in public, in India.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 56 }}>
        {TEAM.map((p) => (
          <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                aspectRatio: '4 / 5',
                borderRadius: 'var(--nis-radius-lg)',
                border: '1px solid var(--rule)',
                background: 'var(--bg-card)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <ImageSlot
                id={p.slot}
                placeholder={`Photo of ${p.name}`}
                style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' } as React.CSSProperties}
              />
            </div>
            <div>
              <div className="nis-h3">{p.name}</div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-3)',
                  fontFamily: 'var(--nis-font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}
              >
                {p.role}
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="nis-rule" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 'clamp(28px, 5vw, 72px)', marginTop: 64 }}>
        <div className="nis-section-eyebrow" style={{ marginBottom: 0 }}>What we believe</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {BELIEFS.map(([h, d], i) => (
            <div key={i} style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
              <div className="nis-h3" style={{ marginBottom: 6 }}>{h}</div>
              <div style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

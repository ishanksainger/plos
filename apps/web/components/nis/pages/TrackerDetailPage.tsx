'use client';

import Link from 'next/link';
import { ImageSlot } from '@/components/nis/ImageSlot';
import { TrackerActions } from '@/components/nis/TrackerActions';
import { fmtINR, type Tracker } from '@/lib/nis-data';

export function TrackerDetailPage({ tracker: t }: { tracker: Tracker }) {
  return (
    <section className="nis-section">
      <Link href="/trackers" className="nis-btn" style={{ marginBottom: 28 }}>
        <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
          <path d="M13 5H1m0 0l4-4M1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        All trackers
      </Link>

      <div className="nis-detail">
        <div
          className="nis-detail-art"
          style={{ background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}06)` }}
        >
          <ImageSlot
            id={`tracker-cover-${t.slug}`}
            shape="rounded"
            radius={12}
            placeholder="Drop a sheet screenshot"
            style={{ position: 'absolute', inset: 24 } as React.CSSProperties}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 20,
              right: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--nis-font-mono)',
              fontSize: 11,
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
            }}
          >
            <span>{t.fileType}</span>
            <span>{t.pages} sheets</span>
          </div>
        </div>

        <div>
          <div className="nis-section-eyebrow">Tracker · {t.badge || 'shipping'}</div>
          <h1
            className="nis-h2"
            style={{ fontSize: 'clamp(34px, 4.5vw, 56px)', marginBottom: 16 }}
          >
            {t.title}
          </h1>
          <p
            style={{
              fontSize: 18,
              color: 'var(--ink-2)',
              margin: '0 0 28px',
              maxWidth: '46ch',
              lineHeight: 1.55,
            }}
          >
            {t.tagline}
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 32 }}>
            <span
              style={{
                fontFamily: 'var(--nis-font-mono)',
                fontSize: 32,
                fontWeight: 500,
                color: 'var(--ink-1)',
                letterSpacing: '-0.02em',
              }}
            >
              {fmtINR(t.price)}
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>
              one-time · lifetime access · GST inclusive
            </span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <TrackerActions slug={t.slug} />
          </div>

          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
            {t.desc}
          </p>

          <h3 className="nis-h3" style={{ marginBottom: 14 }}>Inside</h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {t.features.map((f, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, fontSize: 14, color: 'var(--ink-2)' }}>
                <span
                  style={{
                    fontFamily: 'var(--nis-font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    minWidth: 24,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { fmtINR, type Tracker } from '@/lib/nis-data';

export function TrackerCard({ t }: { t: Tracker }) {
  return (
    <Link href={`/trackers/${t.slug}`} className="nis-card" style={{ display: 'block' }}>
      <div
        className="nis-card-art"
        style={{ background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}08)`, position: 'relative' }}
      >
        <svg
          viewBox="0 0 240 160"
          width="80%"
          height="80%"
          style={{ position: 'absolute', inset: '0 auto auto 50%', transform: 'translate(-50%, 14%)', opacity: 0.7 }}
        >
          <rect x="20" y="20" width="200" height="14" rx="2" fill={t.accent} fillOpacity="0.3" />
          {[44, 56, 68, 80, 92, 104, 116, 128].map((y, k) => (
            <rect
              key={y}
              x="20"
              y={y}
              width={[200, 180, 200, 140, 200, 160, 200, 170][k]}
              height="6"
              rx="1"
              fill="currentColor"
              opacity="0.18"
            />
          ))}
        </svg>
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            fontFamily: 'var(--nis-font-mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: 'var(--ink-3)',
          }}
        >
          {t.fileType} · {t.pages} sheets
        </span>
        {t.badge && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 16,
              padding: '4px 10px',
              borderRadius: 999,
              fontFamily: 'var(--nis-font-mono)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              background: t.accent,
              color: 'white',
            }}
          >
            {t.badge}
          </span>
        )}
      </div>
      <div className="card-eyebrow">
        <span className="dot" style={{ background: t.accent }} />
        Tracker
      </div>
      <h3 className="card-title">{t.title}</h3>
      <p className="card-desc">{t.tagline}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-price">{fmtINR(t.price)}</span>
        <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 500, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          See inside
          <svg width="12" height="9" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

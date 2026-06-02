'use client';

import Link from 'next/link';
import { formatINR } from '@/lib/tracker-catalog';
import type { Ebook } from '@/lib/ebook-catalog';

export function EbookCard({ e }: { e: Ebook }) {
  return (
    <Link href={`/ebooks/${e.slug}`} className="nis-card" style={{ display: 'block' }}>
      <div
        className="nis-card-art"
        style={{ background: `linear-gradient(135deg, ${e.accent}22, ${e.accent}08)`, position: 'relative' }}
      >
        {/* A stylised book cover so e-books read differently from trackers at a glance. */}
        <svg
          viewBox="0 0 240 160"
          width="62%"
          height="82%"
          style={{ position: 'absolute', inset: '0 auto auto 50%', transform: 'translate(-50%, 12%)', opacity: 0.85 }}
          aria-hidden
        >
          <rect x="74" y="14" width="92" height="132" rx="6" fill={e.accent} fillOpacity="0.32" />
          <rect x="74" y="14" width="14" height="132" rx="6" fill="currentColor" opacity="0.16" />
          {[34, 48, 62, 76, 90].map((y, k) => (
            <rect
              key={y}
              x="98"
              y={y}
              width={[54, 44, 50, 36, 48][k]}
              height="5"
              rx="1"
              fill="currentColor"
              opacity="0.2"
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
          {e.formatLabel ?? e.fileType} · {e.pages} pp
        </span>
        {e.badge && (
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
              background: e.accent,
              color: 'white',
            }}
          >
            {e.badge}
          </span>
        )}
      </div>
      <div className="card-eyebrow">
        <span className="dot" style={{ background: e.accent }} />
        E-book
      </div>
      <h3 className="card-title">{e.title}</h3>
      <p className="card-desc">{e.tagline}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-price">{e.active ? formatINR(e.pricePaise) : 'Coming soon'}</span>
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

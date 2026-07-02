'use client';

import { Carousel } from '@/components/nis/Carousel';
import { LOOKBOOK } from '@/lib/lookbook-data';

export function LookbookPage() {
  return (
    <section className="nis-section">
      <div className="nis-section-head">
        <div>
          <div className="nis-section-eyebrow">Lookbook</div>
          <h1 className="nis-h2">Designs from the nest.</h1>
        </div>
        <p className="nis-section-body">
          A living gallery of the posts, carousels and canvases we make for NIS
          — the same design quality that goes into every tracker and template.
          Swipe through any set. New drops land here first.
        </p>
      </div>

      <div className="nis-lookbook-grid">
        {LOOKBOOK.map((item) => (
          <figure key={item.slug} style={{ margin: 0 }}>
            <Carousel slides={item.slides} alt={item.title} accent={item.accent} />
            <figcaption
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--nis-font-mono)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    color: item.accent,
                    marginBottom: 6,
                  }}
                >
                  {item.category}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--nis-font-display)',
                    fontSize: 17,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'var(--ink-1)',
                    lineHeight: 1.3,
                    maxWidth: '32ch',
                  }}
                >
                  {item.title}
                </div>
              </div>
              {item.keyword && (
                <span
                  title={`Instagram DM keyword: ${item.keyword}`}
                  style={{
                    flexShrink: 0,
                    fontFamily: 'var(--nis-font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    padding: '4px 9px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                    background: `${item.accent}1f`,
                    color: item.accent,
                  }}
                >
                  DM · {item.keyword}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <p
        style={{
          marginTop: 40,
          fontSize: 13,
          color: 'var(--ink-3)',
          fontFamily: 'var(--nis-font-mono)',
          letterSpacing: '0.02em',
        }}
      >
        Want designs like these for your own business? Explore the{' '}
        <a href="/canvas" style={{ color: 'var(--ink-1)', textDecoration: 'underline' }}>
          Canvas
        </a>{' '}
        and{' '}
        <a href="/trackers" style={{ color: 'var(--ink-1)', textDecoration: 'underline' }}>
          Trackers
        </a>
        .
      </p>
    </section>
  );
}

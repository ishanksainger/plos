'use client';

import { ImageSlot } from '@/components/nis/ImageSlot';

const TONES = [
  'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(236,72,153,0.2))',
  'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(124,58,237,0.2))',
  'linear-gradient(135deg, rgba(236,72,153,0.4), rgba(245,158,11,0.2))',
  'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(59,130,246,0.2))',
  'linear-gradient(135deg, rgba(245,158,11,0.4), rgba(236,72,153,0.2))',
  'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(16,185,129,0.2))',
];

const SPANS: React.CSSProperties[] = [
  { gridColumn: 'span 2', gridRow: 'span 2' },
  {}, {}, {}, {}, {},
];

const NAMES = ['Nest', 'Marigold', 'Inkwell', 'Tide', 'Hearth', 'Loom'];

export function CanvasPage() {
  return (
    <section className="nis-section">
      <div className="nis-section-head">
        <div>
          <div className="nis-section-eyebrow">02 · Canvas</div>
          <h1 className="nis-h2">Scenes that hold a feeling.</h1>
        </div>
        <p className="nis-section-body">
          Nikita&apos;s room. Six original 3D and motion scenes — built in Spline, rendered in browsers, exported for slides, posters, and merch. Each one drops into a marketing page through a single iframe.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gridAutoRows: '280px',
          gap: 20,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...SPANS[i],
              borderRadius: 'var(--nis-radius-lg)',
              border: '1px solid var(--rule)',
              background: TONES[i],
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <ImageSlot
              id={`canvas-scene-${i}`}
              placeholder={`Spline scene ${String(i + 1).padStart(2, '0')}`}
              style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' } as React.CSSProperties}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 16,
                right: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                color: 'white',
                mixBlendMode: 'difference',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--nis-font-mono)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    opacity: 0.8,
                  }}
                >
                  Scene {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--nis-font-display)',
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {NAMES[i]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

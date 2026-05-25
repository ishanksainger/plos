import { ImageResponse } from 'next/og';
import { NIS_TRACKERS, fmtINR } from '@/lib/nis-data';

export const runtime = 'nodejs';
export const alt = 'NIS Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const t = NIS_TRACKERS.find((x) => x.slug === params.slug);
  return [
    {
      id: params.slug,
      alt: t ? `${t.title} — NIS` : 'NIS Tracker',
      contentType,
      size,
    },
  ];
}

export default function Image({ params }: { params: { slug: string } }) {
  const t = NIS_TRACKERS.find((x) => x.slug === params.slug);
  const title = t?.title ?? 'NIS Tracker';
  const tagline = t?.tagline ?? '';
  const price = t ? fmtINR(t.price) : '';
  const accent = t?.accent ?? '#7c3aed';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          backgroundImage: `radial-gradient(900px 600px at 18% 25%, ${accent}55, transparent 60%), radial-gradient(700px 500px at 90% 110%, rgba(236,72,153,0.20), transparent 60%)`,
          padding: '72px 88px',
          color: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'conic-gradient(from 220deg, #7c3aed, #ec4899, #3b82f6, #7c3aed)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.18) inset',
            }}
          />
          <div style={{ fontSize: 22, color: '#a3a3a3', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            NIS · Trackers
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              maxWidth: 1020,
            }}
          >
            {title}
          </div>
          {tagline && (
            <div style={{ fontSize: 24, color: '#a3a3a3', maxWidth: 940, lineHeight: 1.4 }}>
              {tagline}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          {price ? (
            <div style={{ fontSize: 44, fontWeight: 600, color: accent, letterSpacing: '-0.02em' }}>
              {price}
            </div>
          ) : (
            <span />
          )}
          <div style={{ fontSize: 18, color: '#737373', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            thenispace.com/trackers/{params.slug}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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

export default async function Image({ params }: { params: { slug: string } }) {
  // next/og's own font has no ₹ (its Google Fonts fallback fails), so the price showed a box:
  // the same Noto Sans plus Inter's ₹ glyph alone (both OFL)
  const [noto, rupee] = await Promise.all(
    ['noto-sans-latin-regular.ttf', 'inter-rupee.otf'].map((f) => readFile(join(process.cwd(), 'assets/og', f))),
  );
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
          // satori rejects two px radii, so glow sizes are % of the 1200x630 card
          backgroundImage: `radial-gradient(75% 95% at 18% 25%, ${accent}55, transparent 60%), radial-gradient(58% 79% at 90% 110%, rgba(236,72,153,0.20), transparent 60%)`,
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
              // next/og (satori) has no conic-gradient: it fails the whole image
              backgroundImage: 'linear-gradient(135deg, #7c3aed, #ec4899 55%, #3b82f6)',
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
            {`thenispace.com/trackers/${params.slug}`}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto Sans', data: noto, weight: 400, style: 'normal' },
        { name: 'Inter', data: rupee, weight: 400, style: 'normal' },
      ],
    },
  );
}

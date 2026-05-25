import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NIS — Nest of Innovative Space';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          backgroundImage:
            'radial-gradient(900px 600px at 12% 30%, rgba(124,58,237,0.32), transparent 60%), ' +
            'radial-gradient(800px 500px at 88% 10%, rgba(236,72,153,0.18), transparent 60%), ' +
            'radial-gradient(700px 500px at 60% 100%, rgba(59,130,246,0.22), transparent 60%)',
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
              width: 56,
              height: 56,
              borderRadius: 16,
              background:
                'conic-gradient(from 220deg, #7c3aed, #ec4899, #3b82f6, #7c3aed)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.18) inset',
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
            NIS
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 0.96,
              maxWidth: 980,
            }}
          >
            A creative nest.{' '}
            <span style={{ color: '#a78bfa', fontStyle: 'italic' }}>Built for India.</span>
          </div>
          <div style={{ fontSize: 26, color: '#a3a3a3', maxWidth: 880, lineHeight: 1.35 }}>
            INR-native trackers, canvases, merch, and PLOS — the personal life operating system.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 18,
            color: '#737373',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span>thenispace.com</span>
          <span>est. 2026 · pune + mumbai</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

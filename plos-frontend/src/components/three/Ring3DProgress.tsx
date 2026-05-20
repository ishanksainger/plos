import { useEffect, useRef, useState } from 'react';

/**
 * Ring3DProgress
 * ─────────────────────────────────────────────────────────────
 * A pseudo-3D progress ring rendered with a CSS conic-gradient
 * + inset shadows. We dropped the WebGL implementation because
 * the dashboard already runs 3 WebGL canvases (hero / bar / pie)
 * and adding a fourth was pushing the browser past its global
 * WebGL-context budget — when that limit is breached a stale
 * context gets force-killed and the surrounding tree blanks out.
 *
 * Visually: the ring still feels volumetric thanks to the inner
 * highlight, dropshadow, and animated fill.
 */

interface Props {
  /** 0 – 100 */
  pct: number;
  color?: string;
  /** Brand violet gradient ring with a soft outer glow. */
  premium?: boolean;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const Ring3DProgress = ({ pct, color = '#8b5cf6', premium = false }: Props) => {
  const target = Math.max(0, Math.min(100, pct));
  const [shown, setShown] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  // Ease the value from 0 to target on mount and on prop change.
  useEffect(() => {
    fromRef.current = shown;
    startRef.current = null;
    let raf = 0;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const k = Math.min(1, (t - startRef.current) / 850);
      const v = fromRef.current + (target - fromRef.current) * easeOutCubic(k);
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const angle = (shown / 100) * 360;
  const trackColor = '#e5e5ea';
  const innerBg = '#ffffff';
  const textColor = '#1a1f2e';
  const subColor = '#7a8499';

  const ringBackground = premium
    ? angle < 0.5
      ? `conic-gradient(from -90deg, ${trackColor} 0deg 360deg)`
      : `conic-gradient(from -90deg, var(--plos-accent-from) 0deg, var(--plos-accent-to) ${angle * 0.52}deg, var(--plos-accent-from) ${angle}deg, ${trackColor} ${angle}deg 360deg)`
    : `conic-gradient(${color} 0deg ${angle}deg, ${trackColor} ${angle}deg 360deg)`;

  const ringShadow = premium
    ? `
            0 0 36px -10px rgba(124,77,255,0.35),
            0 14px 28px -14px rgba(15,23,42,0.12),
            inset 0 4px 12px rgba(255,255,255,0.75),
            inset 0 -6px 14px rgba(124,77,255,0.08)
          `
    : `
            0 18px 36px -18px ${color}88,
            inset 0 4px 12px rgba(255,255,255,0.6),
            inset 0 -6px 16px rgba(0,0,0,0.18)
          `;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {premium && angle >= 0.5 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 'min(188px, 94%)',
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            background: `conic-gradient(from -90deg, var(--plos-accent-from) 0deg, var(--plos-accent-to) ${angle * 0.55}deg, transparent ${angle}deg)`,
            filter: 'blur(18px)',
            opacity: 0.42,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width: 'min(176px, 90%)',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          background: ringBackground,
          boxShadow: ringShadow,
          transition: 'background 80ms linear, box-shadow 0.25s ease',
        }}
      >
        {/* Inner cutout */}
        <div
          style={{
            position: 'absolute',
            inset: '15%',
            borderRadius: '50%',
            background: innerBg,
            boxShadow: 'inset 0 4px 14px rgba(15,23,42,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: premium ? 'clamp(26px, 5vw, 40px)' : 'clamp(22px, 4.6vw, 36px)',
              fontWeight: 800,
              color: textColor,
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {Math.round(shown)}%
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: subColor,
              marginTop: 4,
            }}
          >
            Done
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ring3DProgress;

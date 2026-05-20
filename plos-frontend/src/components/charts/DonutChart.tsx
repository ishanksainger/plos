import { useEffect, useId, useMemo, useState } from 'react';

/**
 * DonutChart
 * ─────────────────────────────────────────────────────────────
 * A Google-Data-Studio-style SVG donut chart.
 *
 *   • Slices animate from 0 to their target arc on mount.
 *   • Each slice has a gentle gradient and a thin gap between
 *     neighbours so the segments are always distinguishable.
 *   • Hover scales the slice outward, dims its peers, and
 *     swaps the center readout to the slice's value/label.
 *   • Single-slice charts still look 3D-ish thanks to the inner
 *     drop-shadow and gradient.
 *   • Pure SVG — no GL contexts, no perf cost during navigation.
 */

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutDatum[];
  /** What the center "TOTAL" line should say. */
  totalLabel?: string;
}

const VIEW = 320;
const CENTER = VIEW / 2;
const OUTER_R = 130;
const INNER_R = 78;
const ACCENT_RING_R = OUTER_R + 5;
const ACCENT_RING_C = 2 * Math.PI * ACCENT_RING_R;
const HOVER_BOOST = 6;
const GAP_DEG = 1.6;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/** Build an SVG arc path between two angles for the inner+outer ring. */
const buildArcPath = (startDeg: number, endDeg: number, outer: number, inner: number): string => {
  const sweep = endDeg - startDeg;
  if (sweep <= 0) return '';
  const largeArc = sweep > 180 ? 1 : 0;

  const o1 = polar(CENTER, CENTER, outer, startDeg);
  const o2 = polar(CENTER, CENTER, outer, endDeg);
  const i1 = polar(CENTER, CENTER, inner, endDeg);
  const i2 = polar(CENTER, CENTER, inner, startDeg);

  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
};

const DonutChart = ({ data, totalLabel = 'TOTAL' }: Props) => {
  const uid = useId();

  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((s, d) => s + Math.max(0, d.value), 0), [data]);
  const safeTotal = total <= 0 ? 1 : total;

  // Animate the arcs on mount.
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const run = (t: number) => {
      if (start === null) start = t;
      const k = Math.min(1, (t - start) / 800);
      setProgress(easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    setProgress(0);
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [data.length]);

  const sliceMeta = useMemo(() => {
    let acc = 0;
    return data.map((d) => {
      const start = (acc / safeTotal) * 360;
      acc += Math.max(0, d.value);
      const end = (acc / safeTotal) * 360;
      return { ...d, start, end, mid: (start + end) / 2 };
    });
  }, [data, safeTotal]);

  const trackColor = '#E2DCD2';
  const innerBg = '#ffffff';
  const totalColor = '#14121C';
  const subColor = '#554F60';
  const shadowOpacity = 0.12;

  const isEmpty = total <= 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', maxWidth: 360, maxHeight: 360, display: 'block' }}
      >
        <defs>
          {/* per-slice gradients — top brighter, bottom darker */}
          {data.map((d, i) => (
            <linearGradient key={i} id={`${uid}-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.color} stopOpacity={0.98} />
              <stop offset="100%" stopColor={d.color} stopOpacity={0.82} />
            </linearGradient>
          ))}
          <linearGradient id={`${uid}-accent-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#7b2fbe" stopOpacity={0.6} />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity={shadowOpacity} />
          </filter>
        </defs>

        {/* Background track ring (visible while slices are still animating in / when empty) */}
        <circle cx={CENTER} cy={CENTER} r={(OUTER_R + INNER_R) / 2} fill="none" stroke={trackColor} strokeWidth={OUTER_R - INNER_R} />

        {/* Accent ring — stroke-dashoffset draw-on for premium motion */}
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ACCENT_RING_R}
            fill="none"
            stroke={`url(#${uid}-accent-ring)`}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${ACCENT_RING_C * progress} ${ACCENT_RING_C}`}
            strokeDashoffset={0}
            opacity={0.7}
          />
        </g>

        {/* Slices */}
        <g filter={`url(#${uid}-soft)`}>
          {sliceMeta.map((s, i) => {
            const sweep = s.end - s.start;
            // animated end angle — each slice grows at the same eased rate
            const animEnd = s.start + sweep * progress;
            // shrink the end by half a gap each side so neighbouring slices have a hairline between them
            const halfGap = sweep > GAP_DEG * 2 ? GAP_DEG / 2 : 0;
            const drawStart = s.start + halfGap;
            const drawEnd = Math.max(drawStart, animEnd - halfGap);

            const isHover = hover === i;
            const isOther = hover !== null && hover !== i;
            const outer = isHover ? OUTER_R + HOVER_BOOST : OUTER_R;
            const inner = isHover ? INNER_R - 2 : INNER_R;

            const path = buildArcPath(drawStart, drawEnd, outer, inner);
            if (!path) return null;

            return (
              <path
                key={s.label + i}
                d={path}
                fill={`url(#${uid}-grad-${i})`}
                strokeLinejoin="round"
                opacity={isOther ? 0.45 : 1}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 160ms ease',
                }}
              />
            );
          })}
        </g>

        {/* Inner cut-out — masks any sub-pixel artifacts and gives the donut its "hole" */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_R - 1}
          fill={innerBg}
        />
      </svg>

      {/* HTML overlay for the center label — keeps fonts crisp and respects theme */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: totalColor,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {hover !== null && sliceMeta[hover] ? sliceMeta[hover].value : total}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: subColor,
            marginTop: 4,
          }}
        >
          {hover !== null && sliceMeta[hover] ? sliceMeta[hover].label : totalLabel}
        </div>
        {isEmpty && (
          <div style={{ fontSize: 11, color: subColor, marginTop: 10, opacity: 0.7 }}>
            no data yet
          </div>
        )}
      </div>
    </div>
  );
};

export default DonutChart;

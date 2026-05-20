import { useEffect, useId, useMemo, useState } from 'react';

export interface AreaDatum {
  label: string;
  value: number;
}

/** How SVG maps to container: `contain` (default), crop-to-fill (`cover`), or stretch (`fill`). */
export type SvgChartFit = 'contain' | 'cover' | 'fill';

const aspectForFit = (fit: SvgChartFit) =>
  fit === 'fill' ? 'none' : fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';

const VIEW_W = 800;
const VIEW_H = 360;
const PAD_TOP = 36;
const PAD_BOTTOM = 48;
const PAD_LEFT = 52;
const PAD_RIGHT = 20;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const niceMax = (max: number): number => {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * exp;
};

/**
 * Area chart for financial pressure — light card, purple fill.
 */
const FinancialAreaChart = ({
  data,
  format = (n) => String(n),
  fit = 'contain',
}: {
  data: AreaDatum[];
  format?: (n: number) => string;
  /** Use `fill` in compact dashboard tiles so the plot uses the full card width. */
  fit?: SvgChartFit;
}) => {
  const uid = useId().replace(/:/g, '');

  const [anim, setAnim] = useState(0);

  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const innerW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = PAD_LEFT + (data.length <= 1 ? innerW / 2 : (i / Math.max(1, data.length - 1)) * innerW);
      const ratio = d.value > 0 ? d.value / max : 0;
      const y = PAD_TOP + innerH - ratio * innerH;
      return { x, y, label: d.label, value: d.value };
    });
  }, [data, max, innerW, innerH]);

  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const baseY = PAD_TOP + innerH;
    let d = `M ${points[0].x} ${baseY} L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ` L ${points[points.length - 1].x} ${baseY} Z`;
    return d;
  }, [points]);

  const linePath = useMemo(() => {
    if (!points.length) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }, [points]);

  useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const run = (t: number) => {
      if (t0 === null) t0 = t;
      const k = Math.min(1, (t - t0) / 900);
      setAnim(easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    setAnim(0);
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [data.length]);

  const axisMuted = '#554F60';
  const gridMuted = '#EAE6DE';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio={aspectForFit(fit)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(149,117,205,0.14)" />
            <stop offset="100%" stopColor="rgba(94,53,177,0)" />
          </linearGradient>
        </defs>

        {/* horizontal grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PAD_TOP + innerH * (1 - t);
          return (
            <line
              key={i}
              x1={PAD_LEFT}
              x2={VIEW_W - PAD_RIGHT}
              y1={y}
              y2={y}
              stroke={gridMuted}
              strokeWidth={1}
              strokeDasharray={i === 0 ? '0' : '3 6'}
            />
          );
        })}

        {/* y tick labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PAD_TOP + innerH * (1 - t);
          const val = max * t;
          return (
            <text
              key={`y-${i}`}
              x={PAD_LEFT - 8}
              y={y + 4}
              textAnchor="end"
              fill={axisMuted}
              fontSize={10}
              style={{ fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }}
            >
              {format(val)}
            </text>
          );
        })}

        {/* area (clipped vertically by anim) */}
        <clipPath id={`${uid}-clip`}>
          <rect x={0} y={0} width={VIEW_W * anim} height={VIEW_H} />
        </clipPath>
        <g clipPath={`url(#${uid}-clip)`}>
          <path d={areaPath} fill={`url(#${uid}-area)`} />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* x labels */}
        {points.map((p, i) => (
          <text
            key={p.label + i}
            x={p.x}
            y={VIEW_H - PAD_BOTTOM + 22}
            textAnchor="middle"
            fill={axisMuted}
            fontSize={10}
            style={{ fontFamily: 'inherit' }}
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default FinancialAreaChart;

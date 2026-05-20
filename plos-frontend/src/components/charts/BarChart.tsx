import { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * BarChart
 * ─────────────────────────────────────────────────────────────
 * A Google-Data-Studio-style SVG bar chart — clean 2D rendering
 * with gradient fills, animated entry, hover tooltip, and a
 * theme-aware grid.
 *
 * We dropped the WebGL bar implementation because it didn't
 * communicate sparse data well (most bars at 0 vanished into
 * the floor) and it was adding to the page-wide WebGL context
 * budget. Pure SVG renders crisp at any DPI, animates cheaply,
 * and reads clearly on the app’s light surfaces.
 */

export interface BarDatum {
  label: string;
  value: number;
}

interface Props {
  data: BarDatum[];
  /** Hex color used for the gradient fill. */
  color?: string;
  /** When true, bars use brand accent gradient (violet) with a soft glow. */
  premiumFill?: boolean;
  /** Formats the y-axis ticks and tooltip values. */
  format?: (n: number) => string;
}

const VIEW_W = 800;
const VIEW_H = 360;
const PAD_TOP = 32;
const PAD_BOTTOM = 44;
const PAD_LEFT = 56;
const PAD_RIGHT = 24;

/** Pick "nice" tick values so the y-axis lines up on round numbers. */
const niceMax = (max: number): number => {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * exp;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const BarChart = ({ data, color = '#5a9270', premiumFill = false, format = (n) => String(n) }: Props) => {
  const gradientId = useId();

  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const gridColor = '#EAE6DE';
  const axisLabelColor = '#554F60';
  const valueLabelColor = '#14121C';
  const placeholderColor = '#EDEAE2';
  const tooltipBg = '#ffffff';
  const tooltipBorder = '#E2DCD2';
  const tooltipText = '#14121C';
  const tooltipSub = '#7A7385';

  // Geometry.
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const innerW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const stride = data.length ? innerW / data.length : innerW;
  const barW = Math.max(8, Math.min(60, stride * 0.55));

  const ticks = useMemo(() => {
    const STEPS = 4;
    return Array.from({ length: STEPS + 1 }, (_, i) => (max * i) / STEPS);
  }, [max]);

  // Animate bars on mount + when the dataset length changes.
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const run = (t: number) => {
      if (start === null) start = t;
      const k = Math.min(1, (t - start) / 700);
      setProgress(easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    setProgress(0);
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [data.length]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {premiumFill ? (
              <>
                <stop offset="0%" stopColor="var(--plos-accent-from)" stopOpacity={1} />
                <stop offset="45%" stopColor="var(--plos-accent-to)" stopOpacity={0.85} />
                <stop offset="100%" stopColor="var(--plos-accent-from)" stopOpacity={0} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={color} stopOpacity={0.65} />
              </>
            )}
          </linearGradient>
          <filter id={`${gradientId}-shadow`} x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation={premiumFill ? 5 : 4}
              floodColor={premiumFill ? 'var(--plos-accent-from)' : color}
              floodOpacity={premiumFill ? 0.28 : 0.22}
            />
          </filter>
          <filter id={`${gradientId}-barGlow`} x="-55%" y="-55%" width="210%" height="210%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="var(--plos-accent-from)" floodOpacity="0.34" />
          </filter>
        </defs>

        {/* Y-axis grid + tick labels */}
        {ticks.map((t, i) => {
          const y = PAD_TOP + innerH - (t / max) * innerH;
          return (
            <g key={i}>
              <line
                x1={PAD_LEFT}
                x2={VIEW_W - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray={i === 0 ? '0' : '3 4'}
              />
              <text
                x={PAD_LEFT - 10}
                y={y + 4}
                fontSize={11}
                textAnchor="end"
                fill={axisLabelColor}
                style={{ fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }}
              >
                {format(t)}
              </text>
            </g>
          );
        })}

        {/* Bars + x labels */}
        {data.map((d, i) => {
          const cx = PAD_LEFT + i * stride + stride / 2;
          const x = cx - barW / 2;
          const ratio = d.value > 0 ? d.value / max : 0;
          const fullH = ratio * innerH;
          const h = fullH * progress;
          const y = PAD_TOP + innerH - h;
          const isHover = hover === i;

          return (
            <g
              key={d.label + i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
              style={{ cursor: d.value > 0 ? 'pointer' : 'default' }}
            >
              {/* faint background slot so empty months still register */}
              <rect
                x={x}
                y={PAD_TOP + innerH - 3}
                width={barW}
                height={3}
                rx={1.5}
                fill={placeholderColor}
              />

              {d.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={Math.min(6, barW / 4)}
                  fill={`url(#${gradientId})`}
                  filter={
                    premiumFill
                      ? `url(#${gradientId}-barGlow)`
                      : isHover
                        ? `url(#${gradientId}-shadow)`
                        : undefined
                  }
                  style={{ transition: 'filter 120ms ease' }}
                />
              )}

              {/* hover hit area covering the full column */}
              <rect
                x={cx - stride / 2}
                y={PAD_TOP}
                width={stride}
                height={innerH}
                fill="transparent"
              />

              {/* x-axis label */}
              <text
                x={cx}
                y={VIEW_H - PAD_BOTTOM + 22}
                fontSize={12}
                textAnchor="middle"
                fill={isHover ? valueLabelColor : axisLabelColor}
                style={{ fontFamily: 'inherit', fontWeight: isHover ? 600 : 500, transition: 'fill 120ms ease' }}
              >
                {d.label}
              </text>

              {/* persistent value cap (shown when bar is non-zero and animation is mostly done) */}
              {d.value > 0 && progress > 0.85 && (
                <text
                  x={cx}
                  y={y - 8}
                  fontSize={11}
                  textAnchor="middle"
                  fill={valueLabelColor}
                  opacity={isHover ? 1 : 0.7}
                  style={{ fontFamily: 'inherit', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                >
                  {format(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip — positioned over the bar in absolute coords */}
      {hover !== null && data[hover] && data[hover].value > 0 && (
        <Tooltip
          label={data[hover].label}
          value={format(data[hover].value)}
          xPct={
            ((PAD_LEFT + hover * stride + stride / 2) / VIEW_W) * 100
          }
          bg={tooltipBg}
          border={tooltipBorder}
          color={tooltipText}
          sub={tooltipSub}
        />
      )}
    </div>
  );
};

interface TooltipProps {
  label: string;
  value: string;
  xPct: number;
  bg: string;
  border: string;
  color: string;
  sub: string;
}

const Tooltip = ({ label, value, xPct, bg, border, color, sub }: TooltipProps) => (
  <div
    style={{
      position: 'absolute',
      left: `${xPct}%`,
      top: 8,
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 8,
      padding: '6px 10px',
      boxShadow: '0 8px 24px rgba(20, 18, 28, 0.14)',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
    }}
  >
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: sub }}>
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
      {value}
    </div>
  </div>
);

export default BarChart;

import { useEffect, useId, useMemo, useState } from 'react';
import type { ActivitySeriesPoint } from '../../types/dashboard';

export type SvgChartFit = 'contain' | 'cover' | 'fill';

const aspectForFit = (fit: SvgChartFit) =>
  fit === 'fill' ? 'none' : fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';

const VIEW_W = 320;
const VIEW_H = 140;
const PAD = 12;
const GRID_DEFAULT = '#EAE6DE';
const GRID_ON_DARK = 'rgba(255,255,255,0.14)';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type ActivityLineChartProps = {
  series: ActivitySeriesPoint[];
  /** Brighter stroke and grid for purple / dark panels. */
  variant?: 'default' | 'onDark';
  /** Use `fill` in compact dashboard tiles so the stroke uses full card geometry. */
  fit?: SvgChartFit;
};

/**
 * Compact line chart for dashboard Activity panel (completion counts per day).
 */
const ActivityLineChart = ({ series, variant = 'default', fit = 'contain' }: ActivityLineChartProps) => {
  const gradId = `activity-area-${useId().replace(/:/g, '')}`;
  const onDark = variant === 'onDark';
  const GRID = onDark ? GRID_ON_DARK : GRID_DEFAULT;
  const [anim, setAnim] = useState(0);

  const values = useMemo(
    () => (series.length > 0 ? series.map((s) => s.count) : [0]),
    [series],
  );

  const seriesKey = useMemo(() => values.join(','), [values]);

  useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const run = (t: number) => {
      if (t0 === null) t0 = t;
      const k = Math.min(1, (t - t0) / 800);
      setAnim(easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    setAnim(0);
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [seriesKey]);

  const max = Math.max(...values, 1);
  const innerW = VIEW_W - PAD * 2;
  const innerH = VIEW_H - PAD * 2;
  const n = values.length;
  const xDenom = Math.max(n - 1, 1);
  const pts = values.map((v, i) => ({
    x: PAD + (i / xDenom) * innerW,
    y: PAD + innerH - (v / max) * innerH,
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }

  const areaPath = `${d} L ${pts[pts.length - 1].x} ${VIEW_H - PAD} L ${pts[0].x} ${VIEW_H - PAD} Z`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio={aspectForFit(fit)}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          {onDark ? (
            <>
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="rgba(149,117,205,0.15)" />
              <stop offset="100%" stopColor="rgba(94,53,177,0)" />
            </>
          )}
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t, i) => {
        const y = PAD + innerH * (1 - t);
        return (
          <line key={i} x1={PAD} x2={VIEW_W - PAD} y1={y} y2={y} stroke={GRID} strokeWidth={1} strokeDasharray={i === 1 ? '3 6' : '0'} />
        );
      })}
      <path d={areaPath} fill={`url(#${gradId})`} opacity={anim} />
      <path
        d={d}
        fill="none"
        stroke={onDark ? '#ffffff' : 'var(--accent)'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - anim}
      />
    </svg>
  );
};

export default ActivityLineChart;

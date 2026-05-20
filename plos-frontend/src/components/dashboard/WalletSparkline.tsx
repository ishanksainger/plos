import { useMemo } from 'react';

export interface WalletSparklineProps {
  /** Non-negative series; length ≥ 2 recommended. */
  values: number[];
  /** Stroke color (CSS). */
  stroke?: string;
  /** Optional fill under the line. */
  fill?: string;
  height?: number;
}

/**
 * Renders a compact SVG sparkline for metric cards (myWallet-style KPI strip).
 */
export function WalletSparkline({
  values,
  stroke = 'var(--accent)',
  fill = 'rgba(142, 112, 255, 0.12)',
  height = 44,
}: WalletSparklineProps) {
  const w = 120;
  const pad = 2;
  const path = useMemo(() => {
    const v = values.length ? values : [0, 0];
    const max = Math.max(...v, 1);
    const min = Math.min(...v, 0);
    const span = Math.max(max - min, 1e-6);
    const step = v.length <= 1 ? 0 : (w - pad * 2) / (v.length - 1);
    const pts = v.map((n, i) => {
      const x = pad + i * step;
      const y = pad + (1 - (n - min) / span) * (height - pad * 2);
      return { x, y };
    });
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    const baseY = height - pad;
    const area = `${d} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
    return { d, area };
  }, [values, height]);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d={path.area} fill={fill} />
      <path
        d={path.d}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Computes week-over-week trend from the last two aggregates of a series.
 *
 * @returns Integer percent change; 0 when undefined.
 */
export function percentDeltaFromTail(values: number[]): number {
  if (values.length < 2) return 0;
  const a = values[values.length - 2] ?? 0;
  const b = values[values.length - 1] ?? 0;
  if (a === 0) return b > 0 ? 100 : 0;
  return Math.round(((b - a) / Math.max(a, 1e-6)) * 100);
}

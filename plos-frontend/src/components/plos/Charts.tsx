/**
 * Lightweight SVG chart primitives used by the Insights dashboard.
 * Ported from the prototype's insights.jsx.
 */

type AreaPoint = { label: string; val: number };

export function AreaChart({
  data,
  height = 180,
  color = '#7c3aed',
}: {
  data: AreaPoint[];
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const w = 600;
  const values = data.map((d) => d.val);
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.9;
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: i * step,
    y: height - 24 - ((d.val - min) / range) * (height - 40),
    label: d.label,
  }));
  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const fillD = `${pathD} L ${w} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} />
          <text x={p.x} y={height - 6} fontSize="10" fill="var(--plos-ink-3)" textAnchor="middle" fontFamily="var(--nis-font-mono)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

type DonutSlice = { name: string; color: string; count: number; share: number };

export function DonutChart({
  data,
  size = 180,
  thickness = 22,
  centerLabel = 'RESPONSIBILITIES',
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--plos-rule)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = C * d.share;
        const dash = `${len} ${C - len}`;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize="22"
        fontWeight="600"
        fill="var(--plos-ink-1)"
        fontFamily="var(--nis-font-display)"
        letterSpacing="-0.03em"
      >
        {data.reduce((s, d) => s + d.count, 0)}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="10"
        fill="var(--plos-ink-3)"
        fontFamily="var(--nis-font-mono)"
        letterSpacing="0.1em"
      >
        {centerLabel}
      </text>
    </svg>
  );
}

/**
 * Big completion ring with gradient stroke + center value/label.
 * Used on Insights to show the overall completion rate.
 */
export function CompletionRing({
  value,
  size = 180,
  thickness = 14,
  centerLabel = 'COMPLETE',
  gradientId = 'cr-grad-default',
}: {
  /** Percent 0..100 */
  value: number;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  /** Unique id required when multiple rings on one page */
  gradientId?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = C * (1 - clamped / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--plos-rule)" strokeWidth={thickness} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize="34"
        fontWeight="600"
        fontFamily="var(--nis-font-display)"
        fill="var(--plos-ink-1)"
        letterSpacing="-0.03em"
      >
        {clamped}
        <tspan fontSize="18" fill="var(--plos-ink-3)">%</tspan>
      </text>
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        fontSize="9"
        fill="var(--plos-ink-3)"
        fontFamily="var(--nis-font-mono)"
        letterSpacing="0.15em"
      >
        {centerLabel}
      </text>
    </svg>
  );
}

/**
 * Compact horizontal sparkline used in inline category lists.
 */
export function Sparkline({
  data,
  width = 80,
  height = 22,
  color = '#7c3aed',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: i * step,
    y: height - 3 - ((v - min) / range) * (height - 6),
  }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill={color} />
    </svg>
  );
}

export function Bars({
  data,
  height = 140,
  color = '#7c3aed',
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            background: color,
            opacity: 0.4 + (v / max) * 0.6,
            borderRadius: 4,
            minHeight: 6,
          }}
        />
      ))}
    </div>
  );
}

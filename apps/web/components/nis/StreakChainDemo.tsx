'use client';

type DemoHabit = {
  color: string;
  pattern: number[]; // 1 = done, 0 = missed, -1 = pending today
};

export function StreakChainDemo({ habit }: { habit: DemoHabit }) {
  const days = habit.pattern.length;
  const w = 800;
  const h = 80;
  const padX = 14;
  const cy = 40;
  const r = 7;
  const step = (w - padX * 2) / (days - 1);

  const segments: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] | null = null;
  habit.pattern.forEach((v, i) => {
    if (v === 1) {
      const x = padX + i * step;
      if (!current) current = [];
      current.push({ x, y: cy });
    } else if (current) {
      segments.push(current);
      current = null;
    }
  });
  if (current) segments.push(current);

  const curvePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 1) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const mx = (p0.x + p1.x) / 2;
      const wave = (i % 2 === 0 ? -1 : 1) * 5;
      d += ` C ${mx} ${p0.y + wave}, ${mx} ${p1.y - wave}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: '100%', height: 90, display: 'block' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="nisDemoGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={habit.color} stopOpacity="0.4" />
            <stop offset="60%" stopColor={habit.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={habit.color} stopOpacity="1" />
          </linearGradient>
          <filter id="nisDemoGlow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1={padX} y1={cy} x2={w - padX} y2={cy} stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4" />
        {segments.map((seg, i) => (
          <path key={i} d={curvePath(seg)} fill="none" stroke="url(#nisDemoGrad)" strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {habit.pattern.map((v, i) => {
          const x = padX + i * step;
          if (v === 1) return <circle key={i} cx={x} cy={cy} r={r - 2} fill={habit.color} />;
          if (v === -1)
            return (
              <g key={i}>
                <circle cx={x} cy={cy} r={r + 2} fill="none" stroke={habit.color} strokeWidth="1.5">
                  <animate attributeName="r" values={`${r + 1};${r + 8};${r + 1}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={cy} r={r - 2} fill="white" stroke={habit.color} strokeWidth="1.6" filter="url(#nisDemoGlow)" />
              </g>
            );
          return <circle key={i} cx={x} cy={cy} r={r - 3} fill="none" stroke="var(--ink-4)" strokeWidth="1.2" opacity="0.55" />;
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 14,
          fontFamily: 'var(--nis-font-mono)',
          fontSize: 11,
          color: 'var(--ink-4)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <span>42 days ago</span>
        <span>—</span>
        <span>Today · pending</span>
      </div>
    </div>
  );
}

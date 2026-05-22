type HabitLike = {
  id: string | number;
  color: string;
  /** 1 = done, 0 = missed, -1 = today (pending). Most recent on the right. */
  pattern: number[];
};

/**
 * Habit streak chain — a row of dots across the last 30/42 days.
 * Filled dots = days you showed up. Hollow dots = missed.
 * A flowing gradient ribbon ties together consecutive completed days.
 * Today gets a pulsing halo.
 *
 * SVG renders at natural size (no horizontal stretching), so dots stay
 * perfectly round on any container width.
 */
export function PlosStreakChain({
  habit,
  days = 42,
  showLabels = true,
  compact = false,
  onToggleToday,
}: {
  habit: HabitLike;
  days?: number;
  showLabels?: boolean;
  compact?: boolean;
  onToggleToday?: (id: string | number) => void;
}) {
  const effectiveDays = compact ? 30 : days;
  const pattern = habit.pattern.slice(-effectiveDays);

  // Tight, uniform spacing — chain reads as a single flowing object.
  const padX = compact ? 16 : 20;
  const step = compact ? 16 : 18;
  const width = padX * 2 + (effectiveDays - 1) * step;
  const height = compact ? 52 : 64;
  const cy = height / 2;
  const dotR = compact ? 4.5 : 5.5;
  const missedR = compact ? 2.2 : 2.6;

  // Group consecutive completed days into segments for the ribbon curve.
  type Pt = { x: number; y: number };
  const segments: Pt[][] = [];
  let current: Pt[] = [];
  pattern.forEach((v, i) => {
    if (v === 1) {
      current.push({ x: padX + i * step, y: cy });
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length) segments.push(current);

  // Wavy connector between consecutive filled days.
  const ribbonPath = (points: Pt[]) => {
    if (points.length === 1) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const mx = (p0.x + p1.x) / 2;
      const wave = (i % 2 === 0 ? -1 : 1) * (compact ? 2 : 3);
      d += ` C ${mx} ${p0.y + wave}, ${mx} ${p1.y - wave}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const todayIdx = pattern.length - 1;
  const todayDone = pattern[todayIdx] === 1;

  const gradId = `chain-grad-${habit.id}`;
  const dotGradId = `chain-dot-${habit.id}`;
  const glowId = `chain-glow-${habit.id}`;

  return (
    <div className="streak-chain-wrap" style={compact ? { marginTop: 4 } : undefined}>
      <svg
        className="streak-chain"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={habit.color} stopOpacity="0.35" />
            <stop offset="60%" stopColor={habit.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={habit.color} stopOpacity="1" />
          </linearGradient>
          <radialGradient id={dotGradId} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.7" />
            <stop offset="40%" stopColor={habit.color} />
            <stop offset="100%" stopColor={habit.color} />
          </radialGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <line
          x1={padX}
          y1={cy}
          x2={width - padX}
          y2={cy}
          stroke="var(--plos-rule)"
          strokeWidth="1"
          strokeDasharray="2 5"
        />

        {/* Wavy gradient ribbon under filled segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={ribbonPath(seg)}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={compact ? 2.5 : 3}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
          />
        ))}

        {/* Day dots */}
        {pattern.map((v, i) => {
          const x = padX + i * step;
          const isToday = i === pattern.length - 1;

          if (v === 1) {
            return (
              <circle
                key={i}
                cx={x}
                cy={cy}
                r={dotR}
                fill={`url(#${dotGradId})`}
                filter={isToday ? `url(#${glowId})` : undefined}
              />
            );
          }

          if (v === -1) {
            // Today, pending — pulsing halo + open ring
            return (
              <g key={i}>
                <circle cx={x} cy={cy} r={dotR + 3} fill="none" stroke={habit.color} strokeWidth="1.5" opacity="0.55">
                  <animate attributeName="r" values={`${dotR + 1};${dotR + 8};${dotR + 1}`} dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={cy} r={dotR} fill="white" stroke={habit.color} strokeWidth="2" />
                <circle cx={x} cy={cy} r={dotR - 2.5} fill={habit.color} />
              </g>
            );
          }

          // Missed — tiny hollow ring
          return (
            <circle
              key={i}
              cx={x}
              cy={cy}
              r={missedR}
              fill="none"
              stroke="var(--plos-ink-4)"
              strokeWidth="1.2"
              opacity="0.5"
            />
          );
        })}
      </svg>

      {showLabels && (
        <div className="streak-day-label">
          <span>{effectiveDays} days ago</span>
          <span>{todayDone ? 'done' : 'today'}</span>
        </div>
      )}

      {!compact && onToggleToday && (
        <button
          type="button"
          className={`resp-check ${todayDone ? 'done' : ''}`}
          style={{
            marginTop: 14,
            width: 'auto',
            height: 'auto',
            padding: '8px 16px',
            borderRadius: 10,
            display: 'inline-flex',
            gap: 8,
            alignItems: 'center',
            borderColor: todayDone ? '#10b981' : 'var(--plos-accent)',
            color: todayDone ? 'white' : 'var(--plos-accent)',
            background: todayDone ? '#10b981' : 'var(--plos-accent-soft)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => onToggleToday(habit.id)}
        >
          {todayDone ? 'Done today' : 'Mark today done'}
        </button>
      )}
    </div>
  );
}

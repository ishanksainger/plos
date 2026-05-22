/**
 * Today's pulse — a horizontal heartbeat ribbon across the top of Today.
 * Hours 6am..10pm, with NOW indicator (animated), hour ticks, and overdue
 * / due markers that punch upward beats into the waveform.
 *
 * Ported 1:1 from the prototype's scenes.jsx TodayPulse.
 */

export type PulseMarker = {
  hour: number;
  color: string;
  label: string;
  kind?: 'done' | 'overdue' | 'event';
};

export function TodayPulse({ markers = [] }: { markers?: PulseMarker[] }) {
  const startH = 6;
  const endH = 22;
  const span = endH - startH;
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPct = Math.max(0, Math.min(1, (nowH - startH) / span));

  const w = 1000;
  const h = 70;
  const cy = h / 2;

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 32; i++) {
    const x = (i / 32) * w;
    const t = i / 32;
    let y = cy + Math.sin(t * Math.PI * 6) * 1.4;
    markers.forEach((m) => {
      const mPct = (m.hour - startH) / span;
      const d = Math.abs(t - mPct);
      if (d < 0.04) y -= (1 - d / 0.04) * 18;
      else if (d < 0.06) y += Math.sin((d - 0.04) * Math.PI * 50) * 6;
    });
    pts.push({ x, y });
  }
  const path = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <div className="today-pulse" aria-label="Today's pulse">
      <div className="today-pulse-head">
        <span className="today-pulse-label">Today's pulse</span>
        <span className="today-pulse-time">
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="today-pulse-svg">
        <defs>
          <linearGradient id="tp-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset={`${nowPct * 100}%`} stopColor="#a78bfa" stopOpacity="1" />
            <stop offset={`${nowPct * 100}%`} stopColor="#a78bfa" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        <line x1="0" y1={cy} x2={w} y2={cy} stroke="rgba(167,139,250,0.18)" strokeWidth="0.4" strokeDasharray="2 4" />

        {Array.from({ length: span + 1 }).map((_, i) => {
          const x = (i / span) * w;
          const label = startH + i;
          return (
            <g key={i}>
              <line x1={x} y1={cy - 3} x2={x} y2={cy + 3} stroke="rgba(167,139,250,0.3)" strokeWidth="0.4" />
              {i % 2 === 0 && (
                <text x={x} y={cy + 16} textAnchor="middle" fontSize="9" fill="rgba(167,139,250,0.55)" fontFamily="var(--nis-font-mono, monospace)">
                  {label}
                </text>
              )}
            </g>
          );
        })}

        <path d={path} fill="none" stroke="url(#tp-line)" strokeWidth="1.6" strokeLinecap="round" />

        {markers.map((m, i) => {
          const x = ((m.hour - startH) / span) * w;
          return (
            <g key={i}>
              <line x1={x} y1={cy - 22} x2={x} y2={cy + 22} stroke={m.color} strokeOpacity="0.3" strokeWidth="0.5" />
              <circle cx={x} cy={cy - 22} r="2.8" fill={m.color} />
              <text x={x} y={cy - 28} textAnchor="middle" fontSize="9" fill={m.color} fontFamily="var(--nis-font-mono, monospace)">
                {m.label}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${nowPct * w}, ${cy})`}>
          <circle r="6" fill="none" stroke="#fbbf24" strokeWidth="1">
            <animate attributeName="r" values="4;14;4" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle r="3.5" fill="#fbbf24" />
          <text y="-12" textAnchor="middle" fontSize="9" fill="#fbbf24" fontFamily="var(--nis-font-mono, monospace)">
            NOW
          </text>
        </g>
      </svg>
    </div>
  );
}

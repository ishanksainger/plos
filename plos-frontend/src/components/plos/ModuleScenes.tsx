/**
 * Per-module 3D-feeling hero SVG scenes — ported from the prototype's
 * module-scenes.jsx. Each is self-contained and animated via cinema.css
 * (.ms-orbit-slow, .ms-pearl-bob, .ms-bob, .ms-bars, .ms-heart, .ms-pulse-*).
 */

export function InsightsScene() {
  const nodes = [
    { a: 0,   r: 70, c: '#a78bfa', size: 7 },
    { a: 45,  r: 92, c: '#fbbf24', size: 5 },
    { a: 110, r: 70, c: '#ec4899', size: 6 },
    { a: 160, r: 92, c: '#22d3ee', size: 5 },
    { a: 220, r: 70, c: '#34d399', size: 7 },
    { a: 270, r: 92, c: '#fb7185', size: 5 },
    { a: 320, r: 70, c: '#c4b5fd', size: 6 },
  ];
  return (
    <svg className="ms-svg" viewBox="-130 -100 260 200">
      <defs>
        <radialGradient id="ins-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ec4899" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="ins-core" cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fef0ff" />
          <stop offset="40%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#2a1456" />
        </radialGradient>
        <linearGradient id="ins-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="ins-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <ellipse cx="0" cy="0" rx="125" ry="95" fill="url(#ins-halo)" />

      <g className="ms-orbit-slow">
        <ellipse cx="0" cy="0" rx="105" ry="32" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="0.8" />
        <ellipse cx="0" cy="0" rx="80"  ry="24" fill="none" stroke="rgba(251,191,36,0.55)" strokeWidth="0.6" transform="rotate(20)" />
        <ellipse cx="0" cy="0" rx="65"  ry="18" fill="none" stroke="rgba(236,72,153,0.5)" strokeWidth="0.5" transform="rotate(-22)" />
      </g>

      <g transform="translate(-40, 22)" className="ms-bars">
        {[12, 22, 14, 28, 18, 32, 24].map((h, i) => (
          <rect key={i} x={i * 12} y={-h} width="6" height={h} rx="1.5" fill="url(#ins-bar)" opacity={0.7 + (i % 2) * 0.2} />
        ))}
      </g>

      <g className="ms-pearl-bob">
        <circle cx="0" cy="0" r="32" fill="url(#ins-core)" />
        <ellipse cx="-10" cy="-12" rx="8" ry="4.5" fill="white" opacity="0.55" />
        <circle cx="0" cy="0" r="32" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
      </g>

      <g className="ms-orbit-fast" filter="url(#ins-glow)">
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={Math.cos((n.a * Math.PI) / 180) * n.r}
            cy={Math.sin((n.a * Math.PI) / 180) * n.r * 0.32}
            r={n.size}
            fill={n.c}
          />
        ))}
      </g>

      <path
        d="M -110,-60 L -70,-60 L -62,-72 L -52,-50 L -42,-78 L -32,-44 L -22,-60 L 110,-60"
        fill="none"
        stroke="url(#ins-bar)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function FinanceScene() {
  return (
    <svg className="ms-svg" viewBox="-130 -100 260 200">
      <defs>
        <radialGradient id="fin-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#d97757" stopOpacity="0.16" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="fin-coin-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d6" /><stop offset="50%" stopColor="#f3c34f" /><stop offset="100%" stopColor="#8a5a18" />
        </linearGradient>
        <linearGradient id="fin-coin-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c89240" /><stop offset="100%" stopColor="#5a3a0e" />
        </linearGradient>
        <linearGradient id="fin-sheet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fefbf2" /><stop offset="100%" stopColor="#e9dcc0" />
        </linearGradient>
        <linearGradient id="fin-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#d97757" /><stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      <ellipse cx="0" cy="0" rx="125" ry="95" fill="url(#fin-halo)" />

      <g transform="translate(-90, -45) skewY(-12) rotate(-3)" className="ms-pearl-bob">
        <rect x="2" y="3" width="86" height="58" rx="2.5" fill="black" opacity="0.18" />
        <rect width="86" height="58" rx="2.5" fill="url(#fin-sheet)" stroke="rgba(122,58,40,0.4)" strokeWidth="0.5" />
        <rect x="6" y="6" width="46" height="4" rx="1" fill="#d97757" opacity="0.85" />
        <rect x="56" y="6" width="22" height="4" rx="1" fill="#8a5a18" opacity="0.4" />
        {[14, 20, 26, 32, 38, 44].map((y, k) => (
          <g key={k}>
            <rect x="6" y={y} width={36 + (k % 2 ? 12 : 6)} height="2" rx="0.8" fill="#8a5a18" opacity="0.45" />
            <rect x={56 + (k % 2 ? 0 : 4)} y={y} width="18" height="2" rx="0.8" fill="#d97757" opacity="0.55" />
          </g>
        ))}
        <rect x="60" y="50" width="20" height="5" rx="1" fill="#d97757" opacity="0.85" />
      </g>

      <g transform="translate(40, 0)" className="ms-bob">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 36 - i * 12;
          const rx = 38 - i * 1;
          const ry = 10;
          return (
            <g key={i}>
              <path
                d={`M ${-rx},${y} A ${rx} ${ry} 0 0 0 ${rx},${y} L ${rx},${y + 6} A ${rx} ${ry} 0 0 1 ${-rx},${y + 6} Z`}
                fill="url(#fin-coin-side)"
              />
              <ellipse cx="0" cy={y} rx={rx} ry={ry} fill="url(#fin-coin-face)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
              <text x="0" y={y + 3} textAnchor="middle" fontSize="7" fontFamily="serif" fill="rgba(80,40,8,0.55)" fontWeight="600">₹</text>
            </g>
          );
        })}
      </g>

      <g transform="translate(-58, 50)" className="ms-bars">
        {[10, 14, 12, 22, 18, 28].map((h, i) => (
          <rect key={i} x={i * 10} y={-h} width="6" height={h} rx="1" fill="url(#fin-bar)" opacity="0.85" />
        ))}
      </g>

      <circle cx="80" cy="-50" r="1.8" fill="#fff">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function HealthScene() {
  return (
    <svg className="ms-svg" viewBox="-130 -100 260 200">
      <defs>
        <radialGradient id="hea-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ec4899" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="hea-heart" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffe0e8" />
          <stop offset="38%" stopColor="#fb7185" />
          <stop offset="78%" stopColor="#be185d" />
          <stop offset="100%" stopColor="#3a0a1c" />
        </radialGradient>
        <linearGradient id="hea-beat">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0" />
          <stop offset="50%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="0" cy="0" rx="125" ry="95" fill="url(#hea-halo)" />

      {[0, 1, 2].map((i) => (
        <circle key={i} r="38" fill="none" stroke="#fb7185" strokeWidth="0.8" className={`ms-pulse-${i}`} />
      ))}

      <path
        d="M -120,0 L -70,0 L -60,-26 L -46,28 L -34,-40 L -20,40 L -8,-10 L 4,0 L 120,0"
        fill="none"
        stroke="url(#hea-beat)"
        strokeWidth="2"
        strokeLinecap="round"
        transform="translate(0, -40)"
      />
      <path
        d="M -120,0 L -70,0 L -60,-18 L -46,18 L -34,-30 L -20,30 L -8,-8 L 4,0 L 120,0"
        fill="none"
        stroke="url(#hea-beat)"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="translate(0, 48)"
        opacity="0.5"
      />

      <g className="ms-heart">
        <path
          d="M 0,28 C -22,12 -50,-8 -50,-32 C -50,-50 -32,-56 -18,-50 C -10,-44 -4,-36 0,-28 C 4,-36 10,-44 18,-50 C 32,-56 50,-50 50,-32 C 50,-8 22,12 0,28 Z"
          fill="url(#hea-heart)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.5"
        />
        <ellipse cx="-18" cy="-32" rx="9" ry="5" fill="white" opacity="0.45" />
        <text x="0" y="2" textAnchor="middle" fontSize="14" fontFamily="var(--nis-font-serif, serif)" fontStyle="italic" fill="white" opacity="0.9">72</text>
        <text x="0" y="14" textAnchor="middle" fontSize="6" fontFamily="var(--nis-font-mono, monospace)" letterSpacing="0.1em" fill="white" opacity="0.7">BPM</text>
      </g>
    </svg>
  );
}

export function HabitsScene() {
  return (
    <svg className="ms-svg" viewBox="-130 -100 260 200">
      <defs>
        <radialGradient id="hab-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="hab-strand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#4a2d80" />
        </linearGradient>
        <linearGradient id="hab-chain">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      <ellipse cx="0" cy="0" rx="125" ry="95" fill="url(#hab-halo)" />

      {Array.from({ length: 14 }).map((_, i) => {
        const r = 32 + (i % 6) * 7;
        const ry = r * 0.78;
        const rot = i * 22;
        return (
          <ellipse
            key={i}
            cx="0"
            cy="0"
            rx={r}
            ry={ry}
            fill="none"
            stroke="url(#hab-strand)"
            strokeWidth={0.8 + (i % 3) * 0.3}
            opacity={0.4 + (i % 4) * 0.12}
            transform={`rotate(${rot})`}
          />
        );
      })}

      <g transform="translate(0, 50)" className="ms-chain">
        {Array.from({ length: 18 }).map((_, i) => {
          const x = -100 + i * 12;
          const filled = i < 14 && i !== 4 && i !== 9;
          return filled ? (
            <circle key={i} cx={x} cy="0" r="3.5" fill="url(#hab-chain)" />
          ) : (
            <circle key={i} cx={x} cy="0" r="2.8" fill="none" stroke="#a78bfa" strokeOpacity="0.55" strokeWidth="1" />
          );
        })}
        <path d="M -100,0 L 116,0" fill="none" stroke="url(#hab-chain)" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
      </g>

      <g className="ms-pearl-bob">
        <circle r="28" fill="url(#hab-halo)" />
        <circle r="20" fill="#fbbf24" opacity="0.85" />
        <ellipse cx="-7" cy="-8" rx="5" ry="3" fill="white" opacity="0.55" />
      </g>
    </svg>
  );
}

export function PeopleScene() {
  const avatars = [
    { x: -90, y: -10, r: 24, g: 'pe-1' },
    { x: -38, y: -42, r: 20, g: 'pe-2' },
    { x:  20, y: -16, r: 26, g: 'pe-3' },
    { x:  70, y:  20, r: 22, g: 'pe-4' },
    { x:  -8, y:  44, r: 18, g: 'pe-5' },
    { x: -62, y:  38, r: 16, g: 'pe-6' },
  ];
  return (
    <svg className="ms-svg" viewBox="-130 -100 260 200">
      <defs>
        <radialGradient id="peo-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#0891b2" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="pe-1" cx="35%" cy="30%"><stop offset="0%" stopColor="#fde68a" /><stop offset="100%" stopColor="#b45309" /></radialGradient>
        <radialGradient id="pe-2" cx="35%" cy="30%"><stop offset="0%" stopColor="#fbcfe8" /><stop offset="100%" stopColor="#9d174d" /></radialGradient>
        <radialGradient id="pe-3" cx="35%" cy="30%"><stop offset="0%" stopColor="#a5f3fc" /><stop offset="100%" stopColor="#155e75" /></radialGradient>
        <radialGradient id="pe-4" cx="35%" cy="30%"><stop offset="0%" stopColor="#ddd6fe" /><stop offset="100%" stopColor="#5b21b6" /></radialGradient>
        <radialGradient id="pe-5" cx="35%" cy="30%"><stop offset="0%" stopColor="#bbf7d0" /><stop offset="100%" stopColor="#14532d" /></radialGradient>
        <radialGradient id="pe-6" cx="35%" cy="30%"><stop offset="0%" stopColor="#fecaca" /><stop offset="100%" stopColor="#991b1b" /></radialGradient>
      </defs>

      <ellipse cx="0" cy="0" rx="125" ry="95" fill="url(#peo-halo)" />

      <g stroke="rgba(167,139,250,0.4)" strokeWidth="0.6" fill="none">
        {avatars.map((a, i) =>
          avatars.slice(i + 1).map((b, j) => (
            <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} opacity={(i + j) % 2 ? 0.6 : 0.3} />
          )),
        )}
      </g>

      <g className="ms-bob">
        {avatars.map((a, i) => (
          <g key={i}>
            <circle cx={a.x} cy={a.y} r={a.r} fill={`url(#${a.g})`} stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
            <ellipse cx={a.x - a.r * 0.3} cy={a.y - a.r * 0.35} rx={a.r * 0.32} ry={a.r * 0.18} fill="white" opacity="0.45" />
          </g>
        ))}
      </g>

      <circle cx="-90" cy="-10" r="3" fill="#22d3ee">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function TimelineScene() {
  const events = [
    { x: -100, c: '#a78bfa', y: -10 },
    { x: -68,  c: '#22d3ee', y:  18 },
    { x: -32,  c: '#fbbf24', y: -16 },
    { x:   2,  c: '#ec4899', y:  20 },
    { x:  36,  c: '#34d399', y: -12 },
    { x:  72,  c: '#fb7185', y:  24 },
    { x: 108,  c: '#c4b5fd', y: -8 },
  ];
  return (
    <svg className="ms-svg" viewBox="-130 -100 260 200">
      <defs>
        <radialGradient id="tm-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#fb7185" stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="tm-river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <ellipse cx="0" cy="0" rx="125" ry="95" fill="url(#tm-halo)" />

      <path d="M -120,0 C -80,-30 -40,30 0,0 C 40,-30 80,30 120,0" fill="none" stroke="url(#tm-river)" strokeWidth="4" strokeLinecap="round" />
      <path d="M -120,0 C -80,-30 -40,30 0,0 C 40,-30 80,30 120,0" fill="none" stroke="url(#tm-river)" strokeWidth="1.5" strokeLinecap="round" transform="translate(0, 18)" opacity="0.55" />
      <path d="M -120,0 C -80,-30 -40,30 0,0 C 40,-30 80,30 120,0" fill="none" stroke="url(#tm-river)" strokeWidth="1.5" strokeLinecap="round" transform="translate(0, -22)" opacity="0.55" />

      <g className="ms-bob">
        {events.map((e, i) => (
          <g key={i}>
            <line x1={e.x} y1="0" x2={e.x} y2={e.y} stroke={e.c} strokeWidth="0.6" opacity="0.55" />
            <circle cx={e.x} cy={e.y} r={4} fill={e.c} />
            <circle cx={e.x} cy="0" r="2" fill="white" opacity="0.85" />
          </g>
        ))}
      </g>
    </svg>
  );
}

import { useId, type CSSProperties, type ReactNode } from 'react';

/**
 * CSSHero — page-specific illustrated heroes with **centered** SVG art.
 *
 * Illustrations use `preserveAspectRatio="xMidYMid meet"` so the graphic
 * sits in the middle of the banner at a large, readable size.
 *
 * Palettes follow the app's warm canvas with violet accents.
 */

export type CSSHeroVariant =
  | 'dashboard'
  | 'finance'
  | 'health'
  | 'habits'
  | 'responsibilities'
  | 'people'
  | 'timeline';

/**
 * Hero band height — slightly taller for better visual balance with larger center art.
 */
export const HERO_BAND_HEIGHT_MODULE = 'clamp(236px, min(27svh, 298px), 298px)';
export const HERO_BAND_HEIGHT_DASHBOARD = 'clamp(244px, min(28svh, 312px), 312px)';

/** Light hero band + illustration — warm cream base, soft violet + sky accents. */
const HERO_LIGHT: { primary: string; secondary: string; bgFrom: string; bgTo: string } = {
  primary:   '#7c3aed',
  secondary: '#6b9bd1',
  bgFrom:    '#faf7f0',
  bgTo:      '#e8e2f4',
};

const VARIANT_PALETTES: Record<
  CSSHeroVariant,
  { primary: string; secondary: string; bgFrom: string; bgTo: string }
> = {
  dashboard:        HERO_LIGHT,
  finance:          HERO_LIGHT,
  health:           HERO_LIGHT,
  habits:           HERO_LIGHT,
  responsibilities: HERO_LIGHT,
  people:           HERO_LIGHT,
  timeline:         HERO_LIGHT,
};

/**
 * Single centered illustration sized to ~60-70% width of the banner.
 * Height is intentionally capped so the art does not feel vertically stretched.
 * The `viewBox` is non-uniformly cropped so the drawing itself becomes wider
 * on-screen (not just the container), while preserving vector proportions.
 */
const IllustrationShell = ({ viewBox, children }: { viewBox: string; children: ReactNode }) => {
  const uid = useId().replace(/:/g, '');
  const popFilterId = `hero-pop-${uid}`;
  const rimLightId = `hero-rim-${uid}`;
  const floatAnim = `hero-float-${uid}`;

  const [minXRaw, minYRaw, widthRaw, heightRaw] = viewBox.trim().split(/\s+/).map(Number);
  const minX = Number.isFinite(minXRaw) ? minXRaw : 0;
  const minY = Number.isFinite(minYRaw) ? minYRaw : 0;
  const width = Number.isFinite(widthRaw) ? widthRaw : 400;
  const height = Number.isFinite(heightRaw) ? heightRaw : 260;

  // Make the illustration occupy more horizontal banner space without stretch.
  const CONTENT_ZOOM_X = 1.05;
  const CONTENT_ZOOM_Y = 1.85;
  const cropWidth = width / CONTENT_ZOOM_X;
  const cropHeight = height / CONTENT_ZOOM_Y;
  const cropX = minX + (width - cropWidth) / 2;
  const cropY = minY + (height - cropHeight) / 2;
  const zoomedViewBox = `${cropX} ${cropY} ${cropWidth} ${cropHeight}`;
  const verticalCenterBias = height * 0.085;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        padding: '2px 0',
      }}
    >
      <svg
        viewBox={zoomedViewBox}
        preserveAspectRatio="xMidYMid meet"
        width="68%"
        height="92%"
        style={{
          display: 'block',
          overflow: 'visible',
          minWidth: '60%',
          maxWidth: '70%',
          minHeight: '84%',
          maxHeight: '96%',
          filter: 'drop-shadow(0 8px 24px rgba(15,23,42,0.12))',
        }}
      >
        <defs>
          <filter id={popFilterId} x="-22%" y="-32%" width="144%" height="176%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#64748b" floodOpacity="0.18" />
            <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#c4b5fd" floodOpacity="0.35" />
          </filter>
          <radialGradient id={rimLightId} cx="50%" cy="46%" r="62%">
            <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.35" />
            <stop offset="54%" stopColor="#8b5cf6" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(0 ${verticalCenterBias})`}>
          <rect
            x={cropX + cropWidth * 0.02}
            y={cropY + cropHeight * 0.06}
            width={cropWidth * 0.96}
            height={cropHeight * 0.88}
            rx={Math.min(cropWidth, cropHeight) * 0.09}
            fill={`url(#${rimLightId})`}
            opacity="0.65"
          />

          <g
            filter={`url(#${popFilterId})`}
            style={{
              animation: `${floatAnim} 8s ease-in-out infinite`,
              transformOrigin: 'center center',
            }}
          >
            {children}
          </g>
        </g>

        <style>{`
          @keyframes ${floatAnim} {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-2.5px); }
          }
        `}</style>
      </svg>
    </div>
  );
};

/** Dashboard — compact gauge + chart + KPIs (scaled for small slot) */
const DashboardIllustration = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <IllustrationShell viewBox="0 0 360 260">
    <defs>
      <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={primary} stopOpacity="0.32" />
        <stop offset="100%" stopColor={primary} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="dash-score-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={primary} />
        <stop offset="100%" stopColor={secondary} />
      </linearGradient>
      <filter id="dash-score-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={primary} floodOpacity="0.55" />
      </filter>
    </defs>

    <circle cx="88" cy="118" r="50" fill="none" stroke="url(#dash-score-ring)" strokeWidth="5" opacity="0.22" />
    <circle cx="88" cy="118" r="46" fill="none" stroke={`${primary}22`} strokeWidth="6" />
    <circle cx="88" cy="118" r="46" fill="none" stroke="url(#dash-score-ring)" strokeWidth="6" strokeLinecap="round"
      strokeDasharray="289" strokeDashoffset="100" opacity="0.92" transform="rotate(-220, 88, 118)"
      filter="url(#dash-score-glow)"
      style={{ animation: 'dash-arc 1.8s ease-out 0.2s both' }} />
    <text x="88" y="118" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="800">72</text>
    <text x="88" y="134" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="6" fontWeight="700" letterSpacing="0.12em">SCORE</text>

    <path d="M175,210 L188,178 L208,190 L228,162 L248,174 L268,148 L288,156 L308,128 L308,210Z" fill="url(#dash-area)" />
    <polyline points="175,210 188,178 208,190 228,162 248,174 268,148 288,156 308,128"
      fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
      strokeDasharray="260" style={{ animation: 'dash-draw 2s ease-out 0.4s both' }} />

    {[
      { x: 175, y: 36, w: 58, label: 'TASKS', val: '24' },
      { x: 240, y: 36, w: 58, label: 'DONE', val: '18' },
      { x: 175, y: 78, w: 58, label: 'OVER', val: '3' },
      { x: 240, y: 78, w: 58, label: 'RATE', val: '75%' },
    ].map((kpi, i) => (
      <g key={i} style={{ animation: `dash-card 0.4s ease-out ${0.3 + i * 0.08}s both` }}>
        <rect x={kpi.x} y={kpi.y} width={kpi.w} height="32" rx="5"
          fill={`${i === 2 ? '#b87a5c' : primary}0a`} stroke={`${i === 2 ? '#b87a5c' : primary}22`} strokeWidth="1" />
        <text x={kpi.x + 6} y={kpi.y + 12} fill={`${primary}55`} fontSize="5" fontWeight="700">{kpi.label}</text>
        <text x={kpi.x + 6} y={kpi.y + 26} fill={i === 2 ? '#b87a5c' : primary} fontSize="12" fontWeight="800" opacity="0.65">{kpi.val}</text>
      </g>
    ))}

    {[...Array(8)].map((_, i) => {
      const angle = -220 + i * 33;
      const rad = (angle * Math.PI) / 180;
      return <line key={i} x1={88 + 38 * Math.cos(rad)} y1={118 + 38 * Math.sin(rad)}
        x2={88 + 43 * Math.cos(rad)} y2={118 + 43 * Math.sin(rad)}
        stroke={`${secondary}28`} strokeWidth="1.2" strokeLinecap="round" />;
    })}

    <style>{`
      @keyframes dash-arc { from { stroke-dashoffset: 289; } }
      @keyframes dash-draw { from { stroke-dashoffset: 260; } to { stroke-dashoffset: 0; } }
      @keyframes dash-card { from { opacity: 0; transform: translateY(6px); } }
    `}</style>
  </IllustrationShell>
);

/** Finance — bars + trend + coins */
const FinanceIllustration = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <IllustrationShell viewBox="0 0 400 280">
    <defs>
      <linearGradient id="fin-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={primary} stopOpacity="0.95" />
        <stop offset="100%" stopColor={secondary} stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id="fin-bar2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={secondary} stopOpacity="0.85" />
        <stop offset="100%" stopColor={primary} stopOpacity="0.35" />
      </linearGradient>
      <filter id="fin-bars-glow" x="-30%" y="-50%" width="160%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={primary} floodOpacity="0.45" />
      </filter>
    </defs>

    <g filter="url(#fin-bars-glow)">
      {[
        { x: 36, h: 68 }, { x: 72, h: 92 }, { x: 108, h: 80 },
        { x: 144, h: 118 }, { x: 180, h: 105 }, { x: 216, h: 138 },
        { x: 252, h: 128 }, { x: 288, h: 158 },
      ].map((bar, i) => (
        <rect key={i} x={bar.x} y={268 - bar.h} width="24" height={bar.h} rx="3"
          fill={i % 2 === 0 ? 'url(#fin-bar)' : 'url(#fin-bar2)'}
          style={{ animation: `fin-grow 1.2s ease-out ${i * 0.08}s both` }} />
      ))}
    </g>

    <polyline points="48,198 84,172 120,184 156,148 192,158 228,128 264,138 300,108"
      fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      opacity="0.45" strokeDasharray="360" style={{ animation: 'fin-draw 2s ease-out 0.3s both' }} />

    {[0, 1, 2, 3].map((i) => (
      <g key={`coin-${i}`} style={{ animation: `fin-fade 0.6s ease-out ${0.5 + i * 0.1}s both` }}>
        <ellipse cx="52" cy={228 - i * 12} rx="18" ry="6" fill={primary} stroke={primary} strokeWidth="0.5" opacity={0.12 + i * 0.06} />
      </g>
    ))}

    <text x="52" y="188" textAnchor="middle" fill={primary} fontSize="14" fontWeight="800" opacity="0.35"
      style={{ animation: 'fin-fade 0.8s ease-out 1s both' }}>₹</text>

    <style>{`
      @keyframes fin-grow { from { transform: scaleY(0); transform-origin: bottom; } }
      @keyframes fin-draw { from { stroke-dashoffset: 360; } to { stroke-dashoffset: 0; } }
      @keyframes fin-fade { from { opacity: 0; transform: translateY(6px); } }
    `}</style>
  </IllustrationShell>
);

/** Health — ECG + heart */
const HealthIllustration = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <IllustrationShell viewBox="0 0 400 260">
    <defs>
      <linearGradient id="hp" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={primary} stopOpacity="0.65" />
        <stop offset="100%" stopColor={secondary} stopOpacity="0.22" />
      </linearGradient>
      <filter id="hp-ecg-glow" x="-8%" y="-35%" width="116%" height="170%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={primary} floodOpacity="0.55" />
      </filter>
    </defs>

    <polyline
      points="0,130 36,130 52,130 68,130 80,130 84,108 90,158 96,92 102,162 108,112 114,130 136,130 152,130 168,130 184,130 196,130 200,108 206,158 212,92 218,162 224,112 230,130 252,130 268,130 292,130 400,130"
      fill="none" stroke="url(#hp)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray="520" filter="url(#hp-ecg-glow)" style={{ animation: 'h-draw 2.5s ease-in-out infinite' }} />

    <g transform="translate(168, 62) scale(1.15)" opacity="0.55" filter="url(#hp-ecg-glow)" style={{ animation: 'h-beat 1.2s ease-in-out infinite' }}>
      <path d="M12,21.35 C12,21.35 4,13.5 4,8.5 C4,5.42 6.42,3 9.5,3 C11.24,3 12.91,3.81 12,5.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 C22,13.5 12,21.35 12,21.35Z" fill={primary} stroke={primary} strokeWidth="0.5" />
    </g>

    <circle cx="268" cy="82" r="32" fill="none" stroke={secondary} strokeWidth="2.2" opacity="0.22"
      strokeDasharray="180 28" style={{ animation: 'h-spin 8s linear infinite' }} />
    <circle cx="268" cy="82" r="24" fill="none" stroke={primary} strokeWidth="2" opacity="0.18"
      strokeDasharray="120 40" style={{ animation: 'h-spin 6s linear infinite reverse' }} />

    <g transform="translate(268, 76)" opacity="0.32">
      <line x1="-6" y1="0" x2="6" y2="0" stroke={primary} strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="-6" x2="0" y2="6" stroke={primary} strokeWidth="2" strokeLinecap="round" />
    </g>

    <style>{`
      @keyframes h-draw { 0%,100% { stroke-dashoffset: 520; } 50% { stroke-dashoffset: 0; } }
      @keyframes h-beat { 0%,100% { transform: translate(168px,62px) scale(1.15); } 15% { transform: translate(168px,62px) scale(1.32); } 30% { transform: translate(168px,62px) scale(1.15); } 45% { transform: translate(168px,62px) scale(1.25); } }
      @keyframes h-spin { to { transform: rotate(360deg); } }
    `}</style>
  </IllustrationShell>
);

/** Habits — flame + week dots */
const HabitsIllustration = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <IllustrationShell viewBox="0 0 400 260">
    <defs>
      <linearGradient id="hf" x1="0.5" y1="1" x2="0.5" y2="0">
        <stop offset="0%" stopColor={primary} stopOpacity="0.75" />
        <stop offset="60%" stopColor={secondary} stopOpacity="0.45" />
        <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    <g transform="translate(148, 48)" style={{ animation: 'hb-f 2s ease-in-out infinite' }}>
      <path d="M0,72 C0,72 -8,46 0,28 C4,18 8,22 10,14 C12,6 16,-2 20,2 C28,10 32,22 30,36 C28,48 24,56 20,60 C16,64 8,72 0,72Z" fill="url(#hf)" opacity="0.6" />
      <path d="M4,72 C4,72 0,56 6,42 C10,36 12,38 14,32 C16,28 18,26 17,44 C16,52 12,62 8,68Z" fill={secondary} opacity="0.35" />
    </g>

    <text x="158" y="138" textAnchor="middle" fill={primary} fontSize="11" fontWeight="800" opacity="0.85" letterSpacing="0.18em">STREAK</text>

    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
      const filled = i < 5;
      const isToday = i === 5;
      return (
        <g key={i} style={{ animation: `hb-p 0.4s ease-out ${i * 0.08}s both` }}>
          <circle cx={100 + i * 20} cy="162" r="7"
            fill={filled ? primary : isToday ? 'transparent' : 'rgba(15,23,42,0.06)'}
            stroke={filled ? primary : isToday ? primary : 'rgba(15,23,42,0.1)'}
            strokeWidth="1.2"
            opacity={filled ? 1 : isToday ? 1 : 0.9} />
          {filled && <polyline points={`${97 + i * 20},162 ${100 + i * 20},165 ${104 + i * 20},160`}
            fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />}
          <text x={100 + i * 20} y="182" textAnchor="middle" fill="rgba(15,23,42,0.45)" fontSize="10" fontWeight="600">{day}</text>
        </g>
      );
    })}

    <circle cx="268" cy="112" r="44" fill="none" stroke={primary} strokeWidth="1.5" opacity="0.14"
      strokeDasharray="10 6" style={{ animation: 'hb-r 12s linear infinite' }} />

    <style>{`
      @keyframes hb-f { 0%,100% { transform: translate(148px,48px) scaleY(1); } 50% { transform: translate(148px,46px) scaleY(1.05); } }
      @keyframes hb-p { from { opacity: 0; transform: scale(0.5); } }
      @keyframes hb-r { to { transform: rotate(360deg); } }
    `}</style>
  </IllustrationShell>
);

/** Responsibilities — checklist + ring */
const ResponsibilitiesIllustration = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <IllustrationShell viewBox="0 0 400 280">
    {[
      { y: 32, w: 158, done: true }, { y: 66, w: 142, done: true },
      { y: 100, w: 176, done: false }, { y: 134, w: 124, done: false }, { y: 168, w: 150, done: false },
    ].map((t, i) => (
      <g key={i} style={{ animation: `r-s 0.5s ease-out ${i * 0.1}s both` }}>
        <rect x="48" y={t.y} width={t.w} height="26" rx="5"
          fill={t.done ? `${primary}10` : `${secondary}05`} stroke={t.done ? `${primary}28` : `${secondary}14`} strokeWidth="1" />
        <rect x="54" y={t.y + 6} width="12" height="12" rx="2"
          fill={t.done ? primary : 'transparent'} stroke={t.done ? primary : `${primary}38`}
          strokeWidth="1.2" opacity={t.done ? 0.5 : 0.3} />
        {t.done && <polyline points={`57,${t.y + 13} 59,${t.y + 16} 64,${t.y + 11}`}
          fill="none" stroke="#e8e4dc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
        <rect x="72" y={t.y + 10} width={t.w - 40} height="5" rx="2" fill={t.done ? `${primary}25` : `${primary}12`} />
      </g>
    ))}

    <circle cx="278" cy="88" r="38" fill="none" stroke="rgba(124,77,255,0.1)" strokeWidth="5" />
    <circle cx="278" cy="88" r="38" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round"
      strokeDasharray="239" strokeDashoffset="96" opacity="0.42" transform="rotate(-90, 278, 88)"
      style={{ animation: 'r-ring 1.5s ease-out 0.3s both' }} />
    <text x="278" y="84" textAnchor="middle" fill={primary} fontSize="13" fontWeight="800" opacity="0.45">60%</text>
    <text x="278" y="98" textAnchor="middle" fill={`${primary}66`} fontSize="6" fontWeight="600">DONE</text>

    {[
      { y: 158, pct: 0.8, c: primary }, { y: 176, pct: 0.55, c: secondary }, { y: 194, pct: 0.35, c: '#b87a8f' },
    ].map((b, i) => (
      <g key={i} style={{ animation: `r-b ${0.8 + i * 0.2}s ease-out ${0.5 + i * 0.1}s both` }}>
        <rect x="248" y={b.y} width="78" height="5" rx="2" fill={`${b.c}10`} />
        <rect x="248" y={b.y} width={78 * b.pct} height="5" rx="2" fill={b.c} opacity="0.38" />
      </g>
    ))}

    <style>{`
      @keyframes r-s { from { opacity: 0; transform: translateX(14px); } }
      @keyframes r-ring { from { stroke-dashoffset: 239; } }
      @keyframes r-b { from { opacity: 0; transform: scaleX(0); transform-origin: left; } }
    `}</style>
  </IllustrationShell>
);

/** People — network */
const PeopleIllustration = (_: { primary: string; secondary: string }) => {
  const nodes = [
    { x: 178, y: 118, r: 18, main: true },
    { x: 108, y: 72, r: 13 }, { x: 258, y: 64, r: 12 },
    { x: 92, y: 162, r: 12 }, { x: 268, y: 154, r: 14 },
    { x: 158, y: 196, r: 11 }, { x: 282, y: 210, r: 10 },
    { x: 72, y: 118, r: 9 },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,3],[1,7],[2,4],[4,6],[3,5]];

  return (
    <IllustrationShell viewBox="0 0 340 240">
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(124,77,255,0.3)" strokeWidth="1.1" opacity="0.9"
          style={{ animation: `ppl-l 0.8s ease-out ${0.3 + i * 0.05}s both` }} />
      ))}

      {nodes.map((n, i) => (
        <g key={i} style={{ animation: `ppl-n 0.5s ease-out ${i * 0.07}s both` }}>
          {n.main && <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke="rgba(124,77,255,0.4)"
            strokeWidth="0.9" opacity="0.55" strokeDasharray="5 3" style={{ animation: 'ppl-orbit 10s linear infinite' }} />}
          <circle cx={n.x} cy={n.y} r={n.r}
            fill={n.main ? '#5e35b1' : 'rgba(94,53,177,0.15)'}
            stroke={n.main ? '#5e35b1' : '#5e35b1'} strokeWidth="1.4" opacity={n.main ? 1 : 0.9} />
          <text x={n.x} y={n.y + (n.r * 0.35)} textAnchor="middle"
            fill={n.main ? '#ffffff' : '#475569'} fontSize={n.r * 0.75} fontWeight="800" opacity="0.92">
            {['Y', 'M', 'D', 'S', 'P', 'K', 'B', 'A'][i]}
          </text>
        </g>
      ))}

      <style>{`
        @keyframes ppl-n { from { opacity: 0; transform: scale(0.3); } }
        @keyframes ppl-l { from { opacity: 0; } }
        @keyframes ppl-orbit { to { transform: rotate(360deg); } }
      `}</style>
    </IllustrationShell>
  );
};

/** Timeline — clock on upper-right; decorative rail + nodes on a separate lower row (no overlap). */
const TimelineIllustration = ({ primary, secondary }: { primary: string; secondary: string }) => {
  const uid = useId().replace(/:/g, '');
  const handGlowId = `tl-hand-glow-${uid}`;
  const ok = '#6a9478';
  const warn = '#b8935c';
  const err = '#b87a72';
  const O = '#5e35b1';
  const railY = 214;
  const events = [
    { x: 56, color: ok, label: '✓' },
    { x: 120, color: warn, label: '!' },
    { x: 184, color: err, label: '×' },
    { x: 248, color: primary, label: '→' },
    { x: 312, color: secondary, label: '?' },
  ];
  return (
    <IllustrationShell viewBox="0 0 400 260">
      <defs>
        <filter id={handGlowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Clock cluster — right side; hands / ring / glow animated (pivot at clock center) */}
      <g transform="translate(198, -28) scale(1.05)">
        {/* Soft violet glow behind clock — breathing */}
        <g transform="translate(92, 118)">
          <g className="clock-bg-glow" style={{ transformOrigin: 'center center', transformBox: 'fill-box' }}>
            <circle cx={0} cy={0} r={46} fill="rgba(124,77,255,0.28)" />
          </g>
        </g>
        {/* Outer dashed ring — slow counter-rotation */}
        <g transform="translate(92, 118)">
          <g className="clock-outer-ring" style={{ transformOrigin: 'center center', transformBox: 'fill-box' }}>
            <circle cx={0} cy={0} r="40" fill="none" stroke={O} strokeOpacity={0.3} strokeWidth="1.5" strokeDasharray="4 4" />
          </g>
        </g>
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          return <line key={i}
            x1={92 + 32 * Math.cos(angle)} y1={118 + 32 * Math.sin(angle)}
            x2={92 + 36 * Math.cos(angle)} y2={118 + 36 * Math.sin(angle)}
            stroke={O} strokeWidth={i % 3 === 0 ? 1.5 : 1} strokeOpacity={0.8} strokeLinecap="round" />;
        })}
        {/* Hour hand — slow rotation */}
        <g transform="translate(92, 118)">
          <g className="clock-hour-hand" style={{ transformOrigin: 'center center', transformBox: 'fill-box' }}>
            <line x1="0" y1="0" x2="0" y2="-30" stroke={O} strokeWidth="2" strokeOpacity={0.8} strokeLinecap="round" filter={`url(#${handGlowId})`} />
          </g>
        </g>
        {/* Minute hand — faster rotation */}
        <g transform="translate(92, 118)">
          <g className="clock-minute-hand" style={{ transformOrigin: 'center center', transformBox: 'fill-box' }}>
            <line x1="0" y1="0" x2="0" y2="-36" stroke={O} strokeWidth="2" strokeOpacity={0.8} strokeLinecap="round" filter={`url(#${handGlowId})`} />
          </g>
        </g>
        <g transform="translate(92, 118)">
          <circle className="clock-center-dot" cx={0} cy={0} r="2.5" fill={O} style={{ transformOrigin: 'center center', transformBox: 'fill-box' }} />
        </g>
      </g>

      {/* Full-width decorative rail below the clock */}
      <line x1="24" y1={railY} x2="376" y2={railY} stroke={O} strokeOpacity={0.8} strokeWidth="1.5" strokeLinecap="round" />

      {events.map((evt, i) => (
        <g key={i} style={{ animation: `tl-evt 0.4s ease-out ${0.4 + i * 0.1}s both` }}>
          <circle cx={evt.x} cy={railY} r="8" fill={`${evt.color}18`} stroke={`${evt.color}40`} strokeWidth="1.2" />
          <text x={evt.x} y={railY + 3} textAnchor="middle" fill={evt.color} fontSize="7.5" fontWeight="700" opacity="0.65">{evt.label}</text>
          <rect x={evt.x - 14} y={railY + 12} width="28" height="14" rx="3" fill={`${evt.color}08`} stroke={`${evt.color}14`} strokeWidth="0.6" />
          <rect x={evt.x - 10} y={railY + 18} width="20" height="3" rx="1.5" fill={`${evt.color}1a`} />
        </g>
      ))}

      <style>{`
        @keyframes rotateMinute {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateHour {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 4px rgba(124,77,255,0.8));
          }
          50% {
            opacity: 0.6;
            filter: drop-shadow(0 0 12px rgba(124,77,255,1));
          }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes tl-evt { from { opacity: 0; transform: translateY(6px); } }

        .clock-minute-hand {
          animation: rotateMinute 10s linear infinite;
          transform-origin: center center;
          transform-box: fill-box;
        }
        .clock-hour-hand {
          animation: rotateHour 60s linear infinite;
          transform-origin: center center;
          transform-box: fill-box;
        }
        .clock-outer-ring {
          animation: rotateSlow 20s linear infinite;
          transform-origin: center center;
          transform-box: fill-box;
        }
        .clock-center-dot {
          animation: pulse 2s ease-in-out infinite;
          transform-origin: center center;
          transform-box: fill-box;
        }
        .clock-bg-glow {
          animation: breathe 3s ease-in-out infinite;
          transform-origin: center center;
          transform-box: fill-box;
        }
      `}</style>
    </IllustrationShell>
  );
};

const ILLUSTRATIONS: Record<CSSHeroVariant, React.FC<{ primary: string; secondary: string }>> = {
  dashboard: DashboardIllustration,
  finance: FinanceIllustration,
  health: HealthIllustration,
  habits: HabitsIllustration,
  responsibilities: ResponsibilitiesIllustration,
  people: PeopleIllustration,
  timeline: TimelineIllustration,
};

interface CSSHeroProps {
  variant: CSSHeroVariant;
  style?: CSSProperties;
}

const CSSHero = ({ variant, style }: CSSHeroProps) => {
  const p = VARIANT_PALETTES[variant];
  const Illustration = ILLUSTRATIONS[variant];

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 58%), linear-gradient(135deg, ${p.bgFrom} 0%, ${p.bgTo} 100%)`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage:
          'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 78% 72% at 50% 50%, black 0%, transparent 82%)',
        WebkitMaskImage: 'radial-gradient(ellipse 78% 72% at 50% 50%, black 0%, transparent 82%)',
      }} />

      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(88%, 520px)',
        height: 'min(95%, 300px)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(237,233,254,0.9) 0%, rgba(147,197,253,0.22) 44%, transparent 62%)',
        filter: 'blur(38px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <Illustration primary={p.primary} secondary={p.secondary} />
    </div>
  );
};

export default CSSHero;

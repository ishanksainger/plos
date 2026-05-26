'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/* ============================================================
   Hooks — scroll progress, section progress, mouse perspective
============================================================ */
export function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max)));
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        update();
        raf = 0;
      });
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, []);
  return p;
}

export function useSectionProgress(ref: RefObject<HTMLElement>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let lastP = 0;
    let mounted = true;
    const compute = () => {
      if (!ref.current || !mounted) return;
      const el = ref.current;
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const elH = el.offsetHeight;
      const scrollable = Math.max(1, elH - viewH);
      const scrolled = -rect.top;
      const next = Math.min(1, Math.max(0, scrolled / scrollable));
      if (Math.abs(next - lastP) > 0.0008) {
        lastP = next;
        setP(next);
      }
    };
    const onScroll = () => compute();
    const interval = setInterval(compute, 60);
    let rafId = 0;
    const rafTick = () => {
      compute();
      rafId = requestAnimationFrame(rafTick);
    };
    rafId = requestAnimationFrame(rafTick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', compute);
    compute();
    return () => {
      mounted = false;
      clearInterval(interval);
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', compute);
    };
  }, [ref]);
  return p;
}

export function useMousePerspective(strength = 1) {
  const [m, setM] = useState({ mx: 0, my: 0 });
  useEffect(() => {
    let raf = 0;
    const target = { mx: 0, my: 0 };
    const current = { mx: 0, my: 0 };
    const tick = () => {
      current.mx += (target.mx - current.mx) * 0.08;
      current.my += (target.my - current.my) * 0.08;
      setM({ mx: current.mx, my: current.my });
      if (
        Math.abs(target.mx - current.mx) > 0.001 ||
        Math.abs(target.my - current.my) > 0.001
      ) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const onMove = (e: MouseEvent) => {
      target.mx = (e.clientX / window.innerWidth - 0.5) * strength;
      target.my = (e.clientY / window.innerHeight - 0.5) * strength;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return m;
}

/* ============================================================
   Per-pillar palettes
============================================================ */
const SCENE_PALETTES = [
  { mesh: ['#fde8c8', '#f0a877', '#bd5c3e', '#5a2618'], glow: '#e89360', accent: '#d97757', label: 'studio' },
  { mesh: ['#e6edff', '#7d9eff', '#2e3f9c', '#101a4a'], glow: '#5a73d6', accent: '#4b63c4', label: 'trackers' },
  { mesh: ['#ffd6e7', '#f9a8c4', '#b8528a', '#3a0f3a'], glow: '#ec4899', accent: '#d83c87', label: 'canvas' },
  { mesh: ['#efe2c2', '#c9b577', '#7a8d4e', '#2a3a22'], glow: '#9aab63', accent: '#7d8e44', label: 'shop' },
  { mesh: ['#ecdcff', '#c4b5fd', '#7c4ed8', '#2a1456'], glow: '#a78bfa', accent: '#8b5cf6', label: 'plos' },
] as const;

function opacityFor(phase: number, i: number) {
  const d = Math.abs(phase - i);
  // Plateau model: each scene stays at full opacity for most of its
  // scroll range, then crossfades only across a narrow boundary zone
  // near the midpoint between two stages. Avoids the "ghostly two
  // illustrations overlapping" look the old Math.pow(1-d,1.4) curve
  // produced in the 0.2–0.6 d range.
  if (d <= 0.35) return 1;
  if (d >= 0.65) return 0;
  return 1 - (d - 0.35) / 0.3;
}

const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((s) => parseInt(h.slice(s, s + 2), 16));
  const A = p(a);
  const B = p(b);
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, '0')
    ).join('')
  );
};

/* ============================================================
   Scene 0 — Nest
============================================================ */
function NestScene({ opacity, phase }: { opacity: number; phase: number }) {
  const wobble = phase * 4;
  return (
    <svg className="scene-svg" viewBox="-110 -110 220 220" style={{ opacity }}>
      <defs>
        <radialGradient id="nest-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3df" stopOpacity="0.95" />
          <stop offset="38%" stopColor="#f0a877" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5a2618" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nest-strand-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbd9a8" />
          <stop offset="50%" stopColor="#d97757" />
          <stop offset="100%" stopColor="#4a1d10" />
        </linearGradient>
        <linearGradient id="nest-strand-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c1592e" />
          <stop offset="50%" stopColor="#f4c98a" />
          <stop offset="100%" stopColor="#7a3a3a" />
        </linearGradient>
        <radialGradient id="nest-egg" cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#f4c98a" />
          <stop offset="80%" stopColor="#bd6438" />
          <stop offset="100%" stopColor="#3a1208" />
        </radialGradient>
      </defs>

      <circle r="105" fill="url(#nest-halo)" />

      {Array.from({ length: 20 }).map((_, i) => {
        const r = 40 + (i % 7) * 8;
        const ry = r * (0.74 + (i % 3) * 0.08);
        const rotate = i * 18 + (i % 2 ? wobble : -wobble);
        const grad = i % 2 ? 'url(#nest-strand-a)' : 'url(#nest-strand-b)';
        return (
          <ellipse
            key={i}
            cx="0"
            cy="0"
            rx={r}
            ry={ry}
            fill="none"
            stroke={grad}
            strokeWidth={0.9 + (i % 3) * 0.35}
            strokeLinecap="round"
            opacity={0.35 + (i % 5) * 0.11}
            transform={`rotate(${rotate})`}
          />
        );
      })}

      <g transform="translate(0, 4)">
        <ellipse cx="0" cy="0" rx="24" ry="28" fill="url(#nest-egg)" />
        <ellipse cx="-8" cy="-10" rx="6" ry="3.5" fill="white" opacity="0.6" />
        <ellipse cx="0" cy="0" rx="24" ry="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
      </g>
    </svg>
  );
}

/* ============================================================
   Scene 1 — Sheets
============================================================ */
function SheetsScene({ opacity, phase }: { opacity: number; phase: number }) {
  const tilt = 2 + phase * 0.5;
  return (
    <svg className="scene-svg" viewBox="-110 -110 220 220" style={{ opacity }}>
      <defs>
        <radialGradient id="sheets-halo" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#dbe6ff" stopOpacity="0.7" />
          <stop offset="45%" stopColor="#5a73d6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#101a4a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sheet-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbfcff" />
          <stop offset="50%" stopColor="#dde8ff" />
          <stop offset="100%" stopColor="#aac0ff" />
        </linearGradient>
        <linearGradient id="sheet-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2e3f9c" />
          <stop offset="100%" stopColor="#7d9eff" />
        </linearGradient>
        <linearGradient id="sheets-accent">
          <stop offset="0%" stopColor="#4b63c4" />
          <stop offset="100%" stopColor="#86a3ff" />
        </linearGradient>
      </defs>

      <circle r="100" fill="url(#sheets-halo)" />

      {[0, 1, 2, 3].map((i) => {
        const lift = i * 18;
        const xOff = (3 - i) * 6;
        return (
          <g key={i} transform={`translate(${xOff}, ${-30 + lift}) skewX(-12) rotate(${tilt})`} opacity={0.95 - i * 0.04}>
            <rect x="2" y="3" width="88" height="44" rx="2.5" fill="black" opacity="0.18" />
            <rect x="0" y="0" width="88" height="44" rx="2.5" fill="url(#sheet-face)" stroke="url(#sheet-edge)" strokeWidth="0.6" />
            <rect x="4" y="4" width="48" height="4" rx="1" fill="url(#sheets-accent)" opacity="0.85" />
            <rect x="56" y="4" width="28" height="4" rx="1" fill="url(#sheet-edge)" opacity="0.45" />
            {[12, 18, 24, 30, 36].map((y, k) => (
              <g key={k}>
                <rect x="4" y={y} width={42 + (k % 2 ? 18 : 8)} height="2.2" rx="1" fill="#2e3f9c" opacity="0.32" />
                <rect x={62 + (k % 2 ? 0 : 4)} y={y} width={16 - (k % 3) * 2} height="2.2" rx="1" fill="#86a3ff" opacity={0.55 - k * 0.06} />
              </g>
            ))}
            <rect x="64" y="36" width="20" height="5" rx="1" fill="url(#sheets-accent)" opacity="0.9" />
          </g>
        );
      })}

      <circle cx="60" cy="-50" r="3" fill="#86a3ff" opacity="0.9" />
      <circle cx="-72" cy="40" r="2.4" fill="#4b63c4" opacity="0.8" />
      <circle cx="-50" cy="-62" r="1.8" fill="#fbfcff" opacity="0.9" />
    </svg>
  );
}

/* ============================================================
   Scene 2 — Iridescent blob (CSS-driven)
============================================================ */
function IridescentBlob({ opacity }: { opacity: number }) {
  return (
    <div className="iri-wrap" style={{ opacity }}>
      <div className="iri-halo" />
      <div className="iri-blob">
        <div className="iri-shine" />
        <div className="iri-shine-2" />
      </div>
      <div className="iri-dot iri-dot-a" />
      <div className="iri-dot iri-dot-b" />
      <div className="iri-dot iri-dot-c" />
    </div>
  );
}

/* ============================================================
   Scene 3 — Shop stack
============================================================ */
function ShopStack({ opacity }: { opacity: number }) {
  return (
    <svg className="scene-svg" viewBox="-110 -110 220 220" style={{ opacity }}>
      <defs>
        <radialGradient id="shop-halo" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#f3ead4" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#9aab63" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2a3a22" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="merch-1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f3ead4" /><stop offset="60%" stopColor="#d9c98c" /><stop offset="100%" stopColor="#7a6a32" /></linearGradient>
        <linearGradient id="merch-2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#bfd28a" /><stop offset="60%" stopColor="#7a8d4e" /><stop offset="100%" stopColor="#34431f" /></linearGradient>
        <linearGradient id="merch-3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e4b48a" /><stop offset="60%" stopColor="#b07a50" /><stop offset="100%" stopColor="#5c3722" /></linearGradient>
        <linearGradient id="merch-4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#dec5a0" /><stop offset="60%" stopColor="#a08252" /><stop offset="100%" stopColor="#3a2a12" /></linearGradient>
        <linearGradient id="merch-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.55)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></linearGradient>
      </defs>

      <circle r="105" fill="url(#shop-halo)" />

      <g transform="translate(0, 10)">
        {[
          { y: 36, fill: 'url(#merch-1)', w: 96, h: 16 },
          { y: 18, fill: 'url(#merch-2)', w: 84, h: 16 },
          { y: 0, fill: 'url(#merch-3)', w: 72, h: 14 },
          { y: -16, fill: 'url(#merch-4)', w: 60, h: 14 },
        ].map((it, i) => {
          const x = -it.w / 2;
          const sk = -14;
          return (
            <g key={i} transform={`translate(0,${it.y})`}>
              <rect x={x + 4} y={4} width={it.w} height={it.h} rx="3" fill="black" opacity="0.22" transform={`skewY(${sk})`} />
              <polygon
                points={`${x + it.w},0 ${x + it.w + 8},${it.h * 0.45} ${x + it.w + 8},${it.h + it.h * 0.45} ${x + it.w},${it.h}`}
                fill={it.fill}
                opacity="0.7"
              />
              <rect x={x} y={0} width={it.w} height={it.h} rx="3" fill={it.fill} transform={`skewY(${sk})`} />
              <rect x={x} y={0} width={it.w} height={it.h * 0.4} rx="3" fill="url(#merch-top)" transform={`skewY(${sk})`} />
              <rect x={x - 4} y={it.h * 0.5 - 3} width="10" height="6" rx="1" fill="#fbfaf2" opacity="0.85" transform={`skewY(${sk})`} />
            </g>
          );
        })}
      </g>

      <g transform="translate(50,-58) rotate(12)">
        <rect x="-12" y="-7" width="28" height="14" rx="2" fill="#fbfaf2" stroke="#7a8d4e" strokeWidth="0.6" />
        <circle cx="-10" cy="0" r="1.3" fill="#7a8d4e" />
      </g>
    </svg>
  );
}

/* ============================================================
   Scene 4 — PLOS pearl + heartbeat orbit
============================================================ */
function PlosOrbit({ opacity }: { opacity: number }) {
  const beatPath =
    'M 0,0 L 18,0 L 22,-12 L 28,16 L 34,-22 L 40,22 L 46,-6 L 52,0 L 70,0';
  return (
    <svg className="scene-svg" viewBox="-110 -110 220 220" style={{ opacity }}>
      <defs>
        <radialGradient id="plos-halo" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#ecdcff" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2a1456" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="plos-pearl" cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fef0ff" />
          <stop offset="30%" stopColor="#e8d6ff" />
          <stop offset="60%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#2a1456" />
        </radialGradient>
        <linearGradient id="plos-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
          <stop offset="20%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#c4b5fd" />
          <stop offset="80%" stopColor="#9c7ce8" />
          <stop offset="100%" stopColor="#9c7ce8" stopOpacity="0" />
        </linearGradient>
        <filter id="plos-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle r="105" fill="url(#plos-halo)" />

      <ellipse cx="0" cy="0" rx="90" ry="22" fill="none" stroke="url(#plos-arc)" strokeWidth="0.8" opacity="0.7" transform="rotate(-12)" />
      <ellipse cx="0" cy="0" rx="78" ry="18" fill="none" stroke="url(#plos-arc)" strokeWidth="0.6" opacity="0.45" transform="rotate(8)" />

      <g>
        <circle cx="0" cy="0" r="36" fill="url(#plos-pearl)" />
        <ellipse cx="-12" cy="-14" rx="9" ry="5" fill="white" opacity="0.55" />
        <circle cx="0" cy="0" r="36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
      </g>

      <g transform="translate(-35,-58) rotate(-8)" filter="url(#plos-glow)">
        <path d={beatPath} fill="none" stroke="url(#plos-arc)" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <g transform="translate(-35,60) rotate(8) scale(1,-1)">
        <path d={beatPath} fill="none" stroke="url(#plos-arc)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </g>

      <g transform="rotate(-12)">
        <circle cx="90" cy="0" r="3.5" fill="#fbbf24">
          <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="-90" cy="0" r="2.5" fill="#c4b5fd" />
      </g>
    </svg>
  );
}

/* ============================================================
   ScrollScene — composes everything
============================================================ */
export function ScrollScene({
  phase = 0,
  mx = 0,
  my = 0,
}: {
  phase?: number;
  mx?: number;
  my?: number;
}) {
  const stageTilt = my * -8;
  const stageSpin = mx * 6 + phase * 6;
  const stageScale = 1 + Math.abs(my) * 0.03;

  const lo = Math.max(0, Math.min(SCENE_PALETTES.length - 2, Math.floor(phase)));
  const hi = lo + 1;
  const t = Math.max(0, Math.min(1, phase - lo));
  const cur = SCENE_PALETTES[lo];
  const nxt = SCENE_PALETTES[hi];

  const haloColor = mixHex(cur.glow, nxt.glow, t);
  const haloDeep = mixHex(cur.mesh[3], nxt.mesh[3], t);
  const haloMid = mixHex(cur.mesh[1], nxt.mesh[1], t);

  return (
    <div
      className="scene-wrap"
      style={
        {
          perspective: 1600,
          transform: `translate3d(${mx * 18}px, ${my * 14}px, 0)`,
          '--halo-glow': haloColor,
          '--halo-deep': haloDeep,
          '--halo-mid': haloMid,
        } as React.CSSProperties
      }
    >
      <div className="scene-atmos" />

      <div
        className="scene-stage-2"
        style={{
          transform: `rotateX(${stageTilt}deg) rotateY(${stageSpin}deg) scale(${stageScale})`,
        }}
      >
        <NestScene opacity={opacityFor(phase, 0)} phase={phase} />
        <SheetsScene opacity={opacityFor(phase, 1)} phase={phase} />
        <IridescentBlob opacity={opacityFor(phase, 2)} />
        <ShopStack opacity={opacityFor(phase, 3)} />
        <PlosOrbit opacity={opacityFor(phase, 4)} />
      </div>

      <svg className="scene-ring" viewBox="-110 -110 220 220" aria-hidden>
        <circle cx="0" cy="0" r="104" fill="none" stroke={haloColor} strokeOpacity="0.18" strokeWidth="0.5" strokeDasharray="2 6" />
        <circle cx="0" cy="0" r="107" fill="none" stroke={haloDeep} strokeOpacity="0.35" strokeWidth="0.3" />
      </svg>

      <div className="scene-grain" aria-hidden />
    </div>
  );
}

/* ============================================================
   Reveal + TiltCard helpers
============================================================ */
export function Reveal({
  children,
  delay = 0,
  as: As = 'div',
  className = '',
  ...rest
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3;
  as?: any;
  className?: string;
  [k: string]: any;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      // Wide bottom rootMargin so off-screen items reveal as soon as the page
      // renders — same fallback pattern as PlosReveal so screenshots / SSR
      // / slow devices don't leave content stuck at opacity 0.
      { threshold: 0, rootMargin: '0px 0px 240px 0px' }
    );
    obs.observe(ref.current);
    const fallback = window.setTimeout(() => setShown(true), 1000);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);
  const delayClass = delay > 0 ? ` reveal-delay-${delay}` : '';
  const cls = `reveal${delayClass}${shown ? ' in' : ''} ${className}`.trim();
  return (
    <As ref={ref} className={cls} {...rest}>
      {children}
    </As>
  );
}

export function TiltCard({
  children,
  ...rest
}: {
  children: React.ReactNode;
  [k: string]: any;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    ref.current.style.transform = `perspective(1000px) rotateX(${y * -4}deg) rotateY(${x * 6}deg) translateY(-4px)`;
  };
  const onLeave = () => {
    if (ref.current)
      ref.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  };
  return (
    <div ref={ref} className="tilt-card" onMouseMove={onMove} onMouseLeave={onLeave} {...rest}>
      {children}
    </div>
  );
}

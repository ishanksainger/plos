import type { CSSProperties, ReactElement } from 'react';
import { PlosReveal } from './PlosReveal';

/**
 * LifeRing — small SVG diorama per life domain (money, health, habits, people).
 * LifeRingsBar — the row of four. Ported 1:1 from the prototype's scenes.jsx.
 */

export function RingMoney() {
  return (
    <svg className="lr-svg" viewBox="-60 -60 120 120">
      <defs>
        <radialGradient id="lr-money-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7a3a2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lr-coin-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d6" />
          <stop offset="50%" stopColor="#f3c34f" />
          <stop offset="100%" stopColor="#8a5a18" />
        </linearGradient>
        <linearGradient id="lr-coin-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c89240" />
          <stop offset="100%" stopColor="#5a3a0e" />
        </linearGradient>
      </defs>
      <circle r="58" fill="url(#lr-money-halo)" />
      <g className="lr-bob">
        {[0, 1, 2, 3].map((i) => {
          const y = 18 - i * 9;
          const rx = 30;
          const ry = 8;
          return (
            <g key={i}>
              <path
                d={`M ${-rx},${y} A ${rx} ${ry} 0 0 0 ${rx},${y} L ${rx},${y + 5} A ${rx} ${ry} 0 0 1 ${-rx},${y + 5} Z`}
                fill="url(#lr-coin-side)"
              />
              <ellipse cx="0" cy={y} rx={rx} ry={ry} fill="url(#lr-coin-face)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
              <text x="0" y={y + 2.5} textAnchor="middle" fontSize="6" fontFamily="serif" fill="rgba(80,40,8,0.5)">₹</text>
            </g>
          );
        })}
      </g>
      <circle cx="32" cy="-30" r="1.6" fill="#fff" opacity="0.85">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function RingHealth() {
  return (
    <svg className="lr-svg" viewBox="-60 -60 120 120">
      <defs>
        <radialGradient id="lr-heart-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ec4899" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2a0f1a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lr-heart" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#ffe0e8" />
          <stop offset="38%" stopColor="#fb7185" />
          <stop offset="78%" stopColor="#be185d" />
          <stop offset="100%" stopColor="#3a0a1c" />
        </radialGradient>
        <linearGradient id="lr-heart-arc">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0" />
          <stop offset="50%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle r="58" fill="url(#lr-heart-halo)" />
      <circle r="34" fill="none" stroke="url(#lr-heart-arc)" strokeWidth="0.8" className="lr-pulse-ring lr-pulse-r1" />
      <circle r="44" fill="none" stroke="url(#lr-heart-arc)" strokeWidth="0.5" className="lr-pulse-ring lr-pulse-r2" />
      <path
        d="M -50,8 L -28,8 L -22,-12 L -14,18 L -6,-22 L 2,22 L 10,-4 L 18,0 L 50,0"
        fill="none"
        stroke="#fb7185"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="translate(0, -2) scale(0.7, 0.6)"
        opacity="0.65"
      />
      <g className="lr-heartbeat">
        <path
          d="M 0,12 C -10,4 -22,-4 -22,-14 C -22,-22 -14,-26 -8,-22 C -4,-19 -2,-16 0,-13 C 2,-16 4,-19 8,-22 C 14,-26 22,-22 22,-14 C 22,-4 10,4 0,12 Z"
          fill="url(#lr-heart)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.4"
        />
        <ellipse cx="-8" cy="-15" rx="4" ry="2.5" fill="white" opacity="0.45" />
      </g>
    </svg>
  );
}

export function RingHabits() {
  return (
    <svg className="lr-svg" viewBox="-60 -60 120 120">
      <defs>
        <radialGradient id="lr-habit-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1a0a3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lr-habit-strand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle r="58" fill="url(#lr-habit-halo)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse
          key={i}
          cx="0"
          cy="0"
          rx={20 + i * 4}
          ry={20 + i * 4 * 0.78}
          fill="none"
          stroke="url(#lr-habit-strand)"
          strokeWidth="0.7"
          opacity={0.5 - i * 0.06}
          transform={`rotate(${i * 28})`}
        />
      ))}
      <g className="lr-orbit-slow">
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const r = 32;
          const filled = i >= 2 && i < 13;
          return filled ? (
            <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="2.5" fill="#a78bfa" />
          ) : (
            <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="2" fill="none" stroke="#a78bfa" strokeOpacity="0.5" strokeWidth="0.8" />
          );
        })}
      </g>
      <circle cx="32" cy="0" r="3.5" fill="none" stroke="#fbbf24" strokeWidth="1">
        <animate attributeName="r" values="3.5;6;3.5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="32" cy="0" r="2" fill="#fbbf24" />
    </svg>
  );
}

export function RingPeople() {
  return (
    <svg className="lr-svg" viewBox="-60 -60 120 120">
      <defs>
        <radialGradient id="lr-people-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#0891b2" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0a2030" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lr-av-1" cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#fde68a" /><stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="lr-av-2" cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#fbcfe8" /><stop offset="100%" stopColor="#9d174d" />
        </radialGradient>
        <radialGradient id="lr-av-3" cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#a5f3fc" /><stop offset="100%" stopColor="#155e75" />
        </radialGradient>
        <radialGradient id="lr-av-4" cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#ddd6fe" /><stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
      </defs>
      <circle r="58" fill="url(#lr-people-halo)" />
      <g stroke="rgba(167,139,250,0.4)" strokeWidth="0.5" fill="none">
        <line x1="-18" y1="6" x2="14" y2="-10" />
        <line x1="14" y1="-10" x2="22" y2="14" />
        <line x1="-18" y1="6" x2="-8" y2="22" />
        <line x1="22" y1="14" x2="-8" y2="22" />
      </g>
      <g className="lr-bob">
        <circle cx="-18" cy="6" r="14" fill="url(#lr-av-1)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <circle cx="14" cy="-10" r="12" fill="url(#lr-av-2)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <circle cx="22" cy="14" r="10" fill="url(#lr-av-3)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <circle cx="-8" cy="22" r="9" fill="url(#lr-av-4)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      </g>
      <circle cx="-8" cy="-2" r="1.5" fill="#22d3ee">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export type LifeRingData = {
  fig: string | number;
  label?: string;
  sub: string;
};

export function LifeRingsBar({
  data,
  onNavigate,
}: {
  data: { money: LifeRingData; health: LifeRingData; habits: LifeRingData; people: LifeRingData };
  onNavigate: (key: 'finance' | 'health' | 'habits' | 'people') => void;
}) {
  const items: Array<{
    key: 'finance' | 'health' | 'habits' | 'people';
    accent: string;
    Ring: () => ReactElement;
    big: string | number;
    small: string;
    title: string;
    sub: string;
  }> = [
    { key: 'finance', accent: '#fbbf24', Ring: RingMoney,  big: data.money.fig,  small: data.money.label ?? '',  title: 'Money pressure', sub: data.money.sub },
    { key: 'health',  accent: '#fb7185', Ring: RingHealth, big: data.health.fig, small: data.health.label ?? '', title: 'Body & rest',     sub: data.health.sub },
    { key: 'habits',  accent: '#a78bfa', Ring: RingHabits, big: data.habits.fig, small: data.habits.label ?? '', title: 'Rhythm',          sub: data.habits.sub },
    { key: 'people',  accent: '#22d3ee', Ring: RingPeople, big: data.people.fig, small: data.people.label ?? '', title: 'People load',     sub: data.people.sub },
  ];

  return (
    <div className="life-rings-bar">
      {items.map((it, i) => {
        const style = { ['--ring-accent' as string]: it.accent } as CSSProperties;
        return (
          <PlosReveal key={it.key} delay={i + 1}>
            <button
              type="button"
              className="life-ring"
              style={style}
              onClick={() => onNavigate(it.key)}
            >
              <div className="life-ring-scene">
                <it.Ring />
              </div>
              <div className="life-ring-meta">
                <div className="life-ring-fig">
                  {it.big}
                  {it.small && <span className="lr-small">{it.small}</span>}
                </div>
                <div className="life-ring-title">{it.title}</div>
                <div className="life-ring-sub">{it.sub}</div>
              </div>
              <span className="life-ring-arrow">→</span>
            </button>
          </PlosReveal>
        );
      })}
    </div>
  );
}

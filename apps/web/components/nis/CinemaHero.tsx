'use client';

import Link from 'next/link';
import {
  NestScene,
  SheetsScene,
  IridescentBlob,
  ShopStack,
  PlosOrbit,
} from './scroll';

type Stage = {
  num: string;
  label: string;
  headline: string[];
  sub: string;
  cta: { text: string; href: string };
  accent: string;
  bgX: string;
  bgY: string;
  mesh1: string;
  mesh2: string;
  mesh3: string;
  mesh4: string;
  edge: string;
  scene: 'nest' | 'sheets' | 'iri' | 'shop' | 'plos';
};

const STAGES: Stage[] = [
  {
    num: '00', label: 'Studio',
    headline: ['Your creative nest.', 'Built for India.'],
    sub: 'NIS is a small studio in Pune building four small things — trackers, canvas scenes, merch, and PLOS.',
    cta: { text: 'Browse trackers', href: '/trackers' },
    accent: '#d97757',
    bgX: '28%', bgY: '22%',
    mesh1: 'rgba(244, 170, 109, 0.38)',
    mesh2: 'rgba(217, 119, 87, 0.30)',
    mesh3: 'rgba(122, 58, 58, 0.28)',
    mesh4: 'rgba(253, 232, 200, 0.20)',
    edge:  'rgba(20, 9, 4, 0.45)',
    scene: 'nest',
  },
  {
    num: '01', label: 'Trackers',
    headline: ['Sheets you', 'will actually', '_open_.'],
    sub: 'Four spreadsheets that hold a freelance life together — GST, dual-income, weddings, small business. Drop-in formulas, INR-native, CA-friendly.',
    cta: { text: 'See the four', href: '/trackers' },
    accent: '#4b63c4',
    bgX: '70%', bgY: '32%',
    mesh1: 'rgba(125, 158, 255, 0.30)',
    mesh2: 'rgba(46, 63, 156, 0.32)',
    mesh3: 'rgba(16, 26, 74, 0.40)',
    mesh4: 'rgba(220, 232, 255, 0.18)',
    edge:  'rgba(6, 10, 30, 0.55)',
    scene: 'sheets',
  },
  {
    num: '02', label: 'Canvas',
    headline: ['Scenes', 'that hold', 'a _feeling_.'],
    sub: "Six original 3D and motion scenes from Nikita's room. Built in Spline, rendered in browsers, dropped into pages, slides, and posters.",
    cta: { text: 'Open the canvas', href: '/canvas' },
    accent: '#d83c87',
    bgX: '42%', bgY: '62%',
    mesh1: 'rgba(236, 72, 153, 0.36)',
    mesh2: 'rgba(251, 191, 36, 0.20)',
    mesh3: 'rgba(167, 139, 250, 0.28)',
    mesh4: 'rgba(34, 211, 238, 0.18)',
    edge:  'rgba(40, 8, 36, 0.5)',
    scene: 'iri',
  },
  {
    num: '03', label: 'Shop',
    headline: ['Small store.', 'Well-made', '_things_.'],
    sub: 'Tees, notebooks, a tote, a cap. Printed in Pune, shipped India-wide, returns within seven days. Checkout via UPI or Razorpay.',
    cta: { text: 'Visit the shop', href: '/shop' },
    accent: '#7d8e44',
    bgX: '58%', bgY: '42%',
    mesh1: 'rgba(176, 122, 80, 0.30)',
    mesh2: 'rgba(125, 142, 68, 0.32)',
    mesh3: 'rgba(42, 58, 34, 0.32)',
    mesh4: 'rgba(243, 234, 212, 0.22)',
    edge:  'rgba(14, 22, 10, 0.5)',
    scene: 'shop',
  },
  {
    num: '04', label: 'PLOS',
    headline: ['A diary of life,', 'in _software_.'],
    sub: 'PLOS — Personal Life Operating System. Money, health, habits, family, admin. One timeline, one place, one calm view of what you actually carry.',
    cta: { text: 'Open the PLOS prototype', href: '/plos' },
    accent: '#8b5cf6',
    bgX: '50%', bgY: '50%',
    mesh1: 'rgba(167, 139, 250, 0.34)',
    mesh2: 'rgba(251, 191, 36, 0.16)',
    mesh3: 'rgba(124, 78, 216, 0.32)',
    mesh4: 'rgba(236, 220, 255, 0.20)',
    edge:  'rgba(16, 8, 36, 0.55)',
    scene: 'plos',
  },
];

function renderHeadline(lines: string[], accent: string) {
  return lines.map((line, i) => {
    const html = line.replace(/_([^_]+)_/g, (_, w) => `<em style="color:${accent}">${w}</em>`);
    return <span key={i} style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

function StageScene({ kind, phaseIdx }: { kind: Stage['scene']; phaseIdx: number }) {
  // Each scene takes an `opacity` prop; we pass 1 so the section's scene
  // is always fully visible. `phase` on Nest/Sheets is just used internally
  // for animation seeding — passing the stage index is fine.
  switch (kind) {
    case 'nest':   return <NestScene opacity={1} phase={phaseIdx} />;
    case 'sheets': return <SheetsScene opacity={1} phase={phaseIdx} />;
    case 'iri':    return <IridescentBlob opacity={1} />;
    case 'shop':   return <ShopStack opacity={1} />;
    case 'plos':   return <PlosOrbit opacity={1} />;
  }
}

export function CinemaHero() {
  return (
    <div className="nis-hero-stack">
      {STAGES.map((stage, i) => (
        <section
          key={i}
          className="nis-hero-stage"
          style={
            {
              '--stage-accent': stage.accent,
              '--stage-mesh-1': stage.mesh1,
              '--stage-mesh-2': stage.mesh2,
              '--stage-mesh-3': stage.mesh3,
              '--stage-mesh-4': stage.mesh4,
              '--stage-mesh-edge': stage.edge,
              '--stage-bg-x': stage.bgX,
              '--stage-bg-y': stage.bgY,
            } as React.CSSProperties
          }
        >
          <div className="nis-hero-stage-bg" aria-hidden />
          <div className="nis-hero-stage-inner">
            <div className="nis-hero-stage-copy">
              <div className="nis-hero-stage-meta">
                <span>{stage.num} · {stage.label}</span>
                <span className="nis-hero-stage-meta-bar">
                  <span style={{ width: `${((i + 1) / STAGES.length) * 100}%` }} />
                </span>
                <span>
                  {String(i + 1).padStart(2, '0')} / {String(STAGES.length).padStart(2, '0')}
                </span>
              </div>
              <h1 className="nis-hero-stage-headline">
                {renderHeadline(stage.headline, stage.accent)}
              </h1>
              <p className="nis-hero-stage-sub">{stage.sub}</p>
              <div className="nis-hero-stage-cta">
                <Link
                  href={stage.cta.href}
                  className="nis-btn nis-btn-primary"
                  style={{ background: stage.accent, borderColor: stage.accent }}
                >
                  {stage.cta.text}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                    <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
                {i === 0 && (
                  <Link href="/plos" className="nis-btn">Open PLOS</Link>
                )}
              </div>
            </div>
            <div className="nis-hero-stage-scene">
              <div className="scene-wrap">
                <div className="scene-stage-2">
                  <StageScene kind={stage.scene} phaseIdx={i} />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

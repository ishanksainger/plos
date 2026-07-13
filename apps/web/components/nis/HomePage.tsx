'use client';

import Link from 'next/link';
import { CinemaHero } from './CinemaHero';
import { Reveal, TiltCard } from './scroll';
import { TrackerCard } from './TrackerCard';
import { Marquee } from './Marquee';
import { ImageSlot } from './ImageSlot';
import { NIS_STATS, NIS_TRACKERS, NIS_TESTIMONIALS } from '@/lib/nis-data';
import { getPurchasableTracker } from '@/lib/tracker-catalog';

const PLOS_URL = process.env.NEXT_PUBLIC_PLOS_URL ?? 'http://localhost:5173';

// Only feature trackers with a real file behind them (active in the catalog).
const LIVE_TRACKERS = NIS_TRACKERS.filter((t) => getPurchasableTracker(t.slug));

export function HomePage() {
  return (
    <>
      <CinemaHero />

      <section style={{ position: 'relative', zIndex: 2, background: 'var(--bg)' }}>
        <div className="nis-section">
          <Reveal>
            <div className="nis-section-eyebrow">A note from the studio</div>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="nis-h2" style={{ maxWidth: '18ch' }}>
              Two people. Four small things. One nest.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p style={{ fontSize: 19, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: '54ch', marginTop: 28 }}>
              We sell spreadsheets that we needed first. We build software for our own home. We print tees that we wear. NIS is one studio for the work, money, and quiet daily things that hold a life together.
            </p>
          </Reveal>
        </div>

        <div className="nis-section compact">
          <div className="stat-row">
            {NIS_STATS.map((s, i) => (
              <Reveal key={i} className="stat-cell" delay={(i as 0 | 1 | 2)}>
                <div className="fig">{s.fig}</div>
                <div className="label">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>

        <Marquee items={['Trackers', 'Canvas', 'Shop', 'PLOS', 'Made in India', 'India only']} />

        <div className="nis-section">
          <Reveal>
            <div className="nis-section-head">
              <div>
                <div className="nis-section-eyebrow">01 · Trackers</div>
                <h2 className="nis-h2">Sheets, well-made.</h2>
              </div>
              <p className="nis-section-body">
                We don&apos;t sell &ldquo;templates.&rdquo; We sell the spreadsheets we needed ourselves — the GST log that survives an audit, the dual-income tracker that ended four arguments, the wedding sheet that keeps nine ceremonies inside one budget.
              </p>
            </div>
          </Reveal>
          <div className="nis-tracker-grid">
            {LIVE_TRACKERS.slice(0, 2).map((t, i) => (
              <Reveal key={t.slug} delay={((i + 1) as 1 | 2)}>
                <TiltCard>
                  <TrackerCard t={t} />
                </TiltCard>
              </Reveal>
            ))}
          </div>
          <Reveal delay={3}>
            <div style={{ marginTop: 28, textAlign: 'right' }}>
              <Link href="/trackers" className="nis-btn">
                All trackers
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                  <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Hidden until we have a REAL customer quote — see NIS_TESTIMONIALS. */}
        {NIS_TESTIMONIALS.length > 0 && (
          <>
            <div className="section-divider" />

            <div className="nis-section">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 'clamp(28px, 5vw, 72px)' }}>
                <Reveal>
                  <div className="nis-section-eyebrow">Why people stay</div>
                </Reveal>
                <Reveal delay={1}>
                  <div>
                    <p className="nis-pull">&ldquo;{NIS_TESTIMONIALS[0].quote}&rdquo;</p>
                    <div style={{ marginTop: 24, fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--nis-font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      — {NIS_TESTIMONIALS[0].who}
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </>
        )}

        <div className="section-divider" />

        <div className="nis-section">
          <Reveal>
            <div className="nis-feature">
              <div
                className="nis-feature-art"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(236,72,153,0.08))',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <ImageSlot
                  id="home-plos-screenshot"
                  shape="rounded"
                  radius={16}
                  placeholder="Drop a PLOS screenshot"
                  style={{ width: '82%', height: '82%' }}
                />
              </div>
              <div>
                <div className="nis-section-eyebrow">04 · PLOS</div>
                <h2 className="nis-h2" style={{ marginBottom: 18 }}>
                  The app that holds your week.
                </h2>
                <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: '52ch', marginBottom: 28 }}>
                  PLOS is the long game. A daily diary of life in software form. Money, health, habits, family, admin — one timeline you can read like a heartbeat.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Link href="/plos" className="nis-btn nis-btn-primary">See the PLOS pillar</Link>
                  <a className="nis-btn" href={PLOS_URL} target="_blank" rel="noreferrer">
                    Open the prototype
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

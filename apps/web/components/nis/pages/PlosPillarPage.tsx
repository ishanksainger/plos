'use client';

import Link from 'next/link';
import { Reveal, TiltCard } from '@/components/nis/scroll';
import { ImageSlot } from '@/components/nis/ImageSlot';
import { StreakChainDemo } from '@/components/nis/StreakChainDemo';
import { NIS_TESTIMONIALS } from '@/lib/nis-data';

const MODULES: [string, string][] = [
  ['Today', 'Priorities at the top. Overdue, due, upcoming. A diary feed below.'],
  ['Insights', 'A week-at-a-glance dashboard — money pressure, habit completion, people load.'],
  ['Habits as rhythm', 'Each habit a flowing chain across 42 days. Read it like a heartbeat.'],
  ['People', 'Avatars and a load bar. Whose responsibilities are you carrying right now?'],
  ['Finance', 'Bills, SIPs, school fees, GST filings — all INR-native, with recurring rules.'],
  ['Timeline', 'Every state change, every completion, the audit trail of a life.'],
  ['Solo / Family / Shared', 'Three account modes. Change later in Settings; warnings included.'],
  ['Notifications', 'In-app today, email + WhatsApp later — strict opt-in, no growth-hack pings.'],
];

const demoHabit = {
  color: '#7c3aed',
  pattern: Array.from({ length: 42 }, (_, i) => {
    if (i === 41) return -1;
    if (i === 8 || i === 17 || i === 28) return 0;
    return 1;
  }),
};

export function PlosPillarPage() {
  return (
    <>
      <section className="nis-section" style={{ paddingTop: 'clamp(80px, 12vw, 180px)' }}>
        <Reveal>
          <div className="nis-section-eyebrow">04 · PLOS</div>
        </Reveal>
        <Reveal delay={1}>
          <h1
            className="nis-h2"
            style={{
              fontSize: 'clamp(56px, 9vw, 144px)',
              lineHeight: 0.92,
              maxWidth: '15ch',
            }}
          >
            A diary of life,
            <br />
            <em
              style={{
                fontFamily: 'var(--nis-font-serif)',
                fontStyle: 'italic',
                color: 'var(--accent)',
              }}
            >
              in software
            </em>
            .
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p
            style={{
              fontSize: 'clamp(17px, 1.5vw, 22px)',
              color: 'var(--ink-2)',
              lineHeight: 1.55,
              maxWidth: '46ch',
              marginTop: 40,
            }}
          >
            Money, health, habits, family, admin. One timeline you can read like a heartbeat. PLOS holds the small daily commitments that keep a life together — and shows you what slipped before someone has to ask.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
            <a
              className="nis-btn nis-btn-primary"
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              Open the live prototype →
            </a>
            <Link href="/" className="nis-btn">Back to the nest</Link>
          </div>
        </Reveal>
      </section>

      <div className="section-divider" />

      <section className="nis-section">
        <Reveal>
          <div className="nis-section-head">
            <div>
              <div className="nis-section-eyebrow">The signature</div>
              <h2 className="nis-h2" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
                Habits as rhythm.
              </h2>
            </div>
            <p className="nis-section-body">
              Every habit becomes a flowing chain. 42 days of dots and gaps you can read at a glance. Filled links are days you showed up. Open rings are days you didn&apos;t. Today pulses.
            </p>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--nis-radius-lg)',
              padding: 'clamp(28px, 4vw, 56px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--nis-font-display)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--ink-1)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Morning walk · Priya
                </div>
                <div
                  style={{
                    color: 'var(--ink-3)',
                    fontSize: 13,
                    marginTop: 4,
                    fontFamily: 'var(--nis-font-mono)',
                  }}
                >
                  Daily · target 6:30 am · longest 71 days
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--nis-font-mono)',
                    fontSize: 36,
                    fontWeight: 500,
                    color: 'var(--accent)',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                  }}
                >
                  38
                  <span
                    style={{
                      fontSize: 14,
                      color: 'var(--ink-3)',
                      fontWeight: 400,
                      marginLeft: 6,
                    }}
                  >
                    days
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    fontFamily: 'var(--nis-font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    marginTop: 4,
                  }}
                >
                  current streak
                </div>
              </div>
            </div>
            <StreakChainDemo habit={demoHabit} />
          </div>
        </Reveal>
      </section>

      <div className="section-divider" />

      <section className="nis-section">
        <Reveal>
          <div className="nis-section-head">
            <div>
              <div className="nis-section-eyebrow">What&apos;s inside</div>
              <h2 className="nis-h2" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
                Eight screens that add up.
              </h2>
            </div>
            <p className="nis-section-body">
              No notion-style template overwhelm. Every screen has one job — and earns its place.
            </p>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {MODULES.map(([h, d], i) => (
            <Reveal key={h} delay={(i % 3) as 0 | 1 | 2}>
              <TiltCard>
                <article className="nis-card" style={{ minHeight: 200 }}>
                  <div className="card-eyebrow">
                    <span className="dot" style={{ background: 'var(--accent)' }} />
                    Module
                  </div>
                  <h3 className="card-title">{h}</h3>
                  <p className="card-desc" style={{ marginBottom: 0 }}>{d}</p>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      <section className="nis-section">
        <Reveal>
          <div className="nis-section-head">
            <div>
              <div className="nis-section-eyebrow">Words from users</div>
              <h2 className="nis-h2" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
                How it lands.
              </h2>
            </div>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          {NIS_TESTIMONIALS.map((q, i) => (
            <Reveal key={i} delay={(i + 1) as 1 | 2}>
              <TiltCard>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--nis-radius-lg)',
                    padding: 32,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--bg-card-hover)',
                      marginBottom: 24,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <ImageSlot
                      id={`testimonial-${i}`}
                      shape="circle"
                      placeholder="Photo"
                      style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' } as React.CSSProperties}
                    />
                  </div>
                  <p
                    className="nis-pull"
                    style={{ fontSize: 22, marginBottom: 24, maxWidth: 'none' }}
                  >
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div
                    style={{
                      fontFamily: 'var(--nis-font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                    }}
                  >
                    — {q.who}
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      <section
        className="nis-section"
        style={{ textAlign: 'center', paddingBottom: 'clamp(80px, 12vw, 180px)' }}
      >
        <Reveal>
          <h2
            className="nis-h2"
            style={{
              fontSize: 'clamp(40px, 7vw, 96px)',
              maxWidth: '14ch',
              margin: '0 auto 28px',
            }}
          >
            Built for the{' '}
            <em
              style={{
                fontFamily: 'var(--nis-font-serif)',
                fontStyle: 'italic',
                color: 'var(--accent)',
              }}
            >
              long game
            </em>
            .
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p style={{ color: 'var(--ink-2)', fontSize: 18, maxWidth: '46ch', margin: '0 auto 36px' }}>
            PLOS is the slow product. We won&apos;t ship a feature unless we&apos;d carry it ourselves.
          </p>
        </Reveal>
        <Reveal delay={2}>
          <a
            className="nis-btn nis-btn-primary"
            style={{ padding: '14px 28px', fontSize: 15, textDecoration: 'none' }}
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
          >
            Open the live prototype →
          </a>
        </Reveal>
      </section>
    </>
  );
}

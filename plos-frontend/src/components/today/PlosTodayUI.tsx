import type { Responsibility } from '../../types/dashboard';
import type { TodayEvent } from '../../types/today';

export const fmtINR = (n: number) =>
  '₹ ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

export function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ============================================================
   The signature pearl scene — animated orbit + heartbeat
============================================================ */
export function PlosPearlScene() {
  return (
    <div className="plos-pearl-scene" aria-hidden>
      <div className="plos-pearl-glow" />
      <svg viewBox="-110 -110 220 220" width="100%" height="100%">
        <defs>
          <radialGradient id="ppa-pearl" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#fef0ff" />
            <stop offset="30%" stopColor="#e8d6ff" />
            <stop offset="62%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#2a1456" />
          </radialGradient>
          <linearGradient id="ppa-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="25%" stopColor="#fbbf24" />
            <stop offset="55%" stopColor="#c4b5fd" />
            <stop offset="85%" stopColor="#9c7ce8" />
            <stop offset="100%" stopColor="#9c7ce8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="ppa-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ec4899" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <filter id="ppa-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle r="105" fill="url(#ppa-halo)" />

        <g className="ppa-orbit-slow">
          <ellipse cx="0" cy="0" rx="90" ry="22" fill="none" stroke="url(#ppa-arc)" strokeWidth="0.9" transform="rotate(-10)" />
          <ellipse cx="0" cy="0" rx="78" ry="18" fill="none" stroke="url(#ppa-arc)" strokeWidth="0.6" opacity="0.6" transform="rotate(14)" />
        </g>

        <g transform="translate(-36, -60) rotate(-6)" filter="url(#ppa-glow)" className="ppa-beat">
          <path
            d="M 0,0 L 16,0 L 20,-12 L 26,16 L 32,-22 L 38,22 L 44,-6 L 50,0 L 72,0"
            fill="none"
            stroke="url(#ppa-arc)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>

        <g className="ppa-pearl-tilt">
          <circle cx="0" cy="0" r="36" fill="url(#ppa-pearl)" />
          <ellipse cx="-12" cy="-14" rx="9" ry="5" fill="white" opacity="0.55" />
          <circle cx="0" cy="0" r="36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
        </g>

        <g className="ppa-orbit-fast">
          <circle cx="92" cy="0" r="3.5" fill="#fbbf24">
            <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>
        <g className="ppa-orbit-rev">
          <circle cx="-86" cy="0" r="2.5" fill="#c4b5fd" />
        </g>
      </svg>
    </div>
  );
}

/* ============================================================
   Hero card — greeting + money summary
============================================================ */
export function PlosHeroCard({
  greeting,
  firstName,
  dateLine,
  openItems,
  overdueCount,
  totalDueMoney,
}: {
  greeting: string;
  firstName: string;
  dateLine: string;
  openItems: number;
  overdueCount: number;
  totalDueMoney: number;
}) {
  return (
    <div className="plos-hero-card">
      <PlosPearlScene />
      <div className="plos-hero-row">
        <div>
          <div className="plos-page-eyebrow" style={{ marginBottom: 4 }}>{dateLine}</div>
          <h1 className="plos-hero-greeting">
            {greeting}, <em className="plos-greet-name">{firstName}</em>.
          </h1>
          <div className="plos-hero-meta">
            You&apos;re holding{' '}
            <strong style={{ color: 'var(--plos-ink-1)' }}>{openItems}</strong> open things this week.
            {overdueCount > 0 && (
              <>
                {' '}
                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                  {overdueCount} slipped.
                </span>
              </>
            )}
          </div>
        </div>
        {totalDueMoney > 0 && (
          <div className="plos-hero-money">
            <small>Due before next Sunday</small>
            {fmtINR(totalDueMoney)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Responsibility row — used inside the three buckets
============================================================ */
function fmtShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

export function ResponsibilityRow({
  r,
  busy,
  onComplete,
}: {
  r: Responsibility;
  busy?: boolean;
  onComplete?: (id: number) => void;
}) {
  const done = r.state === 'COMPLETED' || Boolean(r.completedAt);
  const overdue = r.state === 'OVERDUE';

  return (
    <div className="resp">
      <button
        type="button"
        className={`resp-check ${done ? 'done' : ''}`}
        onClick={() => onComplete?.(r.id)}
        disabled={busy}
        aria-label="Mark complete"
      >
        {done && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        )}
      </button>
      <div className="resp-body">
        <div className={`resp-title ${done ? 'done' : ''}`}>{r.title}</div>
        <div className="resp-meta">
          <span className="pill">{r.category}</span>
          {r.person && <span>· {r.person.name}</span>}
          <span>· {done && r.completedAt ? `Done ${fmtShortDate(r.completedAt)}` : fmtShortDate(r.dueDate)}</span>
          {r.recurrence && r.recurrence !== 'NONE' && (
            <span style={{ fontFamily: 'var(--nis-font-mono)', fontSize: 11 }}>↻ {r.recurrence.toLowerCase()}</span>
          )}
        </div>
      </div>
      {r.amount != null && (
        <div className={`resp-amount ${overdue ? 'over' : ''}`}>{fmtINR(r.amount)}</div>
      )}
    </div>
  );
}

/* ============================================================
   Bucket card — Overdue / Due today / Upcoming
============================================================ */
export function BucketCard({
  variant,
  items,
  busyId,
  onComplete,
}: {
  variant: 'overdue' | 'due' | 'upcoming';
  items: Responsibility[];
  busyId?: number | null;
  onComplete?: (id: number) => void;
}) {
  const meta = {
    overdue:  { title: 'Overdue',       dotColor: '#ef4444',           empty: 'Nothing slipped. Lovely.' },
    due:      { title: 'Due today',     dotColor: '#f59e0b',           empty: 'Clear for today.' },
    upcoming: { title: 'Upcoming · 7d', dotColor: 'var(--plos-accent)', empty: 'Nothing queued this week.' },
  }[variant];

  return (
    <div className="glass bucket plos-tilt">
      <div className="bucket-head">
        <span
          className={`bucket-dot ${variant === 'overdue' ? 'streak-pulse' : ''}`}
          style={{
            background: meta.dotColor,
            boxShadow: variant === 'overdue' ? '0 0 12px #ef4444' : 'none',
          }}
        />
        <span className="bucket-title">{meta.title}</span>
        <span className="bucket-count">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--plos-ink-3)' }}>{meta.empty}</div>
      ) : (
        items.map((r) => (
          <ResponsibilityRow
            key={r.id}
            r={r}
            busy={busyId === r.id}
            onComplete={onComplete}
          />
        ))
      )}
    </div>
  );
}

/* ============================================================
   Diary feed
============================================================ */
function colorFor(toState: string, fromState?: string) {
  if (toState === 'COMPLETED') return '#10b981';
  if (toState === 'OVERDUE') return '#ef4444';
  if (fromState === 'COMPLETED') return '#f59e0b';
  return 'var(--plos-accent)';
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function DiaryFeed({ events }: { events: TodayEvent[] }) {
  if (!events.length) {
    return (
      <div style={{ fontSize: 13, color: 'var(--plos-ink-3)' }}>No activity yet today.</div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {events.slice(0, 8).map((e) => {
        const dotColor = colorFor(e.toState, e.fromState);
        const verb =
          e.toState === 'COMPLETED'
            ? 'You completed'
            : e.toState === 'OVERDUE'
            ? 'Moved to overdue:'
            : 'Updated';
        return (
          <div key={e.id} className="tl-event" style={{ padding: '6px 0' }}>
            <div className="tl-dot" style={{ background: dotColor }} />
            <div>
              <div className="tl-event-body">
                {verb} <strong>{e.responsibility.title}</strong>
              </div>
              <div className="tl-event-time">{fmtTime(e.occurredAt)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import type { Responsibility } from '../../types/dashboard';

export const fmtINR = (n: number) =>
  '₹ ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/**
 * Single-row layout for the "Open commitments" and "Recently completed" lists
 * inside category modules (Finance / Health). Ported from the prototype's
 * ResponsibilityRow.
 */
export function ResponsibilityRow({
  r,
  busy,
  onComplete,
}: {
  r: Responsibility;
  busy?: boolean;
  onComplete?: (id: number) => void;
}) {
  const stateLower = (r.state ?? '').toLowerCase();
  const isOverdue = stateLower === 'overdue';
  const isDone = Boolean(r.completedAt) || stateLower === 'completed';
  const accent =
    isDone ? '#10b981' : isOverdue ? '#ef4444' : 'var(--plos-accent)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        borderTop: '1px solid var(--plos-rule)',
      }}
    >
      <button
        type="button"
        className={`resp-check ${isDone ? 'done' : ''}`}
        disabled={isDone || busy || !onComplete}
        onClick={() => onComplete?.(r.id)}
        aria-label={isDone ? 'Completed' : 'Mark complete'}
        style={{ flex: 'none' }}
      >
        {isDone ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : null}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--plos-ink-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {r.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--plos-ink-3)', marginTop: 2 }}>
          {fmtDate(r.dueDate)}
          {r.person ? ` · ${r.person.name.split(' ')[0]}` : ''}
          {r.recurrence && r.recurrence !== 'none' ? ` · ${r.recurrence}` : ''}
        </div>
      </div>

      {r.amount != null && (
        <div className="num" style={{ fontSize: 14, fontWeight: 600, color: accent, flex: 'none' }}>
          {fmtINR(Number(r.amount))}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { responsibilityService } from '../services/responsibility.service';
import type { Responsibility, ResponsibilityState } from '../types/dashboard';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';
import { fmtDate, fmtINR } from '../components/plos/ResponsibilityRow';

type StateFilter = 'ALL' | ResponsibilityState;

const STATE_TABS: { value: StateFilter; label: string; color: string }[] = [
  { value: 'ALL',       label: 'All',      color: 'var(--plos-accent)' },
  { value: 'OVERDUE',   label: 'Overdue',  color: '#ef4444' },
  { value: 'DUE',       label: 'Due',      color: '#f59e0b' },
  { value: 'UPCOMING',  label: 'Upcoming', color: '#7c3aed' },
  { value: 'COMPLETED', label: 'Done',     color: '#10b981' },
];

const CATEGORY_OPTIONS = [
  { value: '',        label: 'All categories' },
  { value: 'finance', label: 'Finance'   },
  { value: 'health',  label: 'Health'    },
  { value: 'habit',   label: 'Habit'     },
  { value: 'family',  label: 'Family'    },
  { value: 'admin',   label: 'Admin'     },
];

const STATE_META: Record<ResponsibilityState, { color: string; label: string }> = {
  OVERDUE:   { color: '#ef4444', label: 'Overdue'  },
  DUE:       { color: '#f59e0b', label: 'Due'      },
  UPCOMING:  { color: '#7c3aed', label: 'Upcoming' },
  COMPLETED: { color: '#10b981', label: 'Done'     },
};

function Row({
  r,
  busy,
  onComplete,
  onEdit,
  onDelete,
}: {
  r: Responsibility;
  busy: boolean;
  onComplete: (id: number) => void;
  onEdit: (r: Responsibility) => void;
  onDelete: (id: number) => void;
}) {
  const state = (r.state ?? 'UPCOMING') as ResponsibilityState;
  const meta = STATE_META[state] ?? STATE_META.UPCOMING;
  const isDone = state === 'COMPLETED';

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
        disabled={isDone || busy}
        onClick={() => onComplete(r.id)}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            to={`/responsibilities/${r.id}`}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--plos-ink-1)',
              textDecoration: isDone ? 'line-through' : undefined,
              opacity: isDone ? 0.65 : 1,
            }}
          >
            {r.title}
          </Link>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: `${meta.color}1a`,
              color: meta.color,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {meta.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--plos-ink-3)', marginTop: 2 }}>
          {fmtDate(r.dueDate)}
          {' · '}
          <span style={{ textTransform: 'capitalize' }}>{r.category}</span>
          {r.person ? ` · ${r.person.name.split(' ')[0]}` : ''}
          {r.recurrence && r.recurrence !== 'none' ? ` · ${r.recurrence}` : ''}
        </div>
      </div>

      {r.amount != null && (
        <div className="num" style={{ fontSize: 13, fontWeight: 600, color: meta.color, flex: 'none' }}>
          {fmtINR(Number(r.amount))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onEdit(r)}
        style={{
          fontSize: 11,
          color: 'var(--plos-ink-3)',
          fontFamily: 'var(--nis-font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          flex: 'none',
        }}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(`Delete "${r.title}"?`)) onDelete(r.id);
        }}
        style={{
          fontSize: 11,
          color: '#ef4444',
          fontFamily: 'var(--nis-font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          flex: 'none',
          opacity: 0.7,
        }}
      >
        Delete
      </button>
    </div>
  );
}

export default function ResponsibilitiesPage() {
  const queryClient = useQueryClient();
  const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Responsibility | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data: rows = [], isLoading, isError, error } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 15_000,
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.markComplete(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
      notifications.show({ title: 'Done', message: 'Marked as complete.', color: 'teal' });
    },
    onError: () =>
      notifications.show({ title: 'Error', message: 'Failed to complete', color: 'red' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.deleteOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notifications.show({ title: 'Deleted', message: 'Responsibility removed.', color: 'violet' });
    },
    onError: () =>
      notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' }),
  });

  const counts = useMemo(() => {
    const out: Record<string, number> = { ALL: rows.length };
    for (const r of rows) {
      const s = r.state ?? 'UPCOMING';
      out[s] = (out[s] ?? 0) + 1;
    }
    return out;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (stateFilter !== 'ALL' && r.state !== stateFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      return true;
    });
  }, [rows, stateFilter, categoryFilter]);

  return (
    <div className="plos-page-enter">
      <CreateResponsibilityModal
        opened={createOpen || editing != null}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />

      <div className="plos-page-eyebrow">Overview</div>
      <div className="greeting-row">
        <div>
          <h1 className="plos-page-title">Your responsibilities</h1>
          <div className="plos-page-sub">
            {counts.ALL === 0
              ? 'Create your first responsibility to get started.'
              : `${counts.ALL} total · ${counts.OVERDUE ?? 0} overdue · ${counts.DUE ?? 0} due · ${counts.UPCOMING ?? 0} upcoming · ${counts.COMPLETED ?? 0} done`}
          </div>
        </div>
        <button type="button" className="plos-cta" onClick={() => setCreateOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          <span>Add new</span>
        </button>
      </div>

      <div className="glass" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div
          className="row-between"
          style={{ flexWrap: 'wrap', gap: 12, alignItems: 'center' }}
        >
          <div className="tabs">
            {STATE_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`tab ${stateFilter === t.value ? 'active' : ''}`}
                onClick={() => setStateFilter(t.value)}
              >
                {t.label}
                {(counts[t.value] ?? 0) > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontFamily: 'var(--nis-font-mono)',
                      fontSize: 10,
                      opacity: 0.7,
                    }}
                  >
                    {counts[t.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ maxWidth: 200, width: 'auto' }}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass" style={{ padding: '8px 22px' }}>
        {isLoading ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <Loader color="violet" size="sm" type="dots" />
          </div>
        ) : isError ? (
          <div style={{ padding: 20, color: '#ef4444', fontSize: 14 }}>
            Failed to load responsibilities.{error instanceof Error && error.message ? ` ${error.message}` : ''}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--plos-ink-1)', marginBottom: 6 }}>
              {stateFilter === 'ALL' && !categoryFilter
                ? 'No responsibilities yet'
                : 'No matches for this filter'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--plos-ink-3)', marginBottom: 16 }}>
              {stateFilter === 'ALL' && !categoryFilter
                ? 'Add your first responsibility to start tracking your life.'
                : 'Try a different filter or add a new responsibility.'}
            </div>
            {stateFilter === 'ALL' && !categoryFilter && (
              <button type="button" className="plos-cta" onClick={() => setCreateOpen(true)}>
                <span>Create your first</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((r) => (
            <Row
              key={r.id}
              r={r}
              busy={busyId === r.id}
              onComplete={(id) => completeMutation.mutate(id)}
              onEdit={(row) => setEditing(row)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

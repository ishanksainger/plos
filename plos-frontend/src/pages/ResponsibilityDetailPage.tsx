import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Badge, Card } from '@nis/ui';
import { responsibilityService } from '../services/responsibility.service';
import type { ResponsibilityState } from '../types/dashboard';
import { PlosModuleHero } from '../components/plos/PlosModuleHero';
import { PlosReveal } from '../components/plos/PlosReveal';
import {
  TimelineScene,
  FinanceScene,
  HealthScene,
  HabitsScene,
  PeopleScene,
  InsightsScene,
} from '../components/plos/ModuleScenes';
import { fmtINR, fmtDate } from '../components/plos/ResponsibilityRow';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';

const STATE_META: Record<
  ResponsibilityState,
  { tone: 'warning' | 'danger' | 'accent' | 'success'; label: string; color: string }
> = {
  UPCOMING:  { tone: 'accent',  label: 'Upcoming', color: '#7c3aed' },
  DUE:       { tone: 'warning', label: 'Due',      color: '#f59e0b' },
  OVERDUE:   { tone: 'danger',  label: 'Overdue',  color: '#ef4444' },
  COMPLETED: { tone: 'success', label: 'Done',     color: '#10b981' },
};

const CATEGORY_SCENE: Record<string, React.ComponentType> = {
  finance: FinanceScene,
  health: HealthScene,
  habit: HabitsScene,
  family: PeopleScene,
  admin: TimelineScene,
};

const CATEGORY_ACCENT: Record<string, string> = {
  finance: '#f59e0b',
  health: '#ec4899',
  habit: '#7c3aed',
  family: '#22d3ee',
  admin: '#94a3b8',
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function ResponsibilityDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const id = Number(idParam);
  const isValidId = Number.isFinite(id) && id > 0;

  const [editOpen, setEditOpen] = useState(false);

  const {
    data: r,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['responsibility', id],
    queryFn: () => responsibilityService.getById(id),
    enabled: isValidId,
    staleTime: 15_000,
  });

  const { data: timeline = [], isFetching: timelineLoading } = useQuery({
    queryKey: ['responsibility', id, 'timeline'],
    queryFn: () => responsibilityService.getTimeline(id),
    enabled: isValidId,
    staleTime: 10_000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['responsibility', id] });
    queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const completeMutation = useMutation({
    mutationFn: () => responsibilityService.markComplete(id),
    onSuccess: () => {
      invalidateAll();
      notifications.show({ title: 'Done', message: 'Marked complete.', color: 'teal' });
    },
    onError: () =>
      notifications.show({ title: 'Error', message: 'Could not mark complete.', color: 'red' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => responsibilityService.deleteOne(id),
    onSuccess: () => {
      invalidateAll();
      notifications.show({ title: 'Removed', message: 'Responsibility deleted.', color: 'teal' });
      navigate('/responsibilities');
    },
    onError: () =>
      notifications.show({ title: 'Error', message: 'Could not delete.', color: 'red' }),
  });

  if (!isValidId) {
    return (
      <div className="plos-page-enter">
        <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            Responsibility not found
          </div>
          <Link to="/responsibilities" className="plos-back">← Back to responsibilities</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="plos-page-enter">
        <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}>
          <Loader color="violet" size="sm" type="dots" />
        </div>
      </div>
    );
  }

  if (isError || !r) {
    return (
      <div className="plos-page-enter">
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>
            Couldn&rsquo;t load this responsibility.
            {error instanceof Error && error.message ? ` ${error.message}` : ''}
          </div>
          <Link to="/responsibilities" className="plos-back">← Back to responsibilities</Link>
        </div>
      </div>
    );
  }

  const state = (r.state ?? 'UPCOMING') as ResponsibilityState;
  const meta = STATE_META[state] ?? STATE_META.UPCOMING;
  const Scene = CATEGORY_SCENE[r.category] ?? InsightsScene;
  const accent = CATEGORY_ACCENT[r.category] ?? '#7c3aed';
  const isDone = state === 'COMPLETED';

  const heroSub = (
    <>
      Due {fmtDate(r.dueDate)}
      {r.amount != null ? ` · ${fmtINR(Number(r.amount))}` : ''}
      {r.recurrence && r.recurrence !== 'none' ? ` · ${r.recurrence}` : ''}
      {r.person?.name ? ` · ${r.person.name.split(' ')[0]}` : ''}
    </>
  );

  return (
    <div className="plos-page-enter">
      <CreateResponsibilityModal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        editing={r}
      />

      <div style={{ marginBottom: 12 }}>
        <Link
          to="/responsibilities"
          className="plos-back"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="12" height="12" viewBox="0 0 14 10" fill="none">
            <path
              d="M13 5H1m0 0l4-4M1 5l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Back to responsibilities
        </Link>
      </div>

      <PlosModuleHero
        eyebrow={`Responsibility · ${r.category}`}
        title={`<em>${escapeHtml(r.title.split(' ').slice(0, 1).join(' '))}</em> ${escapeHtml(r.title.split(' ').slice(1).join(' '))}`.trim()}
        sub={heroSub}
        scene={Scene}
        accent={accent}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!isDone && (
              <button
                type="button"
                className="plos-cta"
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>Mark complete</span>
              </button>
            )}
            <button
              type="button"
              className="plos-icon-btn"
              onClick={() => setEditOpen(true)}
              style={{ padding: '8px 14px', fontSize: 12 }}
            >
              Edit
            </button>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          gap: 22,
          marginBottom: 22,
        }}
      >
        <PlosReveal delay={0}>
          <Card variant="glass" padding="lg">
            <div className="plos-page-eyebrow" style={{ marginBottom: 10 }}>
              At a glance
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DetailRow label="State">
                <Badge tone={meta.tone} size="md" dot>
                  {meta.label}
                </Badge>
              </DetailRow>
              <DetailRow label="Category">{r.category}</DetailRow>
              {r.module && <DetailRow label="Module">{r.module}</DetailRow>}
              <DetailRow label="Due">{fmtDate(r.dueDate)}</DetailRow>
              {r.amount != null && (
                <DetailRow label="Amount">{fmtINR(Number(r.amount))}</DetailRow>
              )}
              {r.recurrence && r.recurrence !== 'none' && (
                <DetailRow label="Recurs">{r.recurrence}</DetailRow>
              )}
              {r.person && (
                <DetailRow label="Person">
                  <Link to={`/people/${r.person.id}`} className="plos-back">
                    {r.person.name}
                  </Link>
                </DetailRow>
              )}
              {r.completedAt && (
                <DetailRow label="Completed">{fmtDateTime(r.completedAt)}</DetailRow>
              )}
            </div>

            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: '1px solid var(--plos-rule)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this responsibility? This cannot be undone.')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  fontSize: 11,
                  color: '#ef4444',
                  fontFamily: 'var(--nis-font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: deleteMutation.isPending ? 'wait' : 'pointer',
                }}
              >
                Delete responsibility
              </button>
            </div>
          </Card>
        </PlosReveal>

        <PlosReveal delay={1}>
          <Card variant="glass" padding="lg">
            <div className="chart-title" style={{ marginBottom: 12 }}>Notes</div>
            {r.notes ? (
              <p
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--plos-ink-1)',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {r.notes}
              </p>
            ) : (
              <p style={{ margin: 0, color: 'var(--plos-ink-3)', fontSize: 13 }}>
                No notes yet. Hit Edit to add one.
              </p>
            )}
          </Card>
        </PlosReveal>
      </div>

      <Card variant="glass" padding="lg">
        <div className="chart-title" style={{ marginBottom: 12 }}>Timeline</div>
        {timelineLoading && timeline.length === 0 ? (
          <div style={{ padding: 16 }}>
            <Loader color="violet" size="xs" type="dots" />
          </div>
        ) : timeline.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--plos-ink-3)', fontSize: 13 }}>
            No state changes recorded yet. The scheduler logs every transition
            here automatically.
          </p>
        ) : (
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {timeline.map((ev, i) => (
              <li
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--plos-rule)',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--plos-ink-3)',
                    fontFamily: 'var(--nis-font-mono)',
                    minWidth: 60,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--plos-ink-1)', fontWeight: 500 }}>
                    {ev.fromState} → <strong>{ev.toState}</strong>
                  </div>
                  {ev.note && (
                    <div style={{ fontSize: 12, color: 'var(--plos-ink-3)', marginTop: 2 }}>
                      {ev.note}
                    </div>
                  )}
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--plos-ink-3)',
                    fontFamily: 'var(--nis-font-mono)',
                  }}
                >
                  {fmtDateTime(ev.occurredAt)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        borderTop: '1px solid var(--plos-rule)',
        paddingTop: 8,
        fontSize: 13,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--nis-font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--plos-ink-3)',
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--plos-ink-1)', fontWeight: 500, textAlign: 'right' }}>
        {children}
      </span>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

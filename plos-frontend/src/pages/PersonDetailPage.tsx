import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Badge, Card } from '@nis/ui';
import { personService } from '../services/person.service';
import { responsibilityService } from '../services/responsibility.service';
import { PlosModuleHero } from '../components/plos/PlosModuleHero';
import { PlosReveal } from '../components/plos/PlosReveal';
import { PeopleScene } from '../components/plos/ModuleScenes';
import { ResponsibilityRow, fmtINR, fmtDate } from '../components/plos/ResponsibilityRow';
import { resolveMediaUrl } from '../utils/mediaUrl';

const RELATION_TONE: Record<string, [string, string]> = {
  self:    ['#fde68a', '#f0abfc'],
  father:  ['#fcd34d', '#fb923c'],
  mother:  ['#bbf7d0', '#86efac'],
  partner: ['#a5f3fc', '#818cf8'],
  child:   ['#fecaca', '#f9a8d4'],
  sibling: ['#ddd6fe', '#c4b5fd'],
  other:   ['#e5e7eb', '#cbd5e1'],
};

const initials = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

type Filter = 'all' | 'overdue' | 'recurring';

export default function PersonDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const personId = Number(idParam);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  const isValidId = Number.isFinite(personId) && personId > 0;

  const {
    data: person,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => personService.getById(personId),
    enabled: isValidId,
    staleTime: 15_000,
  });

  const completeMutation = useMutation({
    mutationFn: (rid: number) => responsibilityService.markComplete(rid),
    onMutate: (rid) => setBusyId(rid),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      notifications.show({ title: 'Done', message: 'Marked complete.', color: 'teal' });
    },
    onError: () =>
      notifications.show({ title: 'Error', message: 'Could not mark complete.', color: 'red' }),
  });

  const deletePersonMutation = useMutation({
    mutationFn: () => personService.deleteOne(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notifications.show({ title: 'Removed', message: 'Person removed.', color: 'teal' });
      navigate('/people');
    },
    onError: (err: Error) =>
      notifications.show({
        title: 'Error',
        message: err.message || 'Cannot delete (active tasks?)',
        color: 'red',
      }),
  });

  const responsibilities = person?.responsibilities ?? [];

  const { open, completed, overdueCount, totalOpenAmount, nextItem } = useMemo(() => {
    const open = responsibilities.filter((r) => !r.completedAt);
    const completed = responsibilities.filter((r) => Boolean(r.completedAt));
    const overdueCount = open.filter((r) => r.state === 'OVERDUE').length;
    const totalOpenAmount = open.reduce(
      (s, r) => s + (r.amount ? Number(r.amount) : 0),
      0,
    );
    const nextItem = open
      .slice()
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    return { open, completed, overdueCount, totalOpenAmount, nextItem };
  }, [responsibilities]);

  const visibleOpen = useMemo(() => {
    if (filter === 'overdue') return open.filter((r) => r.state === 'OVERDUE');
    if (filter === 'recurring')
      return open.filter((r) => r.recurrence && r.recurrence !== 'none');
    return open;
  }, [open, filter]);

  if (!isValidId) {
    return (
      <div className="plos-page-enter">
        <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            Person not found
          </div>
          <Link to="/people" className="plos-back">← Back to circle</Link>
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

  if (isError || !person) {
    return (
      <div className="plos-page-enter">
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>
            Couldn't load this person.
            {error instanceof Error && error.message ? ` ${error.message}` : ''}
          </div>
          <Link to="/people" className="plos-back">← Back to circle</Link>
        </div>
      </div>
    );
  }

  const tone = RELATION_TONE[person.relation] ?? RELATION_TONE.other;
  const avatar = resolveMediaUrl(person.avatarUrl);
  const isSelf = person.relation === 'self';

  const heroSub = (
    <>
      {open.length} open
      {overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
      {totalOpenAmount > 0 ? ` · ${fmtINR(totalOpenAmount)} on the table` : ''}
      {completed.length > 0 ? ` · ${completed.length} done` : ''}
    </>
  );

  return (
    <div className="plos-page-enter">
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/people"
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
          Back to circle
        </Link>
      </div>

      <PlosModuleHero
        eyebrow="Life · Person"
        title={`<em>${person.name.split(' ')[0]}</em>'s responsibilities.`}
        sub={heroSub}
        scene={PeopleScene}
        accent="#22d3ee"
      />

      <div
        className="grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          gap: 22,
          marginBottom: 22,
        }}
      >
        <PlosReveal delay={0}>
          <Card variant="glass" padding="lg" className="plos-tilt">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                textAlign: 'center',
              }}
            >
              <div
                className="person-avatar"
                style={{
                  width: 96,
                  height: 96,
                  fontSize: 28,
                  background: avatar
                    ? `center/cover no-repeat url(${avatar})`
                    : `linear-gradient(135deg, ${tone[0]}, ${tone[1]})`,
                }}
              >
                {avatar ? '' : initials(person.name)}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--nis-font-serif)',
                    fontSize: 22,
                    fontWeight: 400,
                    color: 'var(--plos-ink-1)',
                  }}
                >
                  {person.name}
                </div>
                <div style={{ marginTop: 6 }}>
                  <Badge tone={isSelf ? 'accent' : 'neutral'} size="sm">
                    {person.relation}
                  </Badge>
                </div>
              </div>

              <div
                style={{
                  width: '100%',
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--plos-ink-2)',
                }}
              >
                <ContactLine label="Email" value={person.email} />
                {person.phone && <ContactLine label="Phone" value={person.phone} />}
                {person.dateOfBirth && (
                  <ContactLine label="Born" value={fmtDate(person.dateOfBirth)} />
                )}
              </div>

              {!isSelf && (
                <button
                  type="button"
                  className="plos-icon-btn"
                  onClick={() => {
                    if (open.length > 0) {
                      notifications.show({
                        title: 'Has open items',
                        message: 'Resolve their open responsibilities first.',
                        color: 'orange',
                      });
                      return;
                    }
                    if (window.confirm(`Remove ${person.name} from your circle?`)) {
                      deletePersonMutation.mutate();
                    }
                  }}
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    padding: '6px 12px',
                    fontFamily: 'var(--nis-font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--plos-ink-3)',
                  }}
                  disabled={deletePersonMutation.isPending}
                >
                  Remove from circle
                </button>
              )}
            </div>
          </Card>
        </PlosReveal>

        <PlosReveal delay={1}>
          <Card variant="glass" padding="lg">
            <div className="chart-title" style={{ marginBottom: 14 }}>
              At a glance
            </div>
            <div
              className="kpi-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 14,
                marginBottom: nextItem ? 18 : 0,
              }}
            >
              <PersonKpi label="Open" value={open.length} />
              <PersonKpi
                label="Overdue"
                value={overdueCount}
                color={overdueCount > 0 ? '#ef4444' : undefined}
              />
              <PersonKpi
                label="Done"
                value={completed.length}
                color={completed.length > 0 ? '#10b981' : undefined}
              />
              <PersonKpi
                label="On the table"
                value={totalOpenAmount > 0 ? fmtINR(totalOpenAmount) : '—'}
              />
            </div>

            {nextItem && (
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 16,
                  borderTop: '1px solid var(--plos-rule)',
                }}
              >
                <div
                  className="plos-page-eyebrow"
                  style={{ marginBottom: 6 }}
                >
                  Next up
                </div>
                <div style={{ fontSize: 14, color: 'var(--plos-ink-1)', fontWeight: 600 }}>
                  {nextItem.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--plos-ink-3)', marginTop: 2 }}>
                  {fmtDate(nextItem.dueDate)}
                  {nextItem.category ? ` · ${nextItem.category}` : ''}
                  {nextItem.recurrence && nextItem.recurrence !== 'none'
                    ? ` · ${nextItem.recurrence}`
                    : ''}
                </div>
              </div>
            )}
          </Card>
        </PlosReveal>
      </div>

      <Card variant="glass" padding="lg" style={{ marginBottom: 22 }}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <div className="chart-title">Open commitments</div>
          <div className="tabs">
            <button
              type="button"
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`tab ${filter === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilter('overdue')}
            >
              Overdue
            </button>
            <button
              type="button"
              className={`tab ${filter === 'recurring' ? 'active' : ''}`}
              onClick={() => setFilter('recurring')}
            >
              Recurring
            </button>
          </div>
        </div>
        {visibleOpen.length === 0 ? (
          <div style={{ color: 'var(--plos-ink-3)', fontSize: 13 }}>
            {open.length === 0
              ? 'Nothing open. Lovely.'
              : 'No items match this filter.'}
          </div>
        ) : (
          visibleOpen.map((r) => (
            <ResponsibilityRow
              key={r.id}
              r={r}
              busy={busyId === r.id}
              onComplete={(rid) => completeMutation.mutate(rid)}
            />
          ))
        )}
      </Card>

      <Card variant="glass" padding="lg">
        <div className="chart-title" style={{ marginBottom: 10 }}>
          Recently completed
        </div>
        {completed.length === 0 ? (
          <div style={{ color: 'var(--plos-ink-3)', fontSize: 13 }}>
            Completed items show up here.
          </div>
        ) : (
          completed
            .slice()
            .sort(
              (a, b) =>
                new Date(b.completedAt ?? 0).getTime() -
                new Date(a.completedAt ?? 0).getTime(),
            )
            .slice(0, 12)
            .map((r) => <ResponsibilityRow key={r.id} r={r} />)
        )}
      </Card>
    </div>
  );
}

function ContactLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        borderTop: '1px solid var(--plos-rule)',
        paddingTop: 8,
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
      <span
        style={{
          color: 'var(--plos-ink-1)',
          fontWeight: 500,
          textAlign: 'right',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PersonKpi({
  label,
  value,
  color,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Loader } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { responsibilityService } from '../../services/responsibility.service';
import type { Responsibility } from '../../types/dashboard';
import { PlosModuleHero } from './PlosModuleHero';
import { PlosReveal } from './PlosReveal';
import { ResponsibilityRow, fmtINR } from './ResponsibilityRow';

export type CategoryKpi = {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  /** Colour applied to the big value. */
  color?: string;
  /** Optional 'up' / 'down' tone on the delta line. */
  deltaTone?: 'up' | 'down';
};

type Filter = 'all' | 'overdue' | 'recurring';

/**
 * Shared shell for Finance & Health module pages.
 * Owns: data fetch, complete mutation, list filter tab.
 * Each consumer supplies its own scene, KPIs, eyebrow, and headline.
 */
export function PlosCategoryModule({
  category,
  eyebrow,
  title,
  accent,
  scene,
  kpis,
  ctaLabel,
  onAddClick,
}: {
  category: string;
  eyebrow: string;
  title: string;
  accent: string;
  scene: ComponentType;
  kpis: (rows: Responsibility[]) => CategoryKpi[];
  ctaLabel: string;
  onAddClick?: () => void;
}) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 15_000,
  });

  const items = useMemo(() => rows.filter((r) => r.category === category), [rows, category]);
  const open = items.filter((r) => !r.completedAt);
  const done = items.filter((r) => r.completedAt);
  const overdueCount = items.filter((r) => r.state === 'OVERDUE').length;
  const totalOpen = open.reduce((s, r) => s + (r.amount ? Number(r.amount) : 0), 0);

  const visibleOpen = useMemo(() => {
    if (filter === 'overdue') return open.filter((r) => r.state === 'OVERDUE');
    if (filter === 'recurring') return open.filter((r) => r.recurrence && r.recurrence !== 'none');
    return open;
  }, [open, filter]);

  const completeMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.markComplete(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      notifications.show({ title: 'Done', message: 'Marked complete.', color: 'teal' });
    },
    onError: () =>
      notifications.show({ title: 'Error', message: 'Could not mark complete.', color: 'red' }),
  });

  const kpiList = kpis(items);

  return (
    <div className="plos-page-enter">
      <PlosModuleHero
        eyebrow={eyebrow}
        title={title}
        sub={`${open.length} open · ${overdueCount} overdue${
          totalOpen > 0 ? ` · ${fmtINR(totalOpen)} on the table` : ''
        }`}
        scene={scene}
        accent={accent}
        actions={
          onAddClick ? (
            <button type="button" className="plos-cta" onClick={onAddClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" /><path d="M5 12h14" />
              </svg>
              <span>{ctaLabel}</span>
            </button>
          ) : null
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        {kpiList.map((k, i) => (
          <PlosReveal key={k.label} delay={i + 1}>
            <div className="glass kpi plos-tilt">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={k.color ? { color: k.color } : undefined}>
                {k.value}
              </div>
              {k.delta != null && (
                <div className={`kpi-delta${k.deltaTone ? ` ${k.deltaTone}` : ''}`}>{k.delta}</div>
              )}
            </div>
          </PlosReveal>
        ))}
      </div>

      <div className="glass" style={{ padding: '20px 22px', marginBottom: 22 }}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <div className="chart-title">Open commitments</div>
          <div className="tabs">
            <button type="button" className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All
            </button>
            <button type="button" className={`tab ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')}>
              Overdue
            </button>
            <button type="button" className={`tab ${filter === 'recurring' ? 'active' : ''}`} onClick={() => setFilter('recurring')}>
              Recurring
            </button>
          </div>
        </div>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
            <Loader color="violet" size="sm" type="dots" />
          </div>
        ) : visibleOpen.length === 0 ? (
          <div style={{ color: 'var(--plos-ink-3)', fontSize: 13 }}>Nothing open here. Take a breath.</div>
        ) : (
          visibleOpen.map((r) => (
            <ResponsibilityRow
              key={r.id}
              r={r}
              busy={busyId === r.id}
              onComplete={(id) => completeMutation.mutate(id)}
            />
          ))
        )}
      </div>

      <div className="glass" style={{ padding: '20px 22px' }}>
        <div className="chart-title" style={{ marginBottom: 10 }}>Recently completed</div>
        {done.length === 0 ? (
          <div style={{ color: 'var(--plos-ink-3)', fontSize: 13 }}>
            Recently completed items show up here.
          </div>
        ) : (
          done.slice(0, 12).map((r) => <ResponsibilityRow key={r.id} r={r} />)
        )}
      </div>
    </div>
  );
}

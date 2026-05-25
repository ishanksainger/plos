import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { SkeletonCard, SkeletonBlock } from '../components/plos/PlosSkeleton';
import { PlosErrorRetry } from '../components/plos/PlosErrorRetry';
import { notifications } from '@mantine/notifications';
import { responsibilityService } from '../services/responsibility.service';
import type { Responsibility } from '../types/dashboard';
import { PlosModuleHero } from '../components/plos/PlosModuleHero';
import { PlosReveal } from '../components/plos/PlosReveal';
import { HabitsScene } from '../components/plos/ModuleScenes';
import { PlosStreakChain } from '../components/habits/PlosStreakChain';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';

const HABIT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#22d3ee', '#fb7185'];

const HISTORY_DAYS = 42;

/**
 * Convert backend history (per-day { completed }) into the chain pattern
 * the renderer expects: 1 = completed, 0 = missed, -1 = today open.
 */
function patternFromHistory(
  items: { date: string; completed: boolean }[],
  todayDone: boolean,
): number[] {
  if (items.length === 0) return [];
  const out: number[] = items.map((d) => (d.completed ? 1 : 0));
  out[out.length - 1] = todayDone ? 1 : -1;
  return out;
}

const isCompletedToday = (iso: string | null): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: rows = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 15_000,
  });

  const streaksQuery = useQuery({
    queryKey: ['habits', 'streaks'],
    queryFn: () => responsibilityService.getHabitStreaks(),
    staleTime: 30_000,
  });

  const habits = useMemo<Responsibility[]>(
    () => rows.filter((r) => r.category === 'habit'),
    [rows],
  );

  const streakById = useMemo(() => {
    const map: Record<number, number> = {};
    streaksQuery.data?.items?.forEach((i) => { map[i.id] = i.streak; });
    return map;
  }, [streaksQuery.data]);

  // Fan out: one query per habit pulling the real 42-day completion history.
  const historyQueries = useQueries({
    queries: habits.map((h) => ({
      queryKey: ['habits', h.id, 'history', HISTORY_DAYS],
      queryFn: () => responsibilityService.getHabitHistory(h.id, HISTORY_DAYS),
      staleTime: 60_000,
    })),
  });

  const historyById = useMemo(() => {
    const map: Record<number, { date: string; completed: boolean }[]> = {};
    habits.forEach((h, idx) => {
      const data = historyQueries[idx]?.data;
      if (data) map[h.id] = data.items;
    });
    return map;
  }, [habits, historyQueries]);

  const completeMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.markComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notifications.show({ title: 'Done', message: 'Marked today complete.', color: 'teal' });
    },
    onError: () =>
      notifications.show({ title: 'Error', message: 'Could not mark complete.', color: 'red' }),
  });

  const activeHabits = habits.filter((h) => h.recurrence && h.recurrence !== 'none' && !h.completedAt).length;
  const maxStreak = streaksQuery.data?.maxStreak ?? Math.max(0, ...Object.values(streakById));
  const completions7d = streaksQuery.data?.completionsLast7Days ?? 0;
  const atRisk = Object.values(streakById).filter((s) => s > 0 && s <= 3).length;

  return (
    <div className="plos-page-enter">
      <CreateResponsibilityModal opened={createOpen} onClose={() => setCreateOpen(false)} />

      <PlosModuleHero
        eyebrow="Module · signature"
        title="Habits as <em>rhythm</em>."
        sub="A flowing chain for each habit. Filled links are days you showed up; open rings are days you didn't."
        scene={HabitsScene}
        accent="#a78bfa"
        actions={
          <button type="button" className="plos-cta" onClick={() => setCreateOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            <span>Add habit</span>
          </button>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <PlosReveal delay={1}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">Active habits</div>
            <div className="kpi-value">{activeHabits}</div>
            <div className="kpi-delta">Recurring routines</div>
          </div>
        </PlosReveal>
        <PlosReveal delay={2}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">Longest streak</div>
            <div className="kpi-value num">{maxStreak}</div>
            <div className="kpi-delta">Days in a row</div>
          </div>
        </PlosReveal>
        <PlosReveal delay={3}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">7-day check-ins</div>
            <div className="kpi-value">{completions7d}</div>
            <div className="kpi-delta up">Across all habits</div>
          </div>
        </PlosReveal>
        <PlosReveal delay={4}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">At risk</div>
            <div className="kpi-value" style={{ color: atRisk > 0 ? '#f59e0b' : undefined }}>
              {atRisk}
            </div>
            <div className="kpi-delta">Streak ≤ 3 days</div>
          </div>
        </PlosReveal>
      </div>

      {isError ? (
        <PlosErrorRetry
          title="Failed to load habits."
          message={error instanceof Error && error.message ? error.message : undefined}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} height={150} padding={24}>
              <SkeletonBlock width="40%" height={14} />
              <SkeletonBlock width="100%" height={42} radius={10} style={{ marginTop: 18 }} />
            </SkeletonCard>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="glass" style={{ padding: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--plos-ink-1)', marginBottom: 6 }}>
            No habits yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--plos-ink-3)', marginBottom: 16 }}>
            Add a recurring habit to start tracking your streak chain.
          </div>
          <button type="button" className="plos-cta" onClick={() => setCreateOpen(true)}>
            <span>Add your first habit</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {habits.map((h, i) => {
            const color = HABIT_COLORS[i % HABIT_COLORS.length];
            const streak = streakById[h.id] ?? 0;
            const doneToday = isCompletedToday(h.completedAt);
            const history = historyById[h.id];
            const pattern = history
              ? patternFromHistory(history, doneToday)
              : Array.from({ length: HISTORY_DAYS }, () => 0); // skeleton while loading
            return (
              <PlosReveal key={h.id} delay={i % 3}>
                <div className="glass streak-card plos-tilt">
                  <div className="streak-head">
                    <div>
                      <div className="streak-name" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 50, background: color, boxShadow: `0 0 12px ${color}` }} />
                        {h.title}
                      </div>
                      <div className="streak-sub">
                        {h.recurrence && h.recurrence !== 'none' ? h.recurrence : 'no cadence'}
                        {h.person ? ` · for ${h.person.name.split(' ')[0]}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="streak-count">
                        <span>{streak}</span>
                        <span className="unit">days</span>
                      </div>
                      <div className="kpi-delta" style={{ marginTop: 4 }}>
                        {doneToday ? 'Done today' : 'Open today'}
                      </div>
                    </div>
                  </div>
                  <PlosStreakChain
                    habit={{ id: h.id, color, pattern }}
                    onToggleToday={
                      doneToday ? undefined : (id) => completeMutation.mutate(Number(id))
                    }
                  />
                </div>
              </PlosReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

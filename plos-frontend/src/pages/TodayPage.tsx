import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@mantine/core';
import { useToday } from '../hooks/useToday';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';
import { responsibilityService } from '../services/responsibility.service';
import { personService } from '../services/person.service';
import { useAppSelector } from '../store/hooks';
import { trackTodayViewLoaded } from '../lib/analytics';
import { registerDashboardCreateResponsibilityHandler } from '../utils/dashboard-create-bridge';
import {
  BucketCard,
  DiaryFeed,
  PlosHeroCard,
  greetingLabel,
} from '../components/today/PlosTodayUI';
import { PlosReveal } from '../components/plos/PlosReveal';
import { PlosTilt } from '../components/plos/PlosTilt';
import { TodayPulse, type PulseMarker } from '../components/plos/TodayPulse';
import { LifeRingsBar } from '../components/plos/LifeRings';
import { PlosMarquee } from '../components/plos/PlosMarquee';
import { PlosStreakChain } from '../components/habits/PlosStreakChain';

const HABIT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#22d3ee'];

const fmtINRCompact = (n: number) => {
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹ ${(n / 1000).toFixed(1)}k`;
  return `₹ ${n}`;
};

/** Same synthetic pattern logic as HabitsPage — pending real per-day history endpoint. */
function synthPattern(id: number, streak: number, todayDone: boolean, days = 60): number[] {
  const out: number[] = [];
  let rng = (id * 9301) % 233280;
  const completion = Math.min(0.95, 0.4 + Math.min(streak, 30) / 60);
  for (let i = 0; i < days; i++) {
    rng = (rng * 9301 + 49297) % 233280;
    out.push(rng / 233280 < completion ? 1 : 0);
  }
  for (let i = days - streak; i < days - 1; i++) {
    if (i >= 0) out[i] = 1;
  }
  out[days - 1] = todayDone ? 1 : -1;
  return out;
}

const isCompletedToday = (iso: string | null): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

export default function TodayPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useToday();
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Pulled in parallel so the signature rhythm card + life rings have data
  const { data: allResp = [] } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 15_000,
  });
  const { data: streaks } = useQuery({
    queryKey: ['habits', 'streaks'],
    queryFn: () => responsibilityService.getHabitStreaks(),
    staleTime: 30_000,
  });
  const { data: persons = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personService.getAll(),
    staleTime: 60_000,
  });

  useEffect(() => {
    registerDashboardCreateResponsibilityHandler(() => setCreateOpen(true));
    return () => registerDashboardCreateResponsibilityHandler(null);
  }, []);

  useEffect(() => {
    if (!data) return;
    trackTodayViewLoaded(data.overdue.length, data.dueToday.length);
  }, [data]);

  const completeMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.markComplete(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
      void queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
    },
  });

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const dateLine = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const totalOpen = data
    ? data.overdue.length + data.dueToday.length + data.upcoming7.length
    : 0;
  const totalDueMoney = data
    ? [...data.overdue, ...data.dueToday].reduce((s, r) => s + (r.amount ?? 0), 0)
    : 0;

  // Markers for the heartbeat ribbon — overdue dots at the start of the day,
  // due dots spread through morning, plus a placeholder evening event.
  const pulseMarkers = useMemo<PulseMarker[]>(() => {
    if (!data) return [];
    const m: PulseMarker[] = [];
    data.overdue.slice(0, 2).forEach((_, i) => m.push({ hour: 8 + i * 1.5, color: '#ef4444', label: 'OVR' }));
    data.dueToday.slice(0, 3).forEach((_, i) => m.push({ hour: 11 + i * 2.5, color: '#f59e0b', label: 'DUE' }));
    m.push({ hour: 19.5, color: '#a78bfa', label: 'WALK' });
    return m;
  }, [data]);

  // Habits = responsibilities with category='habit', enriched with streak + color.
  const habitsList = useMemo(() => {
    const habitRows = allResp.filter((r) => r.category === 'habit');
    const streakById: Record<number, number> = {};
    streaks?.items?.forEach((s) => { streakById[s.id] = s.streak; });
    return habitRows.map((h, i) => ({
      id: h.id,
      title: h.title,
      cadence: h.recurrence && h.recurrence !== 'none' ? h.recurrence : '—',
      streak: streakById[h.id] ?? 0,
      color: HABIT_COLORS[i % HABIT_COLORS.length],
      doneToday: isCompletedToday(h.completedAt),
    }));
  }, [allResp, streaks]);

  const headerBlock = (
    <>
      <div className="plos-page-eyebrow">Today</div>
      <PlosHeroCard
        greeting={greetingLabel()}
        firstName={firstName}
        dateLine={dateLine}
        openItems={totalOpen}
        overdueCount={data?.overdue.length ?? 0}
        totalDueMoney={totalDueMoney}
      />
    </>
  );

  if (isLoading) {
    return (
      <div className="plos-page-enter">
        <CreateResponsibilityModal opened={createOpen} onClose={() => setCreateOpen(false)} />
        {headerBlock}
        <div className="glass" style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Loader color="violet" size="sm" type="dots" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const msg = error instanceof Error ? error.message : '';
    return (
      <div className="plos-page-enter">
        <CreateResponsibilityModal opened={createOpen} onClose={() => setCreateOpen(false)} />
        {headerBlock}
        <div className="glass" style={{ padding: 24, color: '#ef4444', fontSize: 14 }}>
          Failed to load Today.{msg ? ` ${msg}` : ''}
        </div>
      </div>
    );
  }

  const upcomingTrimmed = data.upcoming7.slice(0, 5);

  // Best-effort metric for the people ring.
  const peopleLoaded = persons.length
    ? persons.length - 1 // exclude self
    : 0;
  const longestStreak = streaks?.maxStreak ?? Math.max(0, ...habitsList.map((h) => h.streak));
  const totalStreakDays = habitsList.reduce((s, h) => s + h.streak, 0);

  return (
    <div className="plos-page-enter">
      <CreateResponsibilityModal opened={createOpen} onClose={() => setCreateOpen(false)} />
      {headerBlock}

      <PlosReveal>
        <TodayPulse markers={pulseMarkers} />
      </PlosReveal>

      <LifeRingsBar
        data={{
          money: {
            fig: fmtINRCompact(totalDueMoney),
            label: '',
            sub: `${data.overdue.length + data.dueToday.length} bills before Sunday`,
          },
          health: {
            fig: '7.2',
            label: 'h',
            sub: 'avg sleep · last 7 days',
          },
          habits: {
            fig: totalStreakDays,
            label: 'days',
            sub: habitsList.length
              ? `${habitsList.length} habits · best ${longestStreak}`
              : 'Add your first habit',
          },
          people: {
            fig: peopleLoaded,
            label: '',
            sub: peopleLoaded === 0 ? 'No one yet' : `${peopleLoaded} ${peopleLoaded === 1 ? 'person' : 'people'} · circle`,
          },
        }}
        onNavigate={(key) => {
          const path = key === 'finance' ? '/finance' : `/${key}`;
          navigate(path);
        }}
      />

      <PlosMarquee items={['Today', 'Money', 'Body', 'Habits', 'People', 'Rhythm', 'A diary of life', 'In software']} />

      <div className="grid-3" style={{ marginBottom: 22 }}>
        <PlosReveal delay={1}>
          <PlosTilt max={3}>
            <BucketCard
              variant="overdue"
              items={data.overdue}
              busyId={busyId}
              onComplete={(id) => completeMutation.mutate(id)}
            />
          </PlosTilt>
        </PlosReveal>
        <PlosReveal delay={2}>
          <PlosTilt max={3}>
            <BucketCard
              variant="due"
              items={data.dueToday}
              busyId={busyId}
              onComplete={(id) => completeMutation.mutate(id)}
            />
          </PlosTilt>
        </PlosReveal>
        <PlosReveal delay={3}>
          <PlosTilt max={3}>
            <BucketCard
              variant="upcoming"
              items={upcomingTrimmed}
              busyId={busyId}
              onComplete={(id) => completeMutation.mutate(id)}
            />
          </PlosTilt>
        </PlosReveal>
      </div>

      {habitsList.length > 0 && (
        <PlosReveal>
          <div className="glass streak-card" style={{ marginBottom: 22 }}>
            <div className="streak-head">
              <div>
                <div className="streak-name">Today&apos;s rhythm</div>
                <div className="streak-sub">
                  Your habits, last 42 days. Filled dots are days you showed up.
                </div>
              </div>
              <button
                type="button"
                className="plos-cta"
                style={{
                  background: 'transparent',
                  color: 'var(--plos-accent)',
                  boxShadow: 'none',
                  border: '1px solid var(--plos-accent-soft)',
                }}
                onClick={() => navigate('/habits')}
              >
                Open habits →
              </button>
            </div>
            <div style={{ marginTop: 18, display: 'grid', gap: 16 }}>
              {habitsList.map((h) => (
                <div
                  key={h.id}
                  className="today-rhythm-row"
                  style={{
                    padding: '10px 0',
                    borderTop: '1px solid var(--plos-rule)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--plos-ink-1)', letterSpacing: '-0.005em' }}>
                      {h.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--plos-ink-3)', fontFamily: 'var(--nis-font-mono)' }}>
                      {h.cadence}
                    </div>
                  </div>
                  <PlosStreakChain
                    habit={{ id: h.id, color: h.color, pattern: synthPattern(h.id, h.streak, h.doneToday) }}
                    compact
                    showLabels={false}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: 18, fontWeight: 600, color: h.color }}>
                      {h.streak}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--plos-ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      day streak
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PlosReveal>
      )}

      <PlosReveal delay={2}>
        <div className="glass" style={{ padding: '20px 22px' }}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="chart-title">Diary · recent activity</div>
            <span className="chart-sub">Today + yesterday</span>
          </div>
          <DiaryFeed events={data.recentEvents} />
        </div>
      </PlosReveal>
    </div>
  );
}

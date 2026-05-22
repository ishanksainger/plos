import { Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/dashboard.service';
import { responsibilityService } from '../services/responsibility.service';
import { eventService } from '../services/event.service';
import { useAppSelector } from '../store/hooks';
import { PlosModuleHero } from '../components/plos/PlosModuleHero';
import { PlosReveal } from '../components/plos/PlosReveal';
import { InsightsScene } from '../components/plos/ModuleScenes';
import { AreaChart, Bars, DonutChart, CompletionRing, Sparkline } from '../components/plos/Charts';
import { fmtINR, fmtDate } from '../components/plos/ResponsibilityRow';

const CATEGORY_COLOR: Record<string, string> = {
  finance: '#7c3aed',
  health:  '#fb7185',
  habit:   '#3b82f6',
  family:  '#ec4899',
  admin:   '#22d3ee',
  other:   '#f59e0b',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (iso: string) => {
  const m = Number(iso.slice(5, 7));
  return Number.isFinite(m) ? MONTH_LABELS[m - 1] : iso;
};

const initialsFromName = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

const TONE_PALETTE: Array<[string, string]> = [
  ['#fde68a', '#f0abfc'],
  ['#a5f3fc', '#818cf8'],
  ['#fecaca', '#f9a8d4'],
  ['#bbf7d0', '#86efac'],
  ['#fcd34d', '#fb923c'],
  ['#ddd6fe', '#c4b5fd'],
];

/** Sparkline data per category — slice the 14-day activity series by category-ratio approximation. */
function deriveCategorySpark(seriesCounts: number[], share: number): number[] {
  return seriesCounts.map((c) => Math.max(0, Math.round(c * share)));
}

/**
 * Insights — analytics dashboard.
 * Pulls /users/dashboard plus side queries for upcoming bills + recent events
 * so the page has the density of the prototype's reference dashboards.
 */
export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', user?.id ?? 'anon'],
    queryFn: getDashboard,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  // Upcoming bills (finance items, sorted by due date) — used in the bills card.
  const { data: allResp = [] } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 30_000,
    enabled: Boolean(user?.id),
  });

  // Last few events feed for the bottom strip.
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getFeed(8),
    staleTime: 20_000,
    enabled: Boolean(user?.id),
  });

  const donutData = useMemo(() => {
    if (!data) return [];
    const total = data.categoryBreakdown.reduce((s, c) => s + c.count, 0) || 1;
    return data.categoryBreakdown.map((c) => ({
      name: c.category,
      color: CATEGORY_COLOR[c.category.toLowerCase()] ?? CATEGORY_COLOR.other,
      count: c.count,
      share: c.count / total,
    }));
  }, [data]);

  const areaData = useMemo(() => {
    if (!data) return [];
    return data.financialPressure.map((p) => ({ label: monthLabel(p.month), val: p.total }));
  }, [data]);

  const activityCounts = useMemo(
    () => (data ? data.activitySeries.slice(-14).map((p) => p.count) : []),
    [data],
  );

  const upcomingBills = useMemo(() => {
    return allResp
      .filter((r) => r.category === 'finance' && !r.completedAt && r.amount != null)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [allResp]);

  const hero = (
    <PlosModuleHero
      eyebrow="Insights · this week"
      title="Where life <em>sits</em>."
      sub="Analytics across responsibilities, money, and habits — a heartbeat across seven days."
      scene={InsightsScene}
      accent="#a78bfa"
      actions={
        <div className="tabs">
          <button type="button" className="tab active">7d</button>
          <button type="button" className="tab">30d</button>
          <button type="button" className="tab">90d</button>
          <button type="button" className="tab">YTD</button>
        </div>
      }
    />
  );

  if (!user?.id) {
    return (
      <div className="plos-page-enter">
        {hero}
        <div className="glass" style={{ padding: 24, color: 'var(--plos-ink-3)', fontSize: 14 }}>
          Sign in to load your dashboard.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="plos-page-enter">
        {hero}
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
        {hero}
        <div className="glass" style={{ padding: 24, color: '#ef4444', fontSize: 14 }}>
          Failed to load dashboard.{msg ? ` ${msg}` : ''}
        </div>
      </div>
    );
  }

  const { summary } = data;
  const open = summary.due + summary.overdue + summary.upcoming;
  const monthSpend = data.financialPressure.length
    ? data.financialPressure[data.financialPressure.length - 1].total
    : 0;
  const prevMonthSpend = data.financialPressure.length >= 2
    ? data.financialPressure[data.financialPressure.length - 2].total
    : 0;
  const monthDeltaPct = prevMonthSpend > 0
    ? Math.round(((monthSpend - prevMonthSpend) / prevMonthSpend) * 100)
    : 0;
  const monthSpendLabel = data.financialPressure.length
    ? monthLabel(data.financialPressure[data.financialPressure.length - 1].month)
    : '';

  const week7d = activityCounts.slice(-7).reduce((a, b) => a + b, 0);
  const prev7d = activityCounts.slice(-14, -7).reduce((a, b) => a + b, 0);
  const weekDelta = week7d - prev7d;

  const personLoadMax = Math.max(1, ...data.personLoad.map((p) => p.count));

  return (
    <div className="plos-page-enter">
      {hero}

      {/* ───── KPI strip with deltas ───── */}
      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <PlosReveal delay={1}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">Open commitments</div>
            <div className="kpi-value">{open}</div>
            <div className="kpi-delta">
              {summary.due} due · {summary.upcoming} upcoming
            </div>
          </div>
        </PlosReveal>
        <PlosReveal delay={2}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">Overdue</div>
            <div className="kpi-value" style={{ color: summary.overdue > 0 ? '#ef4444' : undefined }}>
              {summary.overdue}
            </div>
            <div className={`kpi-delta ${summary.overdue > 0 ? 'down' : 'up'}`}>
              {summary.overdue > 0 ? '↓ Needs attention' : '↑ All clear'}
            </div>
          </div>
        </PlosReveal>
        <PlosReveal delay={3}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">Money pressure</div>
            <div className="kpi-value num">{fmtINR(monthSpend)}</div>
            <div className={`kpi-delta ${monthDeltaPct > 0 ? 'down' : monthDeltaPct < 0 ? 'up' : ''}`}>
              {monthDeltaPct > 0 ? '↑' : monthDeltaPct < 0 ? '↓' : '·'}{' '}
              {monthDeltaPct === 0
                ? `Total · ${monthSpendLabel}`
                : `${Math.abs(monthDeltaPct)}% vs last month`}
            </div>
          </div>
        </PlosReveal>
        <PlosReveal delay={4}>
          <div className="glass kpi plos-tilt">
            <div className="kpi-label">Completion rate</div>
            <div className="kpi-value">
              {summary.completionRate}
              <span style={{ fontSize: 18, color: 'var(--plos-ink-3)' }}>%</span>
            </div>
            <div className="kpi-delta up">
              {summary.completed} of {summary.total} done
            </div>
          </div>
        </PlosReveal>
      </div>

      {/* ───── Monthly outflow | Category donut ───── */}
      <div className="grid-12" style={{ marginBottom: 22 }}>
        <PlosReveal delay={1}>
          <div className="glass chart-card">
            <div className="chart-title-row">
              <div>
                <div className="chart-title">Monthly outflow · ₹</div>
                <div className="chart-sub">Tracked commitments, last 6 months</div>
              </div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--plos-ink-1)' }}>
                {fmtINR(monthSpend)}
              </div>
            </div>
            {areaData.length >= 2 ? (
              <AreaChart data={areaData} height={180} />
            ) : (
              <div style={{ color: 'var(--plos-ink-3)', fontSize: 13, padding: '12px 0' }}>
                No outflow yet. Complete a finance item to start the trend.
              </div>
            )}
          </div>
        </PlosReveal>

        <PlosReveal delay={2}>
          <div className="glass chart-card">
            <div className="chart-title-row">
              <div>
                <div className="chart-title">By category</div>
                <div className="chart-sub">Open commitments</div>
              </div>
            </div>
            {donutData.length ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <DonutChart data={donutData} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {donutData.map((c) => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 50, background: c.color, flex: 'none' }} />
                      <span style={{ fontSize: 13, color: 'var(--plos-ink-2)', textTransform: 'capitalize', minWidth: 60 }}>
                        {c.name}
                      </span>
                      <Sparkline data={deriveCategorySpark(activityCounts, c.share)} color={c.color} />
                      <span className="num" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--plos-ink-3)' }}>
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--plos-ink-3)', fontSize: 13, padding: '12px 0' }}>
                No categories yet. Add a responsibility to see the breakdown.
              </div>
            )}
          </div>
        </PlosReveal>
      </div>

      {/* ───── 3-col: Completion ring | Upcoming bills | This week ───── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr 1fr',
          gap: 18,
          marginBottom: 22,
        }}
        className="insights-row-3"
      >
        <PlosReveal delay={1}>
          <div className="glass chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ alignSelf: 'flex-start' }}>
              <div className="chart-title">Completion</div>
              <div className="chart-sub">Across all responsibilities</div>
            </div>
            <CompletionRing value={summary.completionRate} gradientId="insights-completion" />
            <div style={{ fontSize: 12, color: 'var(--plos-ink-3)', textAlign: 'center' }}>
              <strong style={{ color: 'var(--plos-ink-1)' }}>{summary.completed}</strong> done ·{' '}
              <strong style={{ color: 'var(--plos-ink-1)' }}>{summary.total - summary.completed}</strong> open
            </div>
          </div>
        </PlosReveal>

        <PlosReveal delay={2}>
          <div className="glass chart-card">
            <div className="chart-title-row" style={{ marginBottom: 10 }}>
              <div>
                <div className="chart-title">Upcoming bills</div>
                <div className="chart-sub">Next 5, money due</div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/finance')}
                style={{
                  fontSize: 11,
                  color: 'var(--plos-accent)',
                  fontFamily: 'var(--nis-font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                View all →
              </button>
            </div>
            {upcomingBills.length === 0 ? (
              <div style={{ color: 'var(--plos-ink-3)', fontSize: 13, padding: '8px 0' }}>
                Nothing money-related coming up. Lovely.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {upcomingBills.map((b, i) => {
                  const days = Math.ceil((new Date(b.dueDate).getTime() - Date.now()) / 86_400_000);
                  const dayLabel = days <= 0 ? 'overdue' : days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days}d`;
                  const dayColor = days < 0 ? '#ef4444' : days <= 1 ? '#f59e0b' : 'var(--plos-ink-3)';
                  return (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderTop: i === 0 ? 'none' : '1px solid var(--plos-rule)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--plos-ink-1)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {b.title}
                        </div>
                        <div style={{ fontSize: 11, color: dayColor, fontFamily: 'var(--nis-font-mono)' }}>
                          {fmtDate(b.dueDate)} · {dayLabel}
                        </div>
                      </div>
                      <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--plos-ink-1)' }}>
                        {fmtINR(Number(b.amount))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PlosReveal>

        <PlosReveal delay={3}>
          <div className="glass chart-card">
            <div className="chart-title-row" style={{ marginBottom: 12 }}>
              <div>
                <div className="chart-title">This week</div>
                <div className="chart-sub">Snapshot</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="num" style={{ fontSize: 32, fontWeight: 600, color: 'var(--plos-ink-1)', lineHeight: 1, letterSpacing: '-0.025em' }}>
                  {week7d}
                </div>
                <div style={{ fontSize: 11, color: 'var(--plos-ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                  Completions · 7d
                </div>
                <div className={`kpi-delta ${weekDelta > 0 ? 'up' : weekDelta < 0 ? 'down' : ''}`} style={{ marginTop: 4 }}>
                  {weekDelta > 0 ? '↑' : weekDelta < 0 ? '↓' : '·'} {Math.abs(weekDelta)} vs prev 7d
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--plos-rule)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>
                    {summary.overdue}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--plos-ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Slipped
                  </div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600, color: '#f59e0b' }}>
                    {summary.due}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--plos-ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Due now
                  </div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600, color: 'var(--plos-accent)' }}>
                    {summary.upcoming}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--plos-ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Upcoming
                  </div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600, color: '#10b981' }}>
                    {summary.completed}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--plos-ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Done
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PlosReveal>
      </div>

      {/* ───── Activity bars | People load ───── */}
      <div className="grid-12" style={{ marginBottom: 22 }}>
        <PlosReveal delay={1}>
          <div className="glass chart-card">
            <div className="chart-title-row">
              <div>
                <div className="chart-title">Activity · 14 days</div>
                <div className="chart-sub">Completions per day</div>
              </div>
              <div className="num" style={{ fontSize: 18, fontWeight: 600, color: 'var(--plos-ink-1)' }}>
                {activityCounts.reduce((a, b) => a + b, 0)}
              </div>
            </div>
            {activityCounts.length ? (
              <>
                <Bars data={activityCounts} height={140} />
                <div className="streak-day-label" style={{ marginTop: 10 }}>
                  <span>14 days ago</span>
                  <span>today</span>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--plos-ink-3)', fontSize: 13, padding: '12px 0' }}>
                No completions yet. Mark something done to see your rhythm.
              </div>
            )}
          </div>
        </PlosReveal>

        <PlosReveal delay={2}>
          <div className="glass chart-card">
            <div className="chart-title-row">
              <div>
                <div className="chart-title">People load</div>
                <div className="chart-sub">Whose responsibilities you carry</div>
              </div>
            </div>
            {data.personLoad.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.personLoad.slice(0, 6).map((p, i) => {
                  const tone = TONE_PALETTE[i % TONE_PALETTE.length];
                  return (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        className="person-avatar"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          fontSize: 11,
                          background: `linear-gradient(135deg, ${tone[0]}, ${tone[1]})`,
                        }}
                      >
                        {initialsFromName(p.name)}
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--plos-ink-2)', flex: 1 }}>
                        {p.name.split(' ')[0]}
                      </span>
                      <div style={{ flex: 2, height: 6, background: 'var(--plos-rule)', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, (p.count / personLoadMax) * 100)}%`,
                            height: '100%',
                            background: 'var(--plos-accent)',
                          }}
                        />
                      </div>
                      <span className="num" style={{ fontSize: 12, color: 'var(--plos-ink-3)', width: 24, textAlign: 'right' }}>
                        {p.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--plos-ink-3)', fontSize: 13, padding: '12px 0' }}>
                No people tagged yet.
              </div>
            )}
          </div>
        </PlosReveal>
      </div>

      {/* ───── Recent activity feed ───── */}
      {events.length > 0 && (
        <PlosReveal>
          <div className="glass" style={{ padding: '20px 24px' }}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <div className="chart-title">Recent activity</div>
              <button
                type="button"
                onClick={() => navigate('/timeline')}
                style={{
                  fontSize: 11,
                  color: 'var(--plos-accent)',
                  fontFamily: 'var(--nis-font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Full timeline →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {events.slice(0, 6).map((e) => {
                const isCompleted = e.toState === 'COMPLETED';
                const isSystem = e.toState !== 'COMPLETED';
                const color = isCompleted
                  ? '#10b981'
                  : e.toState === 'OVERDUE'
                  ? '#ef4444'
                  : 'var(--plos-ink-4)';
                const verb = isCompleted
                  ? 'You completed'
                  : e.toState === 'OVERDUE'
                  ? 'Moved to overdue:'
                  : `Updated → ${e.toState.toLowerCase()}:`;
                return (
                  <div key={e.id} className="tl-event" style={{ padding: '6px 0' }}>
                    <div className="tl-dot" style={{ background: color }} />
                    <div>
                      <div className="tl-event-body">
                        {verb} <strong>{e.responsibility.title}</strong>
                        {e.responsibility.amount != null && (
                          <span className="num" style={{ marginLeft: 6, color: 'var(--plos-ink-2)' }}>
                            · {fmtINR(Number(e.responsibility.amount))}
                          </span>
                        )}
                      </div>
                      <div className="tl-event-time">
                        {new Date(e.occurredAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                        {isSystem ? ' · system' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PlosReveal>
      )}
    </div>
  );
}

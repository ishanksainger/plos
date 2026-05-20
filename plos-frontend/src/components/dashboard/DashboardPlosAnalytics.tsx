import { useMemo, useState, useEffect } from 'react';
import {
  ActionIcon,
  Box,
  Grid,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconCalendarEvent,
  IconCheck,
  IconClockHour4,
  IconDotsVertical,
  IconPencil,
} from '@tabler/icons-react';
import FinancialAreaChart from '../charts/FinancialAreaChart';
import ActivityLineChart from '../charts/ActivityLineChart';
import CreateResponsibilityModal from '../responsibilities/CreateResponsibilityModal';
import { CategoryPulsePanel } from './CategoryPulsePanel';
import { ExecutiveInsightModal } from './ExecutiveInsightModal';
import { PlosMonthlyStackCard } from './PlosMonthlyStackCard';
import { WalletSparkline } from './WalletSparkline';
import { PL_PALETTE, useDS } from '../../theme/palette';
import type { ActivitySeriesPoint, DashboardData, Responsibility } from '../../types/dashboard';
import { registerDashboardCreateResponsibilityHandler } from '../../utils/dashboard-create-bridge';

const C_PINK = '#be185d';
const C_NAVY = '#3949ab';
/** Primary plot purple — matches brand / reference (#8E70FF) */
const C_BRAND_PURPLE = PL_PALETTE.brand;

const P = PL_PALETTE;
const SHADOW = 'var(--pl-shadow-card)';
const chartCardPadding = '22px 24px 18px';

/** Recharts needs explicit pixel-ish heights; avoid flex%+height:100% (collapses → blank charts). */
const CHART_PAIR_H = 'clamp(200px, 24vh, 280px)';
const CHART_ANALYTICS_H = 'clamp(188px, 20vh, 248px)';

const chartTooltipStyle = {
  background: '#fff',
  borderRadius: 12,
  border: `1px solid ${P.border}`,
  boxShadow: SHADOW,
};

const CAT_COLORS: Record<string, string> = {
  finance: C_BRAND_PURPLE,
  health: '#15803d',
  habit: '#b45309',
  family: C_PINK,
  admin: C_NAVY,
};

const buildStateMeta = (DS: ReturnType<typeof useDS>) =>
  ({
    OVERDUE: { color: DS.red, label: 'Overdue', icon: IconAlertTriangle },
    DUE: { color: DS.orange, label: 'Due Today', icon: IconClockHour4 },
    UPCOMING: { color: DS.accent, label: 'Upcoming', icon: IconCalendarEvent },
    COMPLETED: { color: DS.green, label: 'Completed', icon: IconCheck },
  }) as const;

type StateKey = 'OVERDUE' | 'DUE' | 'UPCOMING' | 'COMPLETED';

function paddedActivity(series: ActivitySeriesPoint[] | undefined, len: number): ActivitySeriesPoint[] {
  const s = series ?? [];
  if (s.length >= len) return s.slice(-len);
  const pad = [...s];
  while (pad.length < len) pad.unshift({ date: pad[0]?.date ?? '', count: 0 });
  return pad.slice(-len);
}


const StatusPill = ({ state, DS }: { state: StateKey; DS: ReturnType<typeof useDS> }) => {
  const meta = buildStateMeta(DS)[state];
  return (
    <Box
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        borderRadius: 999,
        background: `${meta.color}14`,
        border: `1px solid ${meta.color}30`,
      }}
    >
      <Box style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
      <Text fz={11} fw={700} tt="uppercase" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </Box>
  );
};

function HistAvatar({ initials }: { initials: string }) {
  return (
    <Box
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: `${P.accent}18`,
        color: P.accent,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
      }}
    >
      {initials.toUpperCase()}
    </Box>
  );
}

function BadgeDone({ DS }: { DS: ReturnType<typeof useDS> }) {
  return (
    <Text fz={11} fw={800} px={14} py={6} tt="uppercase" style={{ color: DS.green, background: DS.greenBg, borderRadius: 999 }}>
      Done
    </Text>
  );
}

interface DashboardSidebarGradientKpisProps {
  summary: DashboardData['summary'];
  spark7d: number[];
  dueTodayInr: number;
  overdueInr: number;
  formatInrCompact: (n: number) => string;
}

/**
 * Four gradient KPI tiles in a vertical sidebar rail (narrow column layout).
 *
 * @param props - Snapshot summary, sparkline input, INR helpers for captions.
 */
function DashboardSidebarGradientKpis({
  summary,
  spark7d,
  dueTodayInr,
  overdueInr,
  formatInrCompact,
}: DashboardSidebarGradientKpisProps) {
  const fzMain = 28;
  const sparkH = 64;
  return (
    <div className="plos-stat-strip-side">
      <Box className="plos-grad-stat plos-grad-stat-dense" style={{ background: 'linear-gradient(135deg,#a47bff 0%,#7c4fff 55%,#5e30e8 100%)' }}>
        <Box style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
          <WalletSparkline values={spark7d.length >= 2 ? spark7d : [0, 1, 2, 1, 3]} stroke="#fff" fill="rgba(255,255,255,0.25)" height={sparkH} />
        </Box>
        <Text fz={10} fw={700} tt="uppercase" lts="0.1em" mb={8} style={{ opacity: 0.88, position: 'relative', zIndex: 1 }}>Total responsibilities</Text>
        <Text fz={fzMain} fw={900} lh={1} style={{ fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 1 }}>{summary.total}</Text>
        <Text fz={11} mt={8} style={{ opacity: 0.85, position: 'relative', zIndex: 1 }}>{summary.completed} completed · {summary.completionRate}% rate</Text>
      </Box>
      <Box className="plos-grad-stat plos-grad-stat-dense" style={{ background: 'linear-gradient(135deg,#b48cff 0%,#8e70ff 55%,#6f52ed 100%)' }}>
        <Box style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
          <WalletSparkline values={[2, 4, 3, 6, 5, 7, summary.completed].map(Number)} stroke="#fff" fill="rgba(255,255,255,0.25)" height={sparkH} />
        </Box>
        <Text fz={10} fw={700} tt="uppercase" lts="0.1em" mb={8} style={{ opacity: 0.88, position: 'relative', zIndex: 1 }}>Completed</Text>
        <Text fz={fzMain} fw={900} lh={1} style={{ fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 1 }}>{summary.completed}</Text>
        <Text fz={11} mt={8} style={{ opacity: 0.85, position: 'relative', zIndex: 1 }}>{summary.upcoming} upcoming in pipeline</Text>
      </Box>
      <Box className="plos-grad-stat plos-grad-stat-dense" style={{ background: 'linear-gradient(135deg,#7b85ff 0%,#5c6bc0 55%,#3949ab 100%)' }}>
        <Box style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
          <WalletSparkline values={[1, 2, 1, 3, 2, 4, summary.due + 1].map(Number)} stroke="#fff" fill="rgba(255,255,255,0.25)" height={sparkH} />
        </Box>
        <Text fz={10} fw={700} tt="uppercase" lts="0.1em" mb={8} style={{ opacity: 0.88, position: 'relative', zIndex: 1 }}>Due today</Text>
        <Text fz={fzMain} fw={900} lh={1} style={{ fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 1 }}>{summary.due}</Text>
        <Text fz={11} mt={8} style={{ opacity: 0.85, position: 'relative', zIndex: 1 }}>
          {dueTodayInr > 0 ? `₹${formatInrCompact(dueTodayInr)} due` : 'Action required today'}
        </Text>
      </Box>
      <Box className="plos-grad-stat plos-grad-stat-dense" style={{ background: 'linear-gradient(135deg,#ff85aa 0%,#e85d88 55%,#c94070 100%)' }}>
        <Box style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
          <WalletSparkline values={[3, 2, 4, 2, 3, 1, summary.overdue + 1].map(Number)} stroke="#fff" fill="rgba(255,255,255,0.25)" height={sparkH} />
        </Box>
        <Text fz={10} fw={700} tt="uppercase" lts="0.1em" mb={8} style={{ opacity: 0.88, position: 'relative', zIndex: 1 }}>Overdue</Text>
        <Text fz={fzMain} fw={900} lh={1} style={{ fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 1 }}>{summary.overdue}</Text>
        <Text fz={11} mt={8} style={{ opacity: 0.85, position: 'relative', zIndex: 1 }}>
          {overdueInr > 0 ? `₹${formatInrCompact(overdueInr)} exposure` : 'Needs immediate attention'}
        </Text>
      </Box>
    </div>
  );
}

interface DashboardPlosAnalyticsProps {
  data: DashboardData;
  /** Current user greeting */
  displayName: string;
  formatInrCompact: (n: number) => string;
  momentumScore: number;
  weekActivity: number;
}

/**
 * Live analytics from `DashboardData`: KPI rail, charts, and queue — all sourced from the API.
 *
 * @param props - Dashboard snapshot + greeting + helpers.
 */
export function DashboardPlosAnalytics({
  data,
  displayName,
  formatInrCompact,
  momentumScore,
  weekActivity,
}: DashboardPlosAnalyticsProps) {
  const DS = useDS();
  const [createOpen, setCreateOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [editRow, setEditRow] = useState<Responsibility | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  useEffect(() => {
    registerDashboardCreateResponsibilityHandler(() => {
      setCreateOpen(true);
    });
    return () => registerDashboardCreateResponsibilityHandler(null);
  }, []);

  const {
    summary,
    overdue,
    dueToday,
    upcoming,
    recentlyCompleted,
    categoryBreakdown,
    financialPressure,
    activitySeries: act,
  } = data;

  const activitySeries = data.activitySeries ?? [];

  const categoryChartData = useMemo(
    () =>
      categoryBreakdown.map((c) => ({
        name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        count: c.count,
      })),
    [categoryBreakdown],
  );

  const lineCompare = useMemo(() => {
    const s = activitySeries;
    const cur = paddedActivity(s, 8);
    const prevStart = Math.max(0, s.length - 16);
    const prev = s.slice(prevStart, prevStart + 8);
    return cur.map((pt, i) => ({
      name: pt.date ? new Date(pt.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : `${i + 1}`,
      current: pt.count,
      prior: prev[i]?.count ?? 0,
    }));
  }, [activitySeries]);

  const activityLast7 = useMemo(() => activitySeries.slice(-7), [activitySeries]);
  const last7BarData = useMemo(
    () =>
      activityLast7.map((p) => ({
        name: p.date
          ? new Date(p.date).toLocaleDateString('en-IN', { weekday: 'short' })
          : '—',
        count: p.count,
      })),
    [activityLast7],
  );

  const queueByState = useMemo(
    () => [
      { name: 'Overdue', count: overdue.length },
      { name: 'Due today', count: dueToday.length },
      { name: 'Upcoming', count: upcoming.length },
    ],
    [overdue.length, dueToday.length, upcoming.length],
  );

  /** One snapshot row for workload bars (computed from API summary fields). */
  const workloadGroupedData = useMemo(() => {
    const s = summary;
    const openPipe = s.upcoming + s.due + s.overdue;
    return [
      {
        name: 'Now',
        total: s.total,
        openPipe,
        done: s.completed,
        overdue: s.overdue,
      },
    ];
  }, [summary]);

  const spark7d = useMemo(() => activityLast7.map((p) => p.count), [activityLast7]);

  const outstandingInr = [...overdue, ...dueToday, ...upcoming].reduce(
    (s, r) => s + (r.amount ? Number(r.amount) : 0),
    0,
  );

  const sumAmounts = (rows: Responsibility[]) =>
    rows.reduce((acc, r) => acc + (r.amount != null ? Number(r.amount) : 0), 0);
  const pipelineInr = sumAmounts(upcoming);
  const allOpenInr = sumAmounts([...overdue, ...dueToday, ...upcoming]);
  const overdueInr = sumAmounts(overdue);
  const dueTodayInr = sumAmounts(dueToday);

  const needsAttention = [
    ...overdue.map((r) => ({ ...r, state: 'OVERDUE' as const })),
    ...dueToday.map((r) => ({ ...r, state: 'DUE' as const })),
    ...upcoming.slice(0, 8).map((r) => ({ ...r, state: 'UPCOMING' as const })),
  ];


  const barData =
    financialPressure.length > 0
      ? financialPressure.map((d) => {
          const [y, m] = d.month.split('-');
          return {
            label: new Date(Number(y), Number(m) - 1).toLocaleString('en', { month: 'short' }),
            value: d.total,
          };
        })
      : (act ?? []).slice(-8).map((pt) => ({
          label: new Date(pt.date).toLocaleString('en', { month: 'short', day: 'numeric' }),
          value: pt.count,
        }));

  const estFooter =
    pipelineInr >= 1000 ? formatInrCompact(pipelineInr) : `${summary.upcoming} scheduled`;
  const calcFooter =
    allOpenInr >= 1000 ? formatInrCompact(allOpenInr) : `${needsAttention.length} open`;

  return (
    <Stack gap={0}>
      <CreateResponsibilityModal
        opened={createOpen || editRow != null}
        onClose={() => {
          setCreateOpen(false);
          setEditRow(null);
        }}
        editing={editRow}
      />

      <ExecutiveInsightModal
        opened={insightOpen}
        onClose={() => setInsightOpen(false)}
        data={data}
        formatInr={formatInrCompact}
        momentumScore={momentumScore}
        weekActivity={weekActivity}
      />

      <Box
        style={{
          padding:
            '0 clamp(14px, 2.8vw, 32px) clamp(22px, 3.5vw, 40px)',
        }}
      >
        {/* ── Main grid: charts + right rail (KPIs live in sidebar, not a full-width top row) ── */}
        <div className="plos-dash-main-grid">
          <div>
            <Stack gap={22}>
              {/* 2 Charts side by side */}
              <Grid gutter={{ base: 16, sm: 24 }}>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box
                    className="plos-studio-card"
                    style={{
                      padding: chartCardPadding,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Group justify="space-between" align="flex-start" mb={8} wrap="nowrap">
                      <Box>
                        <Text component="span" className="plos-dash-chart-title">
                          Workload overview
                        </Text>
                        <Text component="div" className="plos-dash-chart-sub">
                          Total · open · done · overdue
                        </Text>
                      </Box>
                      <ActionIcon variant="light" radius="xl" color="gray" size="sm"><IconDotsVertical size={15} /></ActionIcon>
                    </Group>
                    {/* Legend above chart to prevent overlap */}
                    <Group gap={12} mb={6} wrap="wrap">
                      {[{ label: 'Total', color: C_BRAND_PURPLE }, { label: 'Open', color: '#6d28d9' }, { label: 'Done', color: C_PINK }, { label: 'Overdue', color: C_NAVY }].map(({ label, color }) => (
                        <Group key={label} gap={5} wrap="nowrap">
                          <Box style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <Text component="span" className="plos-dash-chart-legend-label">{label}</Text>
                        </Group>
                      ))}
                    </Group>
                    <Box style={{ width: '100%', height: CHART_PAIR_H, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadGroupedData} barGap={4} barCategoryGap="14%" margin={{ top: 8, right: 12, bottom: 6, left: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecebf2" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.text2 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: P.text2 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                          <RTooltip contentStyle={chartTooltipStyle} />
                          <Bar dataKey="total" name="Total" fill={C_BRAND_PURPLE} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="openPipe" name="Open" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="done" name="Done" fill={C_PINK} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="overdue" name="Overdue" fill={C_NAVY} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box
                    className="plos-studio-card"
                    style={{
                      padding: chartCardPadding,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Group justify="space-between" align="flex-start" mb={8} wrap="nowrap">
                      <Box>
                        <Text component="span" className="plos-dash-chart-title">
                          Category distribution
                        </Text>
                        <Text component="div" className="plos-dash-chart-sub">Items per category</Text>
                      </Box>
                      <ActionIcon variant="light" radius="xl" color="gray" size="sm"><IconDotsVertical size={15} /></ActionIcon>
                    </Group>
                    <Box style={{ width: '100%', height: CHART_PAIR_H, flexShrink: 0 }}>
                      {categoryChartData.length === 0 ? (
                        <Text fz="sm" c="dimmed" py={60} ta="center">Add categorized responsibilities to see bars.</Text>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryChartData} barCategoryGap="14%" margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecebf2" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.text2 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: P.text2 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                            <RTooltip contentStyle={chartTooltipStyle} />
                            <Bar dataKey="count" name="Items" fill={C_BRAND_PURPLE} radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Box>
                </Grid.Col>
              </Grid>

              {/* 1 full-width chart */}
              <Box className="plos-studio-card" style={{ padding: chartCardPadding }}>
                <Group justify="space-between" align="flex-start" mb={10} wrap="nowrap">
                  <Box>
                    <Text component="span" className="plos-dash-chart-title">
                      Analytics report
                    </Text>
                    <Text component="div" className="plos-dash-chart-sub">
                      Latest 8 days vs prior 8 days · daily completion &amp; check-in rhythm
                    </Text>
                  </Box>
                  <Group gap={16} wrap="nowrap" align="center">
                    <Group gap={5} wrap="nowrap">
                      <Box style={{ width: 28, height: 2, background: C_PINK, borderRadius: 1 }} />
                      <Text component="span" className="plos-dash-chart-legend-label">Prior 8d</Text>
                    </Group>
                    <Group gap={5} wrap="nowrap">
                      <Box style={{ width: 28, height: 2, background: C_BRAND_PURPLE, borderRadius: 1 }} />
                      <Text component="span" className="plos-dash-chart-legend-label">Latest 8d</Text>
                    </Group>
                    <ActionIcon variant="light" radius="xl" color="gray" size="sm"><IconDotsVertical size={15} /></ActionIcon>
                  </Group>
                </Group>
                <Box style={{ height: CHART_ANALYTICS_H, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineCompare} margin={{ top: 12, right: 14, bottom: 8, left: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecebf2" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: P.text2 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: P.text2 }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
                      <RTooltip contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="prior" name="Prior 8d" stroke={C_PINK} strokeWidth={2.5} dot={{ r: 4, fill: C_PINK }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="current" name="Latest 8d" stroke={C_BRAND_PURPLE} strokeWidth={2.5} dot={{ r: 4, fill: C_BRAND_PURPLE }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              {/* Mini charts — two aligned rows so each pair matches height (see .plos-mini-chart-strip-rows) */}
              <div className="plos-mini-chart-strip-rows">
                <div className="plos-mini-chart-row">
                  <Box className="plos-studio-card plos-mini-chart-card" style={{ padding: '18px 20px 16px' }}>
                    <Text mb={10} className="plos-dash-tile-title" component="span" display="block">
                      {financialPressure.some((x) => x.total > 0) ? 'Monthly INR pressure' : 'Cash / activity'}
                    </Text>
                    <Box className="plos-mini-chart-svg">
                      <FinancialAreaChart
                        data={barData.map((d) => ({ label: d.label, value: d.value }))}
                        fit="fill"
                        format={(v) =>
                          financialPressure.some((x) => x.total > 0)
                            ? `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}`
                            : String(Math.round(v))
                        }
                      />
                    </Box>
                  </Box>
                  <Box className="plos-studio-card plos-mini-chart-card" style={{ padding: '18px 20px 16px' }}>
                    <Text mb={10} className="plos-dash-tile-title" component="span" display="block">Activity pulse</Text>
                    <Box className="plos-mini-chart-svg"><ActivityLineChart series={activitySeries} fit="fill" /></Box>
                  </Box>
                </div>
                <div className="plos-mini-chart-row">
                  <Box className="plos-studio-card plos-mini-chart-card" style={{ padding: '18px 20px 16px' }}>
                    <Text mb={10} className="plos-dash-tile-title" component="span" display="block">Open queue</Text>
                    <Box className="plos-mini-chart-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={queueByState} layout="vertical" margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#ecebf2" />
                          <XAxis type="number" hide allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fill: P.text2 }} />
                          <RTooltip contentStyle={chartTooltipStyle} />
                          <Bar dataKey="count" fill={C_BRAND_PURPLE} radius={[0, 6, 6, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                  <Box className="plos-studio-card plos-mini-chart-card" style={{ padding: '18px 20px 16px' }}>
                    <Text mb={10} className="plos-dash-tile-title" component="span" display="block">Last 7 days</Text>
                    <Box className="plos-mini-chart-chart">
                      {last7BarData.length === 0 ? (
                        <Box className="plos-mini-chart-empty">
                          <Text fz="sm" c="dimmed" ta="center">No activity yet.</Text>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={last7BarData} margin={{ left: -4, right: 10, top: 12, bottom: 6 }} barCategoryGap="18%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecebf2" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.text2 }} axisLine={false} tickLine={false} />
                            <YAxis width={30} allowDecimals={false} tick={{ fontSize: 11, fill: P.text2 }} axisLine={false} />
                            <RTooltip contentStyle={chartTooltipStyle} />
                            <Bar dataKey="count" fill={C_NAVY} radius={[6, 6, 0, 0]} maxBarSize={36} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Box>
                </div>
              </div>

              <Box className="plos-studio-card" style={{ overflow: 'hidden' }}>
                <Group justify="space-between" px={{ base: 'md', sm: 'xl' }} py="lg" style={{ borderBottom: `1px solid rgba(124,79,255,0.14)` }}>
                  <Text component="span" className="plos-dash-chart-title">
                    Open commitments
                  </Text>
                  <Text fz={12} fw={700} style={{ color: '#5b4788' }}>{needsAttention.length} items</Text>
                </Group>
                {needsAttention.length === 0 ? (
                  <Box py={44} px={16}><Text fz="sm" ta="center" style={{ color: DS.text2 }}>Nothing queued — enjoy the clarity.</Text></Box>
                ) : (
                  <Box style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                          {['Status', 'Task', 'Category', 'Owner', 'Due', 'Amt', ''].map((col, i) => (
                            <th key={col} style={{ padding: '10px 14px', textAlign: (i >= 5 ? 'right' : 'left') as 'left' | 'right', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: DS.text3, whiteSpace: 'nowrap' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {needsAttention.map((r, idx) => (
                          <tr key={`${r.state}-${r.id}`}
                            onMouseEnter={() => setHoverRow(idx)}
                            onMouseLeave={() => setHoverRow((h) => (h === idx ? null : h))}
                            style={{ borderBottom: idx < needsAttention.length - 1 ? `1px solid ${P.border}` : 'none', background: hoverRow === idx ? P.hoverBg : 'transparent', transition: 'background 0.14s ease' }}
                          >
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><StatusPill state={r.state} DS={DS} /></td>
                            <td style={{ padding: '12px 14px', maxWidth: 220 }}><Text fz="sm" fw={600} truncate style={{ color: DS.text1 }}>{r.title}</Text></td>
                            <td style={{ padding: '12px 14px' }}>
                              <Text fz="xs" tt="capitalize" fw={700} style={{ color: CAT_COLORS[r.category] ?? DS.accent, background: `${(CAT_COLORS[r.category] ?? DS.accent)}18`, borderRadius: 999, padding: '4px 10px', display: 'inline-block' }}>
                                {r.category}
                              </Text>
                            </td>
                            <td style={{ padding: '12px 14px' }}><Text fz="sm" truncate>{r.person?.name ?? '—'}</Text></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <Text fz="sm" fw={r.state === 'OVERDUE' ? 700 : 500} style={{ color: r.state === 'OVERDUE' ? DS.red : DS.text1 }}>
                                {new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </Text>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <Text fz="sm" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {r.amount ? `₹${Number(r.amount).toLocaleString('en-IN')}` : '—'}
                              </Text>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <Tooltip label="Edit" withArrow>
                                <ActionIcon aria-label="Edit" variant="subtle" radius="xl" onClick={() => setEditRow(r as Responsibility)}>
                                  <IconPencil size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </Box>

            </Stack>
          </div>

          {/* Right column — clipped horizontally so stacked hero + shadows cannot cover the scrollbar */}
          <div className="plos-dash-right-col">
            <Stack gap={22}>
              <DashboardSidebarGradientKpis
                summary={summary}
                spark7d={spark7d}
                dueTodayInr={dueTodayInr}
                overdueInr={overdueInr}
                formatInrCompact={formatInrCompact}
              />
              <PlosMonthlyStackCard
                completionPct={summary.completionRate}
                headlineLabel="Your progress this month"
                headlineValue={allOpenInr >= 1000 ? formatInrCompact(allOpenInr) : summary.total > 0 ? `${summary.total}` : '—'}
                footerLeftValue={estFooter}
                footerRightValue={calcFooter}
                onOpenDetail={() => setInsightOpen(true)}
              />

              {/* Check-ins hero + Category pulse — side-by-side on medium screens */}
              <div className="plos-right-checkins-pulse">
              <Box
                style={{
                  borderRadius: 'var(--pl-card-radius)',
                  padding: '20px 20px',
                  minHeight: 130,
                  color: '#fff',
                  background: 'linear-gradient(145deg,#9248ee 0%,#6828dc 52%,#3d1698 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 22px 52px rgba(72,36,166,0.50)',
                  border: '1px solid rgba(255,255,255,0.28)',
                }}
              >
                <Box aria-hidden style={{ position: 'absolute', inset: '-6px 0 0 0', opacity: 0.28, pointerEvents: 'none' }}>
                  <WalletSparkline
                    values={(activitySeries.slice(-14).length ? activitySeries.slice(-14) : [{ date: '', count: 1 }, { date: '', count: 2 }]).map((pt) => pt.count)}
                    stroke="rgba(255,255,255,0.95)" fill="rgba(255,255,255,0.12)" height={72}
                  />
                </Box>
                <Group justify="space-between" wrap="nowrap" mt={8} align="flex-end" style={{ position: 'relative', zIndex: 1 }}>
                  <Box>
                    <Text fz={40} fw={900} lh={1} style={{ fontVariantNumeric: 'tabular-nums' }}>{weekActivity}</Text>
                    <Text fz={11} fw={700} mt={6} style={{ opacity: 0.92, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Check-ins · last 7 days</Text>
                    <Text fz={12} mt={8} opacity={0.85}>{displayName.split(' ')[0] ?? displayName}, rhythm drives clarity.</Text>
                  </Box>
                  <ActionIcon aria-label="Habits" variant="transparent" radius="xl" style={{ border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}>
                    <IconArrowUpRight size={20} stroke={2} />
                  </ActionIcon>
                </Group>
              </Box>

              <CategoryPulsePanel
                outstandingInr={outstandingInr}
                completionRate={summary.completionRate}
                momentumScore={momentumScore}
                summaryTotal={summary.total}
                summaryCompleted={summary.completed}
                summaryUpcoming={summary.upcoming}
                categoryBreakdown={categoryBreakdown}
              />
              </div>

              <Grid gutter={12}>
                <Grid.Col span={6}>
                  <Box style={{ borderRadius: 'var(--pl-card-radius)', padding: '16px 14px', minHeight: 100, color: '#fff', background: 'linear-gradient(135deg,#9b72ff 0%,#7c4fff 100%)', boxShadow: '0 12px 28px rgba(111,82,237,0.32)', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <Text fz={10} fw={700} tt="uppercase" style={{ opacity: 0.88, letterSpacing: '0.08em' }}>Due today</Text>
                    <Text fz={28} fw={900} mt={6} style={{ fontVariantNumeric: 'tabular-nums' }}>{summary.due}</Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Box style={{ borderRadius: 'var(--pl-card-radius)', padding: '16px 14px', minHeight: 100, color: '#fff', background: 'linear-gradient(135deg,#6f8bff 0%,#3949ab 100%)', boxShadow: '0 12px 28px rgba(57,73,171,0.32)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <Text fz={10} fw={700} tt="uppercase" style={{ opacity: 0.88, letterSpacing: '0.08em' }}>Cleared</Text>
                    <Text fz={28} fw={900} mt={6} style={{ fontVariantNumeric: 'tabular-nums' }}>{recentlyCompleted.length}</Text>
                  </Box>
                </Grid.Col>
              </Grid>

              {/* Upcoming spotlight */}
              <Box className="plos-studio-card" style={{ padding: '16px 18px' }}>
                <Text mb={10} className="plos-dash-tile-title" component="span" display="block">Upcoming spotlight</Text>
                <Stack gap={8}>
                  {upcoming.slice(0, 5).length === 0 ? (
                    <Text fz="sm" style={{ color: P.text3 }}>No upcoming commitments.</Text>
                  ) : (
                    upcoming.slice(0, 5).map((r) => (
                      <Group key={r.id} justify="space-between" wrap="nowrap" gap={8}>
                        <Text fz="sm" fw={600} truncate style={{ flex: 1 }}>{r.title}</Text>
                        <Text fz="xs" c="dimmed" tt="capitalize">{r.category}</Text>
                        <Text fz="xs" fw={700} style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {new Date(r.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </Text>
                      </Group>
                    ))
                  )}
                </Stack>
              </Box>

              <Box className="plos-studio-card" style={{ padding: '16px 18px' }}>
                <Text mb={10} className="plos-dash-tile-title" component="span" display="block">
                  People roster ({data.persons.length})
                </Text>
                <Stack gap={10}>
                  {data.persons.length === 0 ? (
                    <Text fz="sm" style={{ color: P.text3 }}>No people captured — add from People.</Text>
                  ) : (
                    data.persons.slice(0, 8).map((p) => (
                      <Group key={p.id} justify="space-between" wrap="nowrap">
                        <Text fz="sm" fw={700}>{p.name}</Text>
                        <Text fz="xs" tt="capitalize" c="dimmed">{p.relation}</Text>
                      </Group>
                    ))
                  )}
                </Stack>
              </Box>
              <Box className="plos-studio-card" style={{ padding: '16px 18px' }}>
                <Text mb={10} className="plos-dash-tile-title" component="span" display="block">Recently closed</Text>
                <Stack gap={8}>
                  {recentlyCompleted.length === 0 ? (
                    <Text fz="sm" style={{ color: DS.text3 }}>Complete tasks to see here.</Text>
                  ) : (
                    recentlyCompleted.slice(0, 5).map((r) => (
                      <Group key={r.id} wrap="nowrap" gap={10} align="center" justify="space-between">
                        <Group gap={10} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <HistAvatar initials={r.title.charAt(0)} />
                          <Box style={{ minWidth: 0 }}>
                            <Text fw={800} fz="sm" truncate>{r.person?.name ?? r.title.slice(0, 14)}</Text>
                            <Text fz="xs" style={{ color: DS.text3 }}>
                              {new Date(r.completedAt ?? r.dueDate).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </Text>
                          </Box>
                        </Group>
                        <Text fz="xs" fw={700} style={{ fontVariantNumeric: 'tabular-nums', color: P.text2 }}>
                          {r.amount ? `₹${Number(r.amount).toLocaleString('en-IN')}` : r.category}
                        </Text>
                        <BadgeDone DS={DS} />
                      </Group>
                    ))
                  )}
                </Stack>
              </Box>
            </Stack>
          </div>
        </div>
      </Box>
    </Stack>
  );
}

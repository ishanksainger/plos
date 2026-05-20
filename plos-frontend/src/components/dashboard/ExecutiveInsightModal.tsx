import type { ReactNode } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Progress,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconArrowRight, IconChartInfographic, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import type { DashboardData, FinancialPressure, Responsibility } from '../../types/dashboard';
import ActivityLineChart from '../charts/ActivityLineChart';

const CAT_HEX: Record<string, string> = {
  finance: '#ffffff',
  health: '#6ee7b7',
  habit: '#fcd34d',
  family: '#fbcfe8',
  admin: '#c7d2fe',
};

type AccentTone = 'deep' | 'lavender' | 'indigo';

const ACCENT_META: Record<AccentTone, { slab: string; gradient: string }> = {
  deep: {
    slab: '#4a148c',
    gradient: 'linear-gradient(165deg, #7e57c2 0%, var(--pl-stack-deep) 52%, #4527a0 100%)',
  },
  lavender: {
    slab: '#b39ddb',
    gradient: 'linear-gradient(165deg, #ce93d8 0%, #9575cd 52%, #7e57c2 100%)',
  },
  indigo: {
    slab: '#303f9f',
    gradient: 'linear-gradient(165deg, #5c6bc0 0%, #3949ab 52%, #283593 100%)',
  },
};

const TONES: AccentTone[] = ['deep', 'lavender', 'indigo'];

/**
 * Single analytics tile with a fanned back slab + front face (matches dashboard hero stack).
 */
function ExecTile({
  tone,
  children,
  className,
}: {
  tone: AccentTone;
  children: ReactNode;
  className?: string;
}) {
  const { slab, gradient } = ACCENT_META[tone];
  return (
    <Box className={`plos-exec-tile-hover ${className ?? ''}`} style={{ minWidth: 0, height: '100%' }}>
      <Box style={{ position: 'relative', paddingRight: 12, paddingBottom: 16, height: '100%' }}>
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            inset: '12px 2px -8px 16px',
            borderRadius: 'calc(var(--pl-card-radius) + 3px)',
            background: slab,
            opacity: 0.94,
            transform: 'rotate(2.2deg)',
            transformOrigin: 'bottom right',
            boxShadow: '0 14px 32px rgba(0,0,0,0.38)',
            zIndex: 0,
          }}
        />
        <Box
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            borderRadius: 'var(--pl-card-radius)',
            background: gradient,
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow:
              '0 4px 0 rgba(0,0,0,0.14), 0 22px 48px rgba(40, 20, 80, 0.38), inset 0 1px 0 rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '16px 18px',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function pickTone(i: number): AccentTone {
  return TONES[i % TONES.length]!;
}

/** Progress bar — peach track on dark tiles. */
function InsightProgress({ value, barColor }: { value: number; barColor: string }) {
  return (
    <Progress
      value={Math.min(100, Math.max(0, value))}
      size="sm"
      radius="xl"
      styles={{
        root: { background: 'rgba(255, 205, 210, 0.35)' },
        section: { backgroundColor: barColor, boxShadow: '0 0 10px rgba(255,255,255,0.3)' },
      }}
    />
  );
}

/**
 * Compact monthly totals as vertical bars (last N months).
 */
function CashflowMiniBars({ data, formatInr }: { data: FinancialPressure[]; formatInr: (n: number) => string }) {
  const last = data.slice(-6);
  const max = Math.max(...last.map((d) => d.total), 1);
  return (
    <Group align="flex-end" gap={8} justify="space-between" wrap="nowrap" mt={10} style={{ height: 96 }}>
      {last.map((d) => {
        const h = Math.max(10, Math.round((d.total / max) * 72));
        const [y, m] = d.month.split('-');
        const label = m && y ? `${m}/${y.slice(2)}` : d.month;
        return (
          <Stack key={d.month} gap={6} align="center" style={{ flex: 1, minWidth: 0 }}>
            <Text fz={9} fw={700} ta="center" truncate title={formatInr(d.total)} style={{ opacity: 0.88 }}>
              {formatInr(d.total)}
            </Text>
            <Box
              style={{
                width: '100%',
                height: h,
                borderRadius: 10,
                background: 'linear-gradient(180deg, #ffffff 0%, var(--pl-progress-peach) 100%)',
                boxShadow: '0 2px 0 rgba(0,0,0,0.12)',
              }}
            />
            <Text fz={9} ta="center" style={{ opacity: 0.72 }}>
              {label}
            </Text>
          </Stack>
        );
      })}
    </Group>
  );
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

function sumAmount(rows: Responsibility[]) {
  return rows.reduce((s, r) => s + (r.amount != null ? Number(r.amount) : 0), 0);
}

export interface ExecutiveInsightModalProps {
  opened: boolean;
  onClose: () => void;
  data: DashboardData;
  formatInr: (n: number) => string;
  momentumScore: number;
  weekActivity: number;
}

/**
 * Full-viewport mosaic: each metric is its own fanned purple family tile in a wrapping grid (no blank flanks).
 */
export function ExecutiveInsightModal({
  opened,
  onClose,
  data,
  formatInr,
  momentumScore,
  weekActivity,
}: ExecutiveInsightModalProps) {
  const navigate = useNavigate();
  const {
    summary,
    categoryBreakdown,
    personLoad,
    financialPressure,
    activitySeries,
    recentlyCompleted,
    overdue,
    dueToday,
    upcoming,
    persons,
  } = data;

  const openRows = [...overdue, ...dueToday, ...upcoming];
  const pipelineInr = sumAmount(upcoming);
  const totalOpenInr = sumAmount(openRows);
  const overdueInr = sumAmount(overdue);
  const dueTodayInr = sumAmount(dueToday);
  const maxPerson = Math.max(1, ...personLoad.map((p) => p.count));

  const topByAmount = [...openRows]
    .filter((r) => r.amount != null && Number(r.amount) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 6);

  const upcomingSorted = [...upcoming].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)).slice(0, 8);

  const act14 = activitySeries.slice(-14);
  const actSum = act14.reduce((s, p) => s + p.count, 0);
  const actPeak = act14.length ? Math.max(...act14.map((p) => p.count)) : 0;
  const actAvg = act14.length ? actSum / act14.length : 0;

  const openNeedingAttention = overdue.length + dueToday.length;
  const loadPerPerson = persons.length ? summary.total / persons.length : summary.total;
  const kpiRows: { label: string; value: string; hint: string; span2?: boolean }[] = [
    { label: 'Total commitments', value: `${summary.total}`, hint: 'Everything in your operating graph.' },
    { label: 'Completion rate', value: `${summary.completionRate}%`, hint: 'Closed ÷ total on active items.' },
    { label: 'Momentum index', value: `${momentumScore}`, hint: 'Blended health score (0–100).' },
    { label: '14-day volume', value: `${actSum}`, hint: `Peak day ${actPeak} · avg ${actAvg.toFixed(1)}/day` },
    {
      label: 'Overdue',
      value: `${summary.overdue}`,
      hint: overdueInr > 0 ? `${formatInr(overdueInr)} at risk` : 'No overdue amounts logged.',
    },
    {
      label: 'Due today',
      value: `${summary.due}`,
      hint: dueTodayInr > 0 ? `${formatInr(dueTodayInr)} due now` : 'Nothing due with amounts.',
    },
    { label: 'Upcoming', value: `${summary.upcoming}`, hint: `Pipeline ${formatInr(pipelineInr)}` },
    {
      label: 'Completed (life)',
      value: `${summary.completed}`,
      hint: `${summary.completionRate}% completion (dashboard roll-up)`,
    },
    {
      label: 'Attention queue',
      value: `${openNeedingAttention}`,
      hint: 'Overdue + due today — clear first.',
      span2: true,
    },
    {
      label: 'People & load',
      value: `${persons.length}`,
      hint: persons.length ? `~${loadPerPerson.toFixed(1)} items / person` : 'Add people to distribute work.',
      span2: true,
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      padding={0}
      size="100%"
      radius={0}
      centered
      overlayProps={{ backgroundOpacity: 0.62, blur: 6 }}
      styles={{
        inner: { padding: 0, alignItems: 'stretch' },
        content: {
          background: 'transparent',
          boxShadow: 'none',
          width: '100vw',
          maxWidth: '100vw',
          minHeight: '100dvh',
          maxHeight: '100dvh',
          height: '100dvh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        body: { padding: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
        header: { display: 'none' },
      }}
    >
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, #1a0f32 0%, #2d1a52 38%, #120a24 100%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Group
          justify="space-between"
          align="center"
          wrap="nowrap"
          px={{ base: 14, sm: 22 }}
          py={14}
          style={{
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(90deg, rgba(94,53,177,0.35) 0%, rgba(48,63,159,0.22) 100%)',
          }}
        >
          <Group gap="md" wrap="nowrap">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChartInfographic size={26} stroke={1.5} color="#fff" />
            </Box>
            <Box style={{ minWidth: 0 }}>
              <Text fw={900} fz={{ base: 'lg', sm: 'xl' }} lh={1.1} truncate style={{ letterSpacing: '-0.03em' }}>
                Executive insight
              </Text>
              <Text fz={11} fw={700} tt="uppercase" style={{ opacity: 0.82, letterSpacing: '0.14em', marginTop: 4 }}>
                Full-width mosaic · live analytics plane
              </Text>
            </Box>
          </Group>
          <ActionIcon
            variant="filled"
            size="xl"
            radius="xl"
            aria-label="Close executive insight"
            onClick={onClose}
            styles={{
              root: {
                flexShrink: 0,
                background: 'rgba(255,205,210,0.4)',
                color: '#311b92',
                border: '1px solid rgba(255,255,255,0.45)',
                boxShadow: '0 3px 0 rgba(0,0,0,0.14)',
              },
            }}
          >
            <IconX size={22} stroke={2.2} />
          </ActionIcon>
        </Group>

        <Box
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '14px 16px 100px',
            WebkitOverflowScrolling: 'touch',
          }}
          className="plos-exec-scroll"
        >
          <div className="plos-exec-grid">
            {kpiRows.map((row, i) => (
              <ExecTile key={row.label} tone={pickTone(i)} className={row.span2 ? 'plos-exec-span-2' : undefined}>
                <Text fz={10} fw={700} tt="uppercase" style={{ opacity: 0.84, letterSpacing: '0.11em' }}>
                  {row.label}
                </Text>
                <Text fz={26} fw={900} mt={8} lh={1.05} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {row.value}
                </Text>
                <Text fz={11} mt={8} style={{ opacity: 0.78, lineHeight: 1.45 }}>
                  {row.hint}
                </Text>
              </ExecTile>
            ))}

            <ExecTile tone={pickTone(kpiRows.length)} className="plos-exec-span-2">
              <Text fz={11} fw={800} tt="uppercase" mb="md" style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                Category mix
              </Text>
              <Stack gap={10}>
                {categoryBreakdown.length === 0 ? (
                  <Text fz="sm" style={{ opacity: 0.72 }}>
                    No categories yet.
                  </Text>
                ) : (
                  categoryBreakdown.map((c) => (
                    <Box key={c.category}>
                      <Group justify="space-between" mb={4}>
                        <Text fz="sm" fw={700} tt="capitalize">
                          {c.category}
                        </Text>
                        <Text fz="sm" fw={800} style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {c.count} · {Math.round((100 * c.count) / Math.max(summary.total || 1, 1))}%
                        </Text>
                      </Group>
                      <InsightProgress
                        value={(100 * c.count) / Math.max(summary.total || 1, 1)}
                        barColor={CAT_HEX[c.category] ?? '#ffffff'}
                      />
                    </Box>
                  ))
                )}
              </Stack>
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 1)} className="plos-exec-span-2">
              <Text fz={11} fw={800} tt="uppercase" mb="md" style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                People workload
              </Text>
              {personLoad.length === 0 ? (
                <Text fz="sm" style={{ opacity: 0.72 }}>
                  Assign owners to see load bars.
                </Text>
              ) : (
                <Stack gap="sm">
                  {personLoad.slice(0, 10).map((p) => (
                    <Box key={p.name + p.relation}>
                      <Group justify="space-between" gap="xs" wrap="nowrap" mb={4}>
                        <Text fz="sm" fw={600} truncate style={{ flex: 1 }}>
                          {p.name}
                        </Text>
                        <Text fz="xs" tt="capitalize" style={{ opacity: 0.78, flexShrink: 0 }}>
                          {p.relation}
                        </Text>
                        <Text fz="sm" fw={800} style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {p.count}
                        </Text>
                      </Group>
                      <InsightProgress value={(100 * p.count) / maxPerson} barColor="#ffffff" />
                    </Box>
                  ))}
                </Stack>
              )}
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 2)} className="plos-exec-span-2">
              <Group justify="space-between" align="flex-start" mb={10}>
                <Text fz={11} fw={800} tt="uppercase" style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                  Financial exposure
                </Text>
                <Stack gap={2} ta="right">
                  <Text fz={12} fw={800} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatInr(totalOpenInr)} open
                  </Text>
                  <Text fz={11} style={{ opacity: 0.8 }}>
                    Pipeline {formatInr(pipelineInr)}
                  </Text>
                </Stack>
              </Group>
              <Text fz={12} mb={10} style={{ opacity: 0.82, lineHeight: 1.5 }}>
                Overdue ₹-block {formatInr(overdueInr)} · Today {formatInr(dueTodayInr)} · Scheduled {formatInr(pipelineInr)}
              </Text>
              {financialPressure.length > 0 ? (
                <CashflowMiniBars data={financialPressure} formatInr={formatInr} />
              ) : (
                <Text fz="sm" style={{ opacity: 0.7, marginTop: 8 }}>
                  No monthly cash-pressure series yet — INR on open rows still rolls up above.
                </Text>
              )}
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 3)} className="plos-exec-span-2">
              <Group justify="space-between" mb={10}>
                <Text fz={11} fw={800} tt="uppercase" style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                  Activity pulse · 14 days
                </Text>
                <Text fz={11} fw={700} style={{ opacity: 0.82 }}>
                  Σ {actSum} · μ {actAvg.toFixed(1)}
                </Text>
              </Group>
              <Box
                h={200}
                p="xs"
                style={{
                  borderRadius: 16,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.14)',
                }}
              >
                <ActivityLineChart series={activitySeries} variant="onDark" />
              </Box>
              {act14.length === 0 && (
                <Text fz={11} mt={8} style={{ opacity: 0.68 }}>
                  Complete items to emit a rhythm line — trend unlocks when events exist.
                </Text>
              )}
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 4)} className="plos-exec-span-2">
              <Text fz={11} fw={800} tt="uppercase" mb="sm" style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                Highest-value open items
              </Text>
              {topByAmount.length === 0 ? (
                <Text fz="sm" style={{ opacity: 0.72 }}>
                  Add amounts to responsibilities to rank exposure.
                </Text>
              ) : (
                <Table horizontalSpacing="sm" verticalSpacing={6} highlightOnHover>
                  <Table.Thead>
                    <Table.Tr style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                      <Table.Th style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>Task</Table.Th>
                      <Table.Th style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>Due</Table.Th>
                      <Table.Th style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, textAlign: 'right' }}>Amt</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {topByAmount.map((r) => (
                      <Table.Tr key={r.id} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <Table.Td>
                          <Text fz="sm" fw={600} lineClamp={2}>
                            {r.title}
                          </Text>
                          <Text fz={10} tt="capitalize" style={{ opacity: 0.65 }}>
                            {r.category}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          <Text fz="sm">{formatShortDate(r.dueDate)}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text fz="sm" fw={800} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatInr(Number(r.amount))}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 5)} className="plos-exec-span-2">
              <Text fz={11} fw={800} tt="uppercase" mb="sm" style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                Next-up queue
              </Text>
              {upcomingSorted.length === 0 ? (
                <Text fz="sm" style={{ opacity: 0.72 }}>
                  No upcoming rows — inbox is clear beyond today.
                </Text>
              ) : (
                <Stack gap={10}>
                  {upcomingSorted.map((r) => (
                    <Group key={r.id} justify="space-between" wrap="nowrap" gap="sm">
                      <Box style={{ minWidth: 0, flex: 1 }}>
                        <Text fz="sm" fw={600} truncate>
                          {r.title}
                        </Text>
                        <Text fz={10} tt="capitalize" style={{ opacity: 0.65 }}>
                          {r.category}
                          {r.person?.name ? ` · ${r.person.name}` : ''}
                        </Text>
                      </Box>
                      <Text fz="sm" fw={700} style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatShortDate(r.dueDate)}
                      </Text>
                      <Text fz="sm" fw={800} style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {r.amount != null && Number(r.amount) > 0 ? formatInr(Number(r.amount)) : '—'}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              )}
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 6)} className="plos-exec-span-2">
              <Text fz={11} fw={800} tt="uppercase" mb="sm" style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                Recently closed
              </Text>
              {recentlyCompleted.length === 0 ? (
                <Text fz="sm" style={{ opacity: 0.72 }}>
                  Nothing yet — completions will populate this ledger.
                </Text>
              ) : (
                <Table horizontalSpacing="sm" verticalSpacing={6}>
                  <Table.Thead>
                    <Table.Tr style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                      <Table.Th style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>Task</Table.Th>
                      <Table.Th style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>Closed</Table.Th>
                      <Table.Th style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>Who</Table.Th>
                      <Table.Th style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, textAlign: 'right' }}>Amt</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {recentlyCompleted.slice(0, 10).map((r) => (
                      <Table.Tr key={r.id} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <Table.Td>
                          <Text fz="sm" fw={600} lineClamp={2}>
                            {r.title}
                          </Text>
                          <Text fz={10} tt="capitalize" style={{ opacity: 0.65 }}>
                            {r.category}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          <Text fz="sm">{formatShortDate(r.completedAt ?? r.dueDate)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" truncate maw={120}>
                            {r.person?.name ?? '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text fz="sm" fw={800} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {r.amount != null && Number(r.amount) > 0 ? formatInr(Number(r.amount)) : '—'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 7)}>
              <Text fz={11} fw={800} tt="uppercase" mb={10} style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                Week check-ins
              </Text>
              <Text fz={34} fw={900} lh={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {weekActivity}
              </Text>
              <Text fz={11} mt={10} style={{ opacity: 0.78 }}>
                Rolling 7-day activity (completions + pulse).
              </Text>
            </ExecTile>

            <ExecTile tone={pickTone(kpiRows.length + 8)}>
              <Text fz={11} fw={800} tt="uppercase" mb={10} style={{ letterSpacing: '0.1em', opacity: 0.9 }}>
                Risk heat
              </Text>
              <Text fz={34} fw={900} lh={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.min(100, openNeedingAttention * 15 + summary.overdue * 10)}
              </Text>
              <Text fz={11} mt={10} style={{ opacity: 0.78 }}>
                Heuristic from overdue + items due today (not INR).
              </Text>
            </ExecTile>
          </div>

          <Group justify="flex-end" gap="sm" mt={20} px={4}>
            <Button
              variant="outline"
              radius="md"
              onClick={onClose}
              styles={{
                root: {
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.65)',
                  color: '#fff',
                  background: 'rgba(255,255,255,0.06)',
                },
              }}
            >
              Close
            </Button>
            <Button
              radius="md"
              rightSection={<IconArrowRight size={16} />}
              onClick={() => {
                onClose();
                navigate('/responsibilities');
              }}
              styles={{
                root: {
                  fontWeight: 800,
                  background: 'linear-gradient(180deg, #ffe0e8 0%, var(--pl-progress-peach) 100%)',
                  color: '#4a148c',
                  border: '1px solid rgba(255,255,255,0.75)',
                  boxShadow: '0 3px 0 rgba(0,0,0,0.12)',
                },
              }}
            >
              Open tasks
            </Button>
          </Group>
        </Box>
      </Box>
    </Modal>
  );
}

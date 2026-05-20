import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Group, Loader, Stack, Text } from '@mantine/core';
import { motion } from 'framer-motion';
import {
  IconTimeline, IconHistory, IconCalendarStats, IconChartLine,
  IconCheck, IconAlertTriangle, IconClockHour4, IconCalendarEvent,
} from '@tabler/icons-react';
import { eventService, type UserEventEntry } from '../services/event.service';
import PageHeader from '../components/PageHeader';
import { PLOS_SHADOW_CARD, useDS } from '../theme/palette';

const HERO_ACCENT = '#5e35b1';

const STATE_META: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  COMPLETED: { color: '#15803d', icon: IconCheck,           label: 'Completed' },
  OVERDUE:   { color: '#dc2626', icon: IconAlertTriangle,   label: 'Became Overdue' },
  DUE:       { color: '#b45309', icon: IconClockHour4,      label: 'Became Due' },
  UPCOMING:  { color: '#5e35b1', icon: IconCalendarEvent,   label: 'Scheduled' },
};

const CAT_COLORS: Record<string, string> = {
  finance: '#5e35b1',
  health:  '#3949ab',
  habit:   '#92400e',
  family:  '#be185d',
  admin:   '#2f4aa0',
};

const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TimelinePage = () => {
  const DS = useDS();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getFeed(150),
    staleTime: 15_000,
  });

  const events = data ?? [];

  const stats = useMemo(() => {
    const days = new Set<string>();
    let completions = 0;
    let stateChanges = 0;
    events.forEach((e) => {
      days.add(new Date(e.occurredAt).toDateString());
      if (e.toState === 'COMPLETED') completions += 1;
      stateChanges += 1;
    });
    return {
      total: events.length,
      stateChanges,
      days: days.size,
      completions,
    };
  }, [events]);

  return (
    <Box style={{ paddingBottom: 32 }} data-page="timeline">
      <PageHeader
        eyebrow="MODULE · TIMELINE"
        title="Activity History"
        subtitle={events.length === 0
          ? 'State changes will appear as you manage responsibilities.'
          : `${stats.total} events over ${stats.days} day${stats.days !== 1 ? 's' : ''}, ${stats.completions} completed.`}
        icon={IconTimeline}
        accent={HERO_ACCENT}
        metrics={[
          { label: 'Events', value: stats.total, color: HERO_ACCENT },
          { label: 'Days', value: stats.days, color: DS.green },
          { label: 'Done', value: stats.completions, color: DS.orange },
        ]}
      />

      {/* ── Quick stats ── */}
      <Grid gutter="sm" mb={16}>
        {[
          { icon: IconTimeline,      label: 'Total Events',  value: stats.total,        accent: HERO_ACCENT },
          { icon: IconHistory,       label: 'State Changes', value: stats.stateChanges, accent: '#3949ab' },
          { icon: IconCalendarStats, label: 'Days Tracked',  value: stats.days,         accent: '#6d28d9' },
          { icon: IconChartLine,     label: 'Completions',   value: stats.completions,  accent: '#2f4aa0' },
        ].map((c, i) => (
          <Grid.Col span={{ base: 6, md: 3 }} key={c.label}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
              <Box
                className="plos-stat-card plos-interactive-card"
                style={{
                  background: `linear-gradient(155deg, ${c.accent}12 0%, ${DS.surface} 56%)`,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 'var(--pl-card-radius)',
                  borderLeft: `3px solid ${c.accent}`,
                  padding: '16px 18px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: PLOS_SHADOW_CARD,
                }}
              >
                <Box aria-hidden style={{
                  position: 'absolute', top: -22, right: -22,
                  width: 110, height: 110, borderRadius: '50%',
                  background: `radial-gradient(circle, ${c.accent}18 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
                <Group gap={6} mb={8}>
                  <c.icon size={13} stroke={1.5} style={{ color: c.accent, opacity: 0.85 }} />
                  <Text className="plos-stat-card-label">{c.label}</Text>
                </Group>
                <Text className="plos-stat-card-value" style={{ fontSize: 30, fontWeight: 800, color: DS.text1, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.value}</Text>
              </Box>
            </motion.div>
          </Grid.Col>
        ))}
      </Grid>

      {/* ── Event feed ── */}
      <Box style={{
        background: DS.surface,
        border: `1px solid ${DS.border}`,
        borderRadius: 'var(--pl-card-radius)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: PLOS_SHADOW_CARD,
      }}>
        <Box aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${HERO_ACCENT}, ${HERO_ACCENT}55)`,
        }} />
        <Box aria-hidden style={{
          position: 'absolute',
          top: -60, right: -60, width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${HERO_ACCENT}0d 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
        <Box style={{ padding: '14px 20px', borderBottom: `1px solid ${DS.border}`, position: 'relative' }}>
          <Text fw={500} className="plos-section-header">Activity Feed</Text>
          <Text size="xs" style={{ color: DS.text2, marginTop: 2 }}>Newest first — every change recorded by the scheduler or by you</Text>
        </Box>

        {isLoading ? (
          <Box h={200} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader color="violet" size="sm" type="dots" />
          </Box>
        ) : isError ? (
          <Text size="sm" style={{ color: DS.red, padding: 16 }}>
            Failed to load timeline.
            {error instanceof Error && error.message ? ` ${error.message}` : ''}
            {' '}
            If the API is on another host, set VITE_API_BASE_URL or use dev with the Vite /api proxy (see .env.example).
          </Text>
        ) : events.length === 0 ? (
          <Box className="plos-empty-panel">
            <Text fw={600} className="plos-empty-panel-title" style={{ marginBottom: 6 }}>No events yet</Text>
            <Text className="plos-empty-panel-sub" style={{ fontSize: '0.8rem' }}>
              As you create and complete responsibilities, every state change will appear here.
            </Text>
          </Box>
        ) : (
          <Stack gap={0}>
            {events.map((e: UserEventEntry, idx) => {
              const meta = STATE_META[e.toState] ?? STATE_META.UPCOMING;
              const catColor = CAT_COLORS[e.responsibility.category] ?? '#5a7d68';
              const Icon = meta.icon;
              return (
                <Group
                  key={e.id}
                  gap={14}
                  wrap="nowrap"
                  style={{
                    padding: '14px 20px',
                    borderBottom: idx < events.length - 1 ? `1px solid ${DS.border}` : 'none',
                    background: idx % 2 === 1 ? DS.elev : 'transparent',
                  }}
                >
                  {/* Timeline rail dot */}
                  <Box style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    <Box style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `${meta.color}18`, border: `1px solid ${meta.color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 12px ${meta.color}30`,
                    }}>
                      <Icon size={13} stroke={2} style={{ color: meta.color }} />
                    </Box>
                  </Box>

                  {/* Event content */}
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={8} wrap="nowrap">
                      <Text fw={600} size="sm" style={{ color: DS.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.responsibility.title}
                      </Text>
                      <Box style={{
                        padding: '1px 7px', borderRadius: 4,
                        background: `${meta.color}18`, border: `1px solid ${meta.color}33`,
                        flexShrink: 0,
                      }}>
                        <Text style={{ fontSize: '0.58rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {meta.label}
                        </Text>
                      </Box>
                    </Group>
                    <Group gap={10} mt={4} wrap="nowrap">
                      <Group gap={4}>
                        <Box style={{ width: 5, height: 5, borderRadius: '50%', background: catColor }} />
                        <Text style={{ fontSize: '0.68rem', color: DS.text2, textTransform: 'capitalize' }}>
                          {e.responsibility.category}
                        </Text>
                      </Group>
                      {e.responsibility.person && (
                        <Text style={{ fontSize: '0.68rem', color: DS.text2, fontWeight: 600 }}>
                          → {e.responsibility.person.name}
                        </Text>
                      )}
                      {e.responsibility.amount != null && (
                        <Text style={{ fontSize: '0.68rem', color: catColor, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          ₹{Number(e.responsibility.amount).toLocaleString('en-IN')}
                        </Text>
                      )}
                      <Text style={{ fontSize: '0.65rem', color: DS.text2 }}>
                        {e.fromState} → {e.toState}
                      </Text>
                    </Group>
                  </Box>

                  {/* Time */}
                  <Box style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Text style={{ fontSize: '0.7rem', color: DS.text2, fontVariantNumeric: 'tabular-nums' }}>
                      {formatRelative(e.occurredAt)}
                    </Text>
                    <Text style={{ fontSize: '0.6rem', color: DS.text2, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                      {new Date(e.occurredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Box>
                </Group>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default TimelinePage;

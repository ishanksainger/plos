import { useMemo, useState } from 'react';
import { Box, Grid, Group, Loader, Stack, Text } from '@mantine/core';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  IconActivity, IconFlame, IconPlus, IconRepeat, IconTrophy, type Icon,
} from '@tabler/icons-react';
import { responsibilityService } from '../services/responsibility.service';
import type { Responsibility } from '../types/dashboard';
import ResponsibilityCard from './responsibilities/ResponsibilityCard';
import CreateResponsibilityModal from './responsibilities/CreateResponsibilityModal';
import PageHeader from './PageHeader';
import { PLOS_SHADOW_CARD, useDS } from '../theme/palette';

/**
 * CategoryModulePage
 * ─────────────────────────────────────────────────────────────
 * Shared shell for the Finance/Health/Habits modules. Loads all
 * responsibilities for the user filtered by `category`, renders
 * a flat hero, KPI strip, and an interactive list. Each consumer
 * just provides labels, accent color, and module-specific stat logic.
 */

export interface CategoryStat {
  label: string;
  Icon: Icon;
  /** Picks the value out of the filtered responsibilities. */
  compute: (rows: Responsibility[]) => string | number;
  accent: string;
  /** Optional value color (e.g. accent for currency KPIs). */
  valueColor?: string;
  /** Left accent strip on stat card (semantic). */
  stripColor?: string;
}

interface CategoryModulePageProps {
  category: string;
  title: string;
  subtitle: string;
  moduleLabel: string;
  accent: string;
  stats: CategoryStat[];
}

const CategoryModulePage = ({
  category, title, subtitle, moduleLabel, accent, stats,
}: CategoryModulePageProps) => {
  const DS = useDS();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Responsibility | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 15_000,
  });

  const filtered = useMemo(
    () => (data ?? []).filter((r) => r.category === category),
    [data, category],
  );

  const streaksQuery = useQuery({
    queryKey: ['habits', 'streaks'],
    queryFn: () => responsibilityService.getHabitStreaks(),
    enabled: category === 'habit',
    staleTime: 30_000,
  });

  const streakById = useMemo(() => {
    if (!streaksQuery.data?.items?.length) return {} as Record<number, number>;
    return Object.fromEntries(streaksQuery.data.items.map((i) => [i.id, i.streak]));
  }, [streaksQuery.data]);

  const displayStats = useMemo((): CategoryStat[] => {
    if (category !== 'habit') return stats;
    const m = streaksQuery.data;
    const active = (rows: Responsibility[]) =>
      rows.filter((r) => r.recurrence && r.recurrence !== 'none' && !r.completedAt).length;
    return [
      {
        label: 'Active habits',
        Icon: IconRepeat,
        accent,
        stripColor: accent,
        compute: active,
      },
      {
        label: 'Best streak',
        Icon: IconFlame,
        accent,
        stripColor: 'var(--success)',
        compute: () => (m ? m.maxStreak : '—'),
      },
      {
        label: '7-day check-ins',
        Icon: IconActivity,
        accent,
        stripColor: 'var(--secondary)',
        compute: () => (m ? m.completionsLast7Days : '—'),
      },
      {
        label: 'Total',
        Icon: IconTrophy,
        accent,
        stripColor: accent,
        compute: (rows) => rows.length,
      },
    ];
  }, [category, stats, streaksQuery.data, accent]);

  const completeMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.markComplete(id),
    onMutate: (id) => setCompletingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (category === 'habit') queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
      notifications.show({ title: 'Done ✓', message: 'Marked as complete.', color: 'teal' });
      setCompletingId(null);
    },
    onError: () => {
      setCompletingId(null);
      notifications.show({ title: 'Error', message: 'Failed to complete', color: 'red' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.deleteOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (category === 'habit') queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
      notifications.show({ title: 'Deleted', message: 'Responsibility removed.', color: 'violet' });
    },
    onError: () => notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' }),
  });

  return (
    <Box style={{ paddingBottom: 32 }} data-pm-category={category}>
      <CreateResponsibilityModal
        opened={createOpen || editing != null}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />

      <PageHeader
        eyebrow={moduleLabel}
        title={title}
        subtitle={subtitle}
        icon={displayStats[0]?.Icon ?? IconTrophy}
        accent={accent}
        metrics={[
          { label: 'Total', value: filtered.length, color: accent },
          { label: 'Active', value: filtered.filter((r) => !r.completedAt).length, color: DS.orange },
          { label: 'Done', value: filtered.filter((r) => !!r.completedAt).length, color: DS.green },
          ...(category === 'habit' && streaksQuery.data
            ? [{ label: 'Best streak', value: streaksQuery.data.maxStreak, color: DS.purple }]
            : []),
        ]}
        action={(
          <motion.button
            className="plos-btn-accent"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCreateOpen(true)}
            style={{
              alignItems: 'center',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'flex',
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              gap: 8,
              letterSpacing: '-0.01em',
              padding: '11px 22px',
            }}
          >
            <IconPlus size={15} stroke={2.5} />
            Add Item
          </motion.button>
        )}
      />

      {category === 'habit' && streaksQuery.isError && (
        <Text mb="sm" size="xs" style={{ color: DS.red }}>
          Streaks could not be loaded (list below still works).
        </Text>
      )}

      {/* ── KPI strip · flat elevated cards ── */}
      <Grid gutter="sm" mb={16}>
        {displayStats.map((s, i) => (
          <Grid.Col span={{ base: 6, md: 3 }} key={s.label}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
              <Box
                className="plos-stat-card plos-interactive-card"
                style={{
                  background: `linear-gradient(155deg, ${s.accent}12 0%, ${DS.surface} 58%)`,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 'var(--pl-card-radius)',
                  borderLeft: `3px solid ${s.stripColor ?? s.accent}`,
                  padding: '16px 18px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: PLOS_SHADOW_CARD,
                }}
              >
                <Box aria-hidden style={{
                  position: 'absolute', top: -22, right: -22,
                  width: 110, height: 110, borderRadius: '50%',
                  background: `radial-gradient(circle, ${s.accent}18 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
                <Group gap={6} mb={8}>
                  <s.Icon size={13} stroke={1.5} style={{ color: s.accent, opacity: 0.85 }} />
                  <Text className="plos-stat-card-label">{s.label}</Text>
                </Group>
                <Text
                  className="plos-stat-card-value"
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: s.valueColor ?? DS.text1,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.compute(filtered)}
                </Text>
              </Box>
            </motion.div>
          </Grid.Col>
        ))}
      </Grid>

      {/* ── List ── */}
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
          background: `linear-gradient(90deg, ${accent}, ${accent}55)`,
        }} />
        <Box aria-hidden style={{
          position: 'absolute',
          top: -60, right: -60, width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}0d 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
        <Box style={{ padding: '14px 20px', borderBottom: `1px solid ${DS.border}`, position: 'relative' }}>
          <Text fw={500} className="plos-section-header" style={{ color: DS.text1 }}>{title.replace(/\n/g, ' ')} — All Items</Text>
          <Text
            size="xs"
            className={category === 'habit' ? 'plos-habit-module-count' : undefined}
            style={{ color: DS.text2, marginTop: 2 }}
          >
            {filtered.length} responsibilit{filtered.length === 1 ? 'y' : 'ies'} in this module
          </Text>
        </Box>

        {isLoading ? (
          <Box h={200} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader color="violet" size="sm" type="dots" />
          </Box>
        ) : isError ? (
          <Text size="sm" style={{ color: DS.red, padding: 16 }}>
            Failed to load responsibilities.
            {error instanceof Error && error.message ? ` ${error.message}` : ''}
            {' '}
            If you opened the app from another device, set <code style={{ fontSize: '0.75rem' }}>VITE_API_BASE_URL</code> or use dev with the Vite proxy (see <code style={{ fontSize: '0.75rem' }}>.env.example</code>).
          </Text>
        ) : filtered.length === 0 ? (
          <Box className="plos-empty-panel">
            <Text fw={600} className="plos-empty-panel-title" style={{ marginBottom: 6 }}>
              Nothing here yet
            </Text>
            <Text className="plos-empty-panel-sub" style={{ fontSize: '0.8rem' }}>
              Add a {category} responsibility to start tracking.
            </Text>
          </Box>
        ) : (
          <Stack gap={6} p={12}>
            {filtered.map((r) => (
              <ResponsibilityCard
                key={r.id}
                responsibility={r}
                onComplete={(id) => completeMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={(row) => setEditing(row)}
                isCompleting={completingId === r.id}
                streakDays={category === 'habit' ? streakById[r.id] : undefined}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default CategoryModulePage;

import { useState } from 'react';
import { ActionIcon, Box, Group, Loader, Select, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconAlertTriangle, IconCalendarEvent, IconCheck, IconClockHour4,
  IconFilter, IconList, IconPlus,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AnimatePresence, motion } from 'framer-motion';
import { responsibilityService } from '../services/responsibility.service';
import ResponsibilityCard from '../components/responsibilities/ResponsibilityCard';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';
import PageHeader from '../components/PageHeader';
import type { Responsibility } from '../types/dashboard';
import { useDS } from '../theme/palette';

const STATE_TABS = [
  { value: 'ALL',       label: 'All',      icon: IconList,           color: '#7c4fff' },
  { value: 'OVERDUE',   label: 'Overdue',  icon: IconAlertTriangle,  color: '#dc2626' },
  { value: 'DUE',       label: 'Due',      icon: IconClockHour4,     color: '#b45309' },
  { value: 'UPCOMING',  label: 'Upcoming', icon: IconCalendarEvent,  color: '#5e35b1' },
  { value: 'COMPLETED', label: 'Done',     icon: IconCheck,          color: '#15803d' },
];

const CATEGORY_OPTIONS = [
  { value: '',        label: 'All Categories' },
  { value: 'finance', label: 'Finance'   },
  { value: 'health',  label: 'Health'    },
  { value: 'habit',   label: 'Habit'     },
  { value: 'family',  label: 'Family'    },
  { value: 'admin',   label: 'Admin'     },
];

const ResponsibilitiesPage = () => {
  const DS = useDS();
  const queryClient = useQueryClient();
  const [stateFilter, setStateFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string | null>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Responsibility | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const { data: allResponsibilities, isLoading, isError, error } = useQuery({
    queryKey: ['responsibilities'],
    queryFn: () => responsibilityService.getAll(),
    staleTime: 15_000,
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.markComplete(id),
    onMutate: (id) => setCompletingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
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
      notifications.show({ title: 'Deleted', message: 'Responsibility removed.', color: 'violet' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete', color: 'red' });
    },
  });

  const filtered = (allResponsibilities ?? []).filter((r: Responsibility) => {
    if (stateFilter !== 'ALL' && r.state !== stateFilter) return false;
    if (categoryFilter && r.category !== categoryFilter) return false;
    return true;
  });

  const counts = (allResponsibilities ?? []).reduce(
    (acc: Record<string, number>, r: Responsibility) => {
      const s = r.state ?? 'UPCOMING';
      acc[s] = (acc[s] ?? 0) + 1;
      acc.ALL = (acc.ALL ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Box style={{ paddingBottom: 32 }}>
      <CreateResponsibilityModal
        opened={createOpen || editing != null}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />

      <PageHeader
        eyebrow="OVERVIEW · RESPONSIBILITIES"
        title="Your Responsibilities"
        subtitle={(counts.ALL ?? 0) === 0
          ? 'Create your first responsibility to get started.'
          : `${counts.ALL ?? 0} total across all categories, grouped by urgency and category.`}
        icon={IconList}
        accent={DS.accent}
        metrics={[
          { label: 'Overdue', value: counts.OVERDUE ?? 0, color: DS.red },
          { label: 'Due today', value: counts.DUE ?? 0, color: DS.orange },
          { label: 'Upcoming', value: counts.UPCOMING ?? 0, color: DS.accent },
          { label: 'Done', value: counts.COMPLETED ?? 0, color: DS.green },
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
            Add New
          </motion.button>
        )}
      />

      {/* ── Filter Bar ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Box
          style={{
            background: DS.surface,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <Group justify="space-between" wrap="wrap" gap={10}>
            {/* State tabs */}
            <Group gap={4}>
              {STATE_TABS.map(({ value, label, icon: Icon, color }) => {
                const count = counts[value] ?? 0;
                const isActive = stateFilter === value;
                return (
                  <motion.button
                    key={value}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setStateFilter(value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                      border: isActive ? '1px solid transparent' : `1px solid ${color}26`,
                      background: isActive ? color : `${color}0c`,
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={12} stroke={isActive ? 2.2 : 1.7} style={{ color: isActive ? '#ffffff' : color }} />
                    <Text style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? '#ffffff' : color }}>
                      {label}
                    </Text>
                    {count > 0 && (
                      <Box style={{ padding: '0 5px', borderRadius: 4, background: isActive ? 'rgba(255,255,255,0.22)' : DS.border, minWidth: 18, textAlign: 'center' }}>
                        <Text style={{ fontSize: '0.6rem', fontWeight: 800, color: isActive ? '#ffffff' : color }}>{count}</Text>
                      </Box>
                    )}
                  </motion.button>
                );
              })}
            </Group>

            {/* Category filter */}
            <Group gap={6}>
              <Tooltip label="Filter" withArrow>
                <ActionIcon variant="subtle" size="sm" style={{ color: DS.text3 }}>
                  <IconFilter size={13} />
                </ActionIcon>
              </Tooltip>
              <Select
                placeholder="All Categories"
                data={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={setCategoryFilter}
                size="xs"
                w={150}
                clearable={false}
                styles={{
                  input: { background: DS.elev, border: `1px solid ${DS.border}`, color: DS.text1, fontSize: '0.75rem' },
                  dropdown: { background: DS.surface, border: `1px solid ${DS.border}` },
                  option: { color: DS.text1, fontSize: '0.75rem' },
                }}
              />
            </Group>
          </Group>
        </Box>
      </motion.div>

      {/* ── List ── */}
      {isLoading ? (
        <Box h="40vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack align="center" gap={8}>
            <Loader color="violet" size="sm" type="dots" />
            <Text style={{ fontSize: '0.65rem', color: DS.text3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Loading</Text>
          </Stack>
        </Box>
      ) : isError ? (
        <Text size="sm" style={{ color: DS.red, padding: 16 }}>
          Failed to load responsibilities.
          {error instanceof Error && error.message ? ` ${error.message}` : ''}
          {' '}
          If this is not localhost, set VITE_API_BASE_URL or use dev with the Vite /api proxy (see .env.example).
        </Text>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Box
            className="plos-empty-panel"
            style={{
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: 12,
              padding: '48px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Box style={{ width: 48, height: 48, borderRadius: '50%', background: `${DS.accent}12`, border: `1px solid ${DS.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconList size={20} stroke={1.5} style={{ color: DS.accent, opacity: 0.7 }} />
            </Box>
            <Text fw={600} className="plos-empty-panel-title">
              {stateFilter === 'ALL' && !categoryFilter ? 'No responsibilities yet' : 'No matches for this filter'}
            </Text>
            <Text className="plos-empty-panel-sub" style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: 320 }}>
              {stateFilter === 'ALL' && !categoryFilter
                ? 'Add your first responsibility to start tracking your life.'
                : 'Try a different filter or add a new responsibility.'}
            </Text>
            {stateFilter === 'ALL' && !categoryFilter && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setCreateOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, marginTop: 4,
                  background: `${DS.accent}18`, color: DS.accent,
                  border: `1px solid ${DS.accent}40`, borderRadius: 8,
                  padding: '9px 18px', fontSize: '0.8125rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <IconPlus size={14} stroke={2.5} />
                Create your first
              </motion.button>
            )}
          </Box>
        </motion.div>
      ) : (
        <Stack gap={6}>
          <AnimatePresence mode="popLayout">
            {filtered.map((r: Responsibility, i: number) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.04, 0.3) }}
              >
                <ResponsibilityCard
                  responsibility={r}
                  onComplete={(id) => completeMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onEdit={(row) => setEditing(row)}
                  isCompleting={completingId === r.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </Stack>
      )}
    </Box>
  );
};

export default ResponsibilitiesPage;

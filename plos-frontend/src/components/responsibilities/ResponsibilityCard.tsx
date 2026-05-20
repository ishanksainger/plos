import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import {
  IconAlertTriangle, IconCalendarEvent, IconCheck, IconClockHour4, IconFlame, IconPencil, IconTrash,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import type { Responsibility, ResponsibilityState } from '../../types/dashboard';
import { useDS } from '../../theme/palette';

const CAT_COLORS: Record<string, string> = {
  finance: '#5e35b1',
  health:  '#166534',
  habit:   '#92400e',
  family:  '#be185d',
  admin:   '#3949ab',
};

interface Props {
  responsibility: Responsibility & { state?: ResponsibilityState };
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  /** Opens edit modal with this row when provided. */
  onEdit?: (r: Responsibility & { state?: ResponsibilityState }) => void;
  isCompleting?: boolean;
  /** Current completion streak (habit module); shown when greater than zero. */
  streakDays?: number;
}

const ResponsibilityCard = ({ responsibility: r, onComplete, onDelete, onEdit, isCompleting, streakDays }: Props) => {
  const DS = useDS();
  const STATE_META = {
    OVERDUE:   { color: DS.red, icon: IconAlertTriangle,  label: 'Overdue',   leftBar: DS.red },
    DUE:       { color: DS.orange, icon: IconClockHour4,     label: 'Due Today', leftBar: DS.orange },
    UPCOMING:  { color: '#7e57c2', icon: IconCalendarEvent,  label: 'Upcoming',  leftBar: '#7e57c2' },
    COMPLETED: { color: DS.green, icon: IconCheck,          label: 'Completed', leftBar: DS.green },
  } as const;

  const state = (r.state ?? 'UPCOMING') as keyof typeof STATE_META;
  const meta = STATE_META[state] ?? STATE_META.UPCOMING;
  const isCompleted = state === 'COMPLETED';
  const catColor = CAT_COLORS[r.category] ?? DS.accent;
  const cardSurface = DS.surface;
  const cardHoverSurface = DS.elev;

  const dueLabel = new Date(r.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: r.dueDate.startsWith(String(new Date().getFullYear())) ? undefined : '2-digit',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -28, scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <Box
        style={{
          background: DS.surface,
          border: `1px solid ${DS.border}`,
          borderLeft: `2px solid ${meta.leftBar}`,
          borderRadius: 10,
          padding: '13px 16px',
          opacity: isCompleted ? 0.82 : 1,
          transition: 'box-shadow 0.2s, background 0.15s',
          cursor: 'default',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = cardHoverSurface; e.currentTarget.style.boxShadow = `0 4px 20px rgba(109, 40, 217, 0.12)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = cardSurface; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <Group justify="space-between" wrap="nowrap" align="center">
          {/* Status + info */}
          <Group gap={12} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            {/* Status pill */}
            <Box
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                padding: '3px 9px', borderRadius: 5,
                background: state === 'UPCOMING' ? 'var(--accent-dim)' : `${meta.color}18`,
                border: state === 'UPCOMING' ? '1px solid var(--border-accent)' : `1px solid ${meta.color}33`,
              }}
            >
              <Box style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color }} />
              <Text style={{ fontSize: '0.59rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {meta.label}
              </Text>
            </Box>

            {/* Title + meta */}
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Text
                fw={600}
                size="sm"
                style={{
                  color: DS.text1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  textDecorationColor: DS.text3,
                }}
              >
                {r.title}
              </Text>
              <Group gap={8} mt={3} wrap="nowrap">
                <Group gap={4} wrap="nowrap">
                  <Box style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                  <Text style={{ fontSize: '0.68rem', color: catColor, textTransform: 'capitalize', fontWeight: 700 }}>
                    {r.category}
                  </Text>
                </Group>
                {r.person && (
                  <Text style={{ fontSize: '0.68rem', color: DS.text2 }}>→ {r.person.name}</Text>
                )}
                {r.amount && (
                  <Text style={{ fontSize: '0.68rem', color: catColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{Number(r.amount).toLocaleString('en-IN')}
                  </Text>
                )}
                {r.recurrence && r.recurrence !== 'none' && (
                  <Box style={{ padding: '1px 6px', borderRadius: 3, background: `${DS.purple}18`, border: `1px solid ${DS.purple}30` }}>
                    <Text style={{ fontSize: '0.59rem', color: DS.purple, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {r.recurrence}
                    </Text>
                  </Box>
                )}
                {typeof streakDays === 'number' && streakDays > 0 && (
                  <Group gap={4} wrap="nowrap">
                    <IconFlame size={12} stroke={1.8} style={{ color: DS.purple, flexShrink: 0 }} />
                    <Text style={{ fontSize: '0.68rem', color: DS.purple, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {streakDays}d streak
                    </Text>
                  </Group>
                )}
              </Group>
            </Box>
          </Group>

          {/* Date + Actions */}
          <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Text
              style={{
                fontSize: '0.72rem',
                color: state === 'OVERDUE' ? DS.red : DS.text2,
                fontWeight: state === 'OVERDUE' ? 600 : 400,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {dueLabel}
            </Text>

            {!isCompleted && (
              <Tooltip label="Mark complete" withArrow position="top">
                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    radius="xl"
                    loading={isCompleting}
                    onClick={() => onComplete(r.id)}
                    style={{ color: 'var(--accent)', border: '1px solid var(--border-accent)', background: 'var(--accent-dim)' }}
                  >
                    <IconCheck size={12} stroke={2.5} />
                  </ActionIcon>
                </motion.div>
              </Tooltip>
            )}

            {onEdit && (
              <Tooltip label="Edit" withArrow position="top">
                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    radius="xl"
                    onClick={() => onEdit(r)}
                    style={{ color: DS.text2, border: `1px solid ${DS.border}`, background: DS.elev }}
                  >
                    <IconPencil size={12} stroke={1.8} />
                  </ActionIcon>
                </motion.div>
              </Tooltip>
            )}

            <Tooltip label="Delete" withArrow position="top">
              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  radius="xl"
                  onClick={() => onDelete(r.id)}
                  style={{ color: DS.red, border: `1px solid ${DS.red}30`, background: `${DS.red}08` }}
                >
                  <IconTrash size={12} stroke={1.5} />
                </ActionIcon>
              </motion.div>
            </Tooltip>
          </Group>
        </Group>
      </Box>
    </motion.div>
  );
};

export default ResponsibilityCard;

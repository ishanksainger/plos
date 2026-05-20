import { Box, Stack, Text } from '@mantine/core';
import type { TodayEvent } from '../../types/today';
import { useDS } from '../../theme/palette';
import { RECURRING_NOTE_PREFIX } from '../../utils/event-labels';

interface DiaryFeedProps {
  events: TodayEvent[];
}

/**
 * Reverse-chronological activity lines for the Today diary section.
 */
export function DiaryFeed({ events }: DiaryFeedProps) {
  const DS = useDS();

  if (events.length === 0) {
    return (
      <Text fz="sm" style={{ color: DS.text3 }}>
        Your diary will fill in as you complete tasks and check in on habits.
      </Text>
    );
  }

  return (
    <Stack gap={10}>
      {events.map((e) => {
        const time = new Date(e.occurredAt).toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        });
        const isComplete =
          e.toState === 'COMPLETED' || (e.note?.startsWith(RECURRING_NOTE_PREFIX) ?? false);
        const dot = isComplete ? '🟢' : '🔵';
        const amount =
          e.responsibility.amount != null
            ? ` · ₹${Number(e.responsibility.amount).toLocaleString('en-IN')}`
            : '';

        return (
          <Box
            key={e.id}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: `1px solid ${DS.border}`,
              background: '#fff',
            }}
          >
            <Text fz="sm" style={{ color: DS.text1, lineHeight: 1.45 }}>
              <Text span fw={700} style={{ color: DS.text2 }}>
                {dot} {time}
              </Text>
              {' — '}
              {labelForEvent(e)}
              <Text span fw={600}>
                {e.responsibility.title}
              </Text>
              {amount}
            </Text>
          </Box>
        );
      })}
    </Stack>
  );
}

function labelForEvent(e: TodayEvent): string {
  if (e.note?.startsWith(RECURRING_NOTE_PREFIX)) return 'Habit checked: ';
  if (e.toState === 'COMPLETED') return "You completed '";
  if (e.toState === 'OVERDUE') return 'Moved to overdue: ';
  if (e.toState === 'DUE') return 'Due today: ';
  return 'Updated: ';
}

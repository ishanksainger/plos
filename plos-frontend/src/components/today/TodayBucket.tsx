import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { Responsibility } from '../../types/dashboard';
import { useDS } from '../../theme/palette';

export type TodayBucketVariant = 'overdue' | 'due' | 'upcoming';

const VARIANT_STYLES: Record<
  TodayBucketVariant,
  { title: string; accent: string; bg: string; border: string }
> = {
  overdue: {
    title: 'Overdue',
    accent: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.06)',
    border: 'rgba(220, 38, 38, 0.22)',
  },
  due: {
    title: 'Due today',
    accent: '#B45309',
    bg: 'rgba(180, 83, 9, 0.08)',
    border: 'rgba(180, 83, 9, 0.24)',
  },
  upcoming: {
    title: 'Next 7 days',
    accent: '#5b4788',
    bg: 'rgba(124, 79, 255, 0.06)',
    border: 'rgba(124, 79, 255, 0.16)',
  },
};

interface TodayBucketProps {
  variant: TodayBucketVariant;
  items: Responsibility[];
  completingId: number | null;
  onComplete: (id: number) => void;
}

/**
 * Column of responsibilities for one Today bucket with one-tap complete.
 */
export function TodayBucket({ variant, items, completingId, onComplete }: TodayBucketProps) {
  const DS = useDS();
  const style = VARIANT_STYLES[variant];

  return (
    <Box
      className="plos-studio-card"
      style={{
        padding: '18px 16px 14px',
        background: style.bg,
        borderColor: style.border,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Group justify="space-between" mb={12}>
        <Text fw={800} fz="sm" style={{ color: style.accent, letterSpacing: '-0.02em' }}>
          {style.title}
        </Text>
        <Text fz="xs" fw={700} style={{ color: DS.text3 }}>
          {items.length}
        </Text>
      </Group>

      {items.length === 0 ? (
        <Text fz="sm" style={{ color: DS.text3, lineHeight: 1.45 }}>
          {variant === 'overdue' ? 'Nothing overdue — nice.' : variant === 'due' ? 'Clear for today.' : 'Nothing queued this week.'}
        </Text>
      ) : (
        <Stack gap={10}>
          {items.map((r) => (
            <Box
              key={r.id}
              style={{
                padding: '12px 12px',
                borderRadius: 14,
                border: `1px solid ${DS.border}`,
                background: '#fff',
              }}
            >
              <Text fw={700} fz="sm" lineClamp={2} style={{ color: DS.text1, marginBottom: 6 }}>
                {r.title}
              </Text>
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Text fz="xs" tt="capitalize" style={{ color: DS.text2 }}>
                  {r.category}
                  {r.amount != null ? ` · ₹${Number(r.amount).toLocaleString('en-IN')}` : ''}
                </Text>
                <Button
                  size="compact-xs"
                  variant="light"
                  color={variant === 'overdue' ? 'red' : variant === 'due' ? 'orange' : 'violet'}
                  leftSection={<IconCheck size={14} />}
                  loading={completingId === r.id}
                  onClick={() => onComplete(r.id)}
                >
                  Done
                </Button>
              </Group>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

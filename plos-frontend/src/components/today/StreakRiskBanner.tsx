import { Box, Group, Text } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import type { StreakAtRisk } from '../../types/today';

interface StreakRiskBannerProps {
  items: StreakAtRisk[];
}

/**
 * Warns when habit streaks are active but today has no check-in yet.
 */
export function StreakRiskBanner({ items }: StreakRiskBannerProps) {
  if (items.length === 0) return null;

  return (
    <Box
      style={{
        borderRadius: 'var(--pl-card-radius)',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, rgba(124,79,255,0.12) 0%, rgba(190,24,93,0.08) 100%)',
        border: '1px solid rgba(124, 79, 255, 0.22)',
      }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <IconFlame size={22} color="#7c4fff" style={{ flexShrink: 0, marginTop: 2 }} />
        <Box style={{ minWidth: 0 }}>
          <Text fw={800} fz="sm" style={{ color: '#3a1f6e' }}>
            Streaks at risk
          </Text>
          <Text fz="xs" mt={4} style={{ color: '#584a84', lineHeight: 1.45 }}>
            {items.map((s) => `${s.title} (${s.streakLength}-day streak)`).join(' · ')}
          </Text>
        </Box>
      </Group>
    </Box>
  );
}

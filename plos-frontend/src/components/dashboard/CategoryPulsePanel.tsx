import { Box, Group, Stack, Text } from '@mantine/core';
import { PL_PALETTE } from '../../theme/palette';

const P = PL_PALETTE;

const CAT_PALETTE = [
  '#7c4fff',
  '#3949ab',
  '#15803d',
  '#be185d',
  '#b45309',
];

export interface CategoryPulsePanelProps {
  outstandingInr: number;
  completionRate: number;
  momentumScore: number;
  summaryTotal: number;
  summaryCompleted: number;
  summaryUpcoming: number;
  categoryBreakdown: { category: string; count: number }[];
}

const inrFmt = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
};

/**
 * Redesigned Category Pulse card — gradient header with completion %, horizontal category bars, stats footer.
 */
export function CategoryPulsePanel({
  outstandingInr,
  completionRate,
  summaryTotal,
  summaryCompleted,
  summaryUpcoming,
  categoryBreakdown,
}: CategoryPulsePanelProps) {
  const topCats = [...categoryBreakdown]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCount = Math.max(...topCats.map((c) => c.count), 1);

  return (
    <Box
      style={{
        borderRadius: 'var(--pl-card-radius)',
        background: P.surface,
        border: `1px solid ${P.border}`,
        boxShadow: 'var(--pl-shadow-card)',
        overflow: 'hidden',
      }}
    >
      {/* ── Gradient header ── */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #5028cc 0%, #7c4fff 55%, #a47bff 100%)',
          padding: '16px 18px 18px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* subtle ring decoration */}
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            right: -24,
            top: -24,
            width: 96,
            height: 96,
            borderRadius: '50%',
            border: '20px solid rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />

        <Text
          fz={10}
          fw={700}
          tt="uppercase"
          style={{ color: 'rgba(255,255,255,0.86)', letterSpacing: '0.1em' }}
        >
          Category pulse
        </Text>

        <Group justify="space-between" align="flex-end" mt={8} wrap="nowrap">
          <Box>
            <Text
              fz={36}
              fw={900}
              lh={1}
              style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}
            >
              {completionRate}%
            </Text>
            <Text fz={11} mt={3} style={{ color: 'rgba(255,255,255,0.9)' }}>
              completion ratio
            </Text>
          </Box>
          <Box ta="right">
            <Text fz={15} fw={800} style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {inrFmt(outstandingInr)}
            </Text>
            <Text fz={10} style={{ color: 'rgba(255,255,255,0.86)', marginTop: 2 }}>
              outstanding
            </Text>
          </Box>
        </Group>
      </Box>

      {/* ── Category breakdown bars ── */}
      <Box style={{ padding: '14px 18px 0' }}>
        <Text
          fz={10}
          fw={700}
          tt="uppercase"
          mb={10}
          style={{ color: P.text3, letterSpacing: '0.08em' }}
        >
          By category
        </Text>

        {topCats.length === 0 ? (
          <Text fz="sm" c="dimmed" py={12}>
            No categories yet.
          </Text>
        ) : (
          <Stack gap={9}>
            {topCats.map((cat, i) => {
              const pct = Math.round((cat.count / maxCount) * 100);
              const color = CAT_PALETTE[i % CAT_PALETTE.length];
              return (
                <Box key={cat.category}>
                  <Group justify="space-between" mb={4} wrap="nowrap">
                    <Text
                      fz={12}
                      fw={600}
                      truncate
                      style={{ color: P.text1, flex: 1, minWidth: 0 }}
                    >
                      {cat.category}
                    </Text>
                    <Text
                      fz={11}
                      fw={800}
                      style={{ color, marginLeft: 8, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {cat.count}
                    </Text>
                  </Group>
                  <Box style={{ height: 5, background: '#f0eeff', borderRadius: 3 }}>
                    <Box
                      style={{
                        height: 5,
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                        borderRadius: 3,
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* ── Stats footer ── */}
      <Group
        justify="space-around"
        mx={18}
        mt={16}
        mb={16}
        pt={14}
        style={{ borderTop: `1px solid ${P.border}` }}
      >
        {[
          { label: 'Total', value: summaryTotal, color: P.text1 },
          { label: 'Done', value: summaryCompleted, color: P.green },
          { label: 'Soon', value: summaryUpcoming, color: '#7c4fff' },
        ].map(({ label, value, color }) => (
          <Box key={label} ta="center">
            <Text
              fz={20}
              fw={900}
              lh={1}
              style={{ color, fontVariantNumeric: 'tabular-nums' }}
            >
              {value}
            </Text>
            <Text
              fz={10}
              fw={700}
              tt="uppercase"
              mt={3}
              style={{ color: P.text3, letterSpacing: '0.06em' }}
            >
              {label}
            </Text>
          </Box>
        ))}
      </Group>
    </Box>
  );
}

import { Box, Group, Stack, Text } from '@mantine/core';

export interface PlosMonthlyStackCardProps {
  completionPct: number;
  headlineLabel: string;
  headlineValue: string;
  footerLeftLabel?: string;
  footerLeftValue: string;
  footerRightLabel?: string;
  footerRightValue: string;
  onOpenDetail?: () => void;
}

/**
 * Fanned stacked card matching the reference:
 * - Face card sized to the wrapper
 * - Two back layers same size, rotated from bottom-left so top-right fans out
 * - Wrapper has NO overflow clip — parent `.plos-dash-right-col` handles that
 */
export function PlosMonthlyStackCard({
  completionPct,
  headlineLabel,
  headlineValue,
  footerLeftLabel = 'Estimated',
  footerLeftValue,
  footerRightLabel = 'Calculated',
  footerRightValue,
  onOpenDetail,
}: PlosMonthlyStackCardProps) {
  const p = Math.min(100, Math.max(0, completionPct));
  const R = 42;
  const STROKE = 10;
  const CIRC = 2 * Math.PI * R;
  const progLen = (p / 100) * CIRC;
  const innerR = Math.max(R - STROKE, 0);

  const interactive = typeof onOpenDetail === 'function';

  const body = (
    <Box style={{ position: 'relative' }}>
      {/* Back layer 1 — deepest blue, most rotated, fans top-right */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background: 'linear-gradient(165deg, #3248e8 0%, #2538c4 100%)',
          transform: 'rotate(8deg)',
          transformOrigin: '15% 95%',
          boxShadow: '0 8px 20px rgba(31,62,201,0.22)',
          border: '1px solid rgba(255,255,255,0.14)',
          zIndex: 0,
        }}
      />
      {/* Back layer 2 — mid lavender, less rotated */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background: 'linear-gradient(165deg, #8e70ff 0%, #7050f0 100%)',
          transform: 'rotate(4deg)',
          transformOrigin: '15% 95%',
          boxShadow: '0 10px 22px rgba(111,82,237,0.20)',
          border: '1px solid rgba(255,255,255,0.18)',
          zIndex: 1,
        }}
      />
      {/* Face card — no rotation */}
      <Box
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: 390,
          borderRadius: 20,
          background: 'linear-gradient(160deg, #7b45d6 0%, #5e2fad 48%, #451989 100%)',
          color: '#fff',
          padding: '24px 22px 22px',
          boxSizing: 'border-box',
          boxShadow:
            '0 3px 0 rgba(0,0,0,0.06), 0 16px 36px rgba(40,20,80,0.28), inset 0 1px 0 rgba(255,255,255,0.16)',
          border: '1px solid rgba(255,255,255,0.16)',
          transition: interactive ? 'transform 0.22s ease, box-shadow 0.22s ease' : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className={interactive ? 'plos-stack-card-front' : undefined}
      >
        <Text ta="center" fz={12} fw={700} mb={8} style={{ opacity: 0.92 }}>
          {headlineLabel}
        </Text>
        <Text
          ta="center" fw={900} lh={1.08} mb={18}
          style={{
            letterSpacing: '-0.035em',
            fontVariantNumeric: 'tabular-nums',
            fontSize: fontSizeForHeadline(headlineValue),
            textShadow: '0 3px 18px rgba(0,0,0,0.2)',
          }}
        >
          {headlineValue}
        </Text>

        <Box style={{ position: 'relative', width: 140, height: 140, marginBottom: 22 }}>
          <svg width="140" height="140" viewBox="0 0 124 124" style={{ display: 'block' }}>
            <defs>
              <filter id="plosRingSoft" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
              </filter>
            </defs>
            <circle cx="62" cy="62" r={R} fill="none" stroke="#ffd0d8" strokeWidth={STROKE} filter="url(#plosRingSoft)" />
            <circle
              cx="62" cy="62" r={R} fill="none" stroke="#ffffff"
              strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={`${progLen} ${CIRC}`}
              transform="rotate(-90 62 62)"
            />
            <circle cx="62" cy="62" r={innerR - 1} fill="#ffffff" />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', paddingTop: 2,
          }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--pl-stack-deep)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.05em' }}>
              {Math.round(p)}%
            </span>
          </div>
        </Box>

        <Group grow gap="lg" mt={2} w="100%">
          <Stack gap={2} ta="center">
            <Text fz={11} fw={650} style={{ opacity: 0.86 }}>{footerLeftLabel}</Text>
            <Text fz={14} fw={900} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{footerLeftValue}</Text>
          </Stack>
          <Stack gap={2} ta="center">
            <Text fz={11} fw={650} style={{ opacity: 0.86 }}>{footerRightLabel}</Text>
            <Text fz={14} fw={900} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{footerRightValue}</Text>
          </Stack>
        </Group>
      </Box>
    </Box>
  );

  return (
    <Box
      style={{
        position: 'relative',
        margin: '12px 0 20px',
        /* Leave right space for rotated backs to fan into */
        width: 'calc(100% - 28px)',
      }}
      className={interactive ? 'plos-stack-card-wrap' : undefined}
    >
      {interactive ? (
        <button
          type="button"
          onClick={onOpenDetail}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenDetail();
            }
          }}
          aria-label="Open executive insight detail"
          style={{
            appearance: 'none', margin: 0, padding: 0, border: 'none',
            background: 'transparent', cursor: 'pointer',
            width: '100%', display: 'block',
            textAlign: 'inherit', font: 'inherit', color: 'inherit', borderRadius: 0,
          }}
        >
          {body}
        </button>
      ) : (
        body
      )}
    </Box>
  );
}

function fontSizeForHeadline(s: string): string {
  const n = s.replace(/\s/g, '').length;
  if (n > 20) return '1.1rem';
  if (n > 14) return '1.28rem';
  return '1.52rem';
}

import type { CSSProperties, ReactNode } from 'react';
import { type Icon as TablerIconType } from '@tabler/icons-react';
import { Box, Group, Text } from '@mantine/core';
import { motion } from 'framer-motion';
import { PLOS_SHADOW_CARD, useDS } from '../theme/palette';

interface PageHeaderMetric {
  label: string;
  value: string | number;
  color?: string;
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: TablerIconType;
  accent?: string;
  action?: ReactNode;
  metrics?: PageHeaderMetric[];
}

/**
 * Flat product header used by non-dashboard pages. It keeps the app in the
 * dashboard's violet/lilac language without WebGL or 3D hero artwork.
 */
const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  accent = 'var(--brand)',
  action,
  metrics = [],
}: PageHeaderProps) => {
  const DS = useDS();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <Box
        className="plos-page-header"
        style={{
          '--page-accent': accent,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,248,255,0.96) 48%, rgba(237,233,254,0.88) 100%)',
          border: `1px solid ${DS.border}`,
          borderRadius: 'var(--pl-card-radius)',
          boxShadow: PLOS_SHADOW_CARD,
          marginBottom: 20,
          overflow: 'hidden',
          padding: '22px 24px',
          position: 'relative',
        } as CSSProperties}
      >
        <Box
          aria-hidden
          style={{
            background: `radial-gradient(circle, ${accent}20 0%, transparent 68%)`,
            borderRadius: '50%',
            height: 220,
            pointerEvents: 'none',
            position: 'absolute',
            right: -70,
            top: -92,
            width: 220,
          }}
        />
        <Box
          aria-hidden
          style={{
            background:
              'linear-gradient(90deg, rgba(124,79,255,0.10) 1px, transparent 1px), linear-gradient(rgba(124,79,255,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            inset: 0,
            maskImage: 'linear-gradient(105deg, transparent 0%, black 62%, transparent 100%)',
            opacity: 0.55,
            pointerEvents: 'none',
            position: 'absolute',
          }}
        />

        <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap" style={{ position: 'relative' }}>
          <Group gap={14} align="flex-start" wrap="nowrap">
            <Box
              style={{
                alignItems: 'center',
                background: `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.86))`,
                border: `1px solid ${accent}2e`,
                borderRadius: 16,
                color: accent,
                display: 'flex',
                flexShrink: 0,
                height: 46,
                justifyContent: 'center',
                width: 46,
              }}
            >
              <Icon size={22} stroke={1.7} />
            </Box>

            <Box style={{ maxWidth: 660 }}>
              <Text className="plos-breadcrumb" style={{ marginBottom: 7 }}>
                {eyebrow}
              </Text>
              <Text className="plos-page-title" style={{ marginBottom: 8, whiteSpace: 'pre-line' }}>
                {title}
              </Text>
              <Text style={{ color: DS.text2, fontSize: '0.84rem', lineHeight: 1.62, maxWidth: 620 }}>
                {subtitle}
              </Text>
            </Box>
          </Group>

          {action}
        </Group>

        {metrics.length > 0 && (
          <Group gap={12} mt={18} wrap="wrap" style={{ position: 'relative' }}>
            {metrics.map((metric) => (
              <Box
                key={metric.label}
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  border: `1px solid ${DS.border}`,
                  borderRadius: 14,
                  minWidth: 96,
                  padding: '9px 12px',
                }}
              >
                <Text
                  style={{
                    color: metric.color ?? accent,
                    fontSize: '1.05rem',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {metric.value}
                </Text>
                <Text
                  style={{
                    color: DS.text3,
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    marginTop: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  {metric.label}
                </Text>
              </Box>
            ))}
          </Group>
        )}
      </Box>
    </motion.div>
  );
};

export default PageHeader;

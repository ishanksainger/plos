import { Box, Radio, Stack, Text } from '@mantine/core';
import { ACCOUNT_TYPE_OPTIONS, type AccountType } from '../../constants/accountType';

interface AccountTypePickerProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
}

/**
 * Radio cards for solo / family / shared (onboarding + settings).
 */
export function AccountTypePicker({ value, onChange }: AccountTypePickerProps) {
  return (
    <Radio.Group
      value={value}
      onChange={(v) => onChange(v as AccountType)}
      label="How will you use PLOS?"
      description="Family and shared accounts can add people with email (required) and optional phone for notifications."
    >
      <Stack gap={10} mt="sm">
        {ACCOUNT_TYPE_OPTIONS.map((opt) => (
          <Box
            key={opt.value}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: `1px solid ${value === opt.value ? 'rgba(124, 79, 255, 0.45)' : 'var(--border)'}`,
              background: value === opt.value ? 'rgba(124, 79, 255, 0.06)' : 'var(--surface)',
            }}
          >
            <Radio value={opt.value} label={opt.label} styles={{ label: { fontWeight: 700 } }} />
            <Text fz="xs" ml={28} mt={4} style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {opt.description}
            </Text>
          </Box>
        ))}
      </Stack>
    </Radio.Group>
  );
}

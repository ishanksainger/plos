import { useLayoutEffect, useMemo, useState } from 'react';
import {
  Box, Button, Grid, Group, Loader, Paper, Select, Stack, Text, TextInput,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { IconDeviceFloppy, IconSettings } from '@tabler/icons-react';
import { authService } from '../services/auth.service';
import { useAppDispatch } from '../store/hooks';
import { patchUser } from '../store/authSlice';
import { useDS } from '../theme/palette';
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from '../constants/preferences';
import PageHeader from '../components/PageHeader';

const SettingsPage = () => {
  const DS = useDS();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    staleTime: 60_000,
  });

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setTimezone(data.timezone);
    setCurrency(data.currency);
  }, [data]);

  const timezoneData = useMemo(() => {
    const rows = [...TIMEZONE_OPTIONS];
    if (data?.timezone && !rows.some((t) => t.value === data.timezone)) {
      rows.unshift({ value: data.timezone, label: `${data.timezone} (saved)` });
    }
    return rows;
  }, [data?.timezone]);

  const currencyData = useMemo(() => {
    const rows = [...CURRENCY_OPTIONS];
    if (data?.currency && !rows.some((c) => c.value === data.currency)) {
      rows.unshift({ value: data.currency, label: `${data.currency} (saved)` });
    }
    return rows;
  }, [data?.currency]);

  const mutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        name,
        ...(timezone != null ? { timezone } : {}),
        ...(currency != null ? { currency } : {}),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated);
      dispatch(
        patchUser({
          id: updated.id,
          email: updated.email,
          name: updated.name,
          timezone: updated.timezone,
          currency: updated.currency,
        }),
      );
      notifications.show({ title: 'Saved', message: 'Your preferences were updated.', color: 'teal' });
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Could not save', message: err.message, color: 'red' }),
  });

  if (isLoading || !data) {
    return (
      <Box h="40vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader color="violet" size="sm" type="dots" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Text size="sm" style={{ color: DS.red }}>
        Could not load your profile. Check that the API is running.
      </Text>
    );
  }

  const tier = data.subscription?.tier ?? 'free';
  const subStatus = data.subscription?.status ?? '—';

  return (
    <Box data-page="settings" style={{ paddingBottom: 32 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <PageHeader
          eyebrow="ACCOUNT · SETTINGS"
          title="Settings"
          subtitle="Profile and regional preferences used across reminders, dashboard dates, and money fields."
          icon={IconSettings}
          accent={DS.accent}
          metrics={[
            { label: 'Tier', value: tier, color: DS.accent },
            { label: 'Status', value: subStatus, color: subStatus === 'active' ? DS.green : DS.orange },
          ]}
        />

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper
              p="lg"
              radius="md"
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
              }}
            >
              <Text fw={700} size="sm" mb="md" style={{ color: DS.text2 }}>
                Account
              </Text>
              <Stack gap="md">
                <TextInput label="Email" value={data.email} disabled description="Sign-in address (read-only)" />
                <TextInput
                  label="Display name"
                  placeholder="How we greet you in the app"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                />
                <Select
                  label="Timezone"
                  description="Used for dates on the server today / calendar bucketing"
                  data={timezoneData}
                  value={timezone}
                  onChange={setTimezone}
                  searchable
                  allowDeselect={false}
                />
                <Select
                  label="Currency"
                  description="Default for money fields (display polish coming next)"
                  data={currencyData}
                  value={currency}
                  onChange={setCurrency}
                  allowDeselect={false}
                />
                <Group justify="flex-end" mt="xs">
                  <Button
                    leftSection={<IconDeviceFloppy size={16} />}
                    color="violet"
                    loading={mutation.isPending}
                    onClick={() => mutation.mutate()}
                  >
                    Save changes
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper
              p="lg"
              radius="md"
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
              }}
            >
              <Text fw={700} size="sm" mb="md" style={{ color: DS.text2 }}>
                Plan
              </Text>
              <Stack gap={6}>
                <Group justify="space-between">
                  <Text size="sm" style={{ color: DS.text3 }}>Tier</Text>
                  <Text size="sm" fw={600} style={{ color: DS.text1, textTransform: 'capitalize' }}>{tier}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" style={{ color: DS.text3 }}>Status</Text>
                  <Text size="sm" fw={600} style={{ color: DS.text1, textTransform: 'capitalize' }}>{subStatus}</Text>
                </Group>
                <Text size="xs" mt="sm" style={{ color: DS.text3, lineHeight: 1.5 }}>
                  Billing and upgrades will appear here as roadmap work ships.
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default SettingsPage;

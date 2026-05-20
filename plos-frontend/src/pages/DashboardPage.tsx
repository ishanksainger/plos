import { Box, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { DashboardPlosAnalytics } from '../components/dashboard/DashboardPlosAnalytics';
import { getDashboard } from '../services/dashboard.service';
import { useAppSelector } from '../store/hooks';
import { useDS } from '../theme/palette';

/**
 * Dashboard from `GET /users/dashboard` (backend may auto-seed `[PLOS seed]` rows for empty accounts).
 */
export default function DashboardPage() {
  const DS = useDS();
  const user = useAppSelector((s) => s.auth.user);
  const displayName = user?.name ?? 'there';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', user?.id ?? 'anon'],
    queryFn: getDashboard,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  const formatInrCompact = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${Math.round(n)}`;
  };

  if (!user?.id) {
    return (
      <Stack gap="sm" p="md" maw={520}>
        <Text size="sm" style={{ color: DS.text2 }}>
          Sign in to load your dashboard.
        </Text>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Box data-page="dashboard" py={48} style={{ display: 'flex', justifyContent: 'center' }}>
        <Stack align="center" gap={8}>
          <Loader color="violet" size="sm" type="dots" />
          <Text fz={13} fw={600} tt="uppercase" style={{ color: DS.text3, letterSpacing: '0.12em' }}>
            Loading dashboard
          </Text>
        </Stack>
      </Box>
    );
  }

  if (isError || !data) {
    const msg = error instanceof Error ? error.message : '';
    const isNetwork =
      /failed to fetch|networkerror|load failed|fetch.*aborted|^typeerror$/i.test(msg.trim()) ||
      (error instanceof Error && error.name === 'TypeError');
    return (
      <Stack gap="sm" p="md" maw={520}>
        <Text size="sm" style={{ color: DS.red }}>
          Failed to load dashboard.{msg ? ` ${msg}` : ''}
        </Text>
        <Text size="sm" style={{ color: DS.text2, lineHeight: 1.55 }}>
          {isNetwork ? (
            <>
              Ensure the API runs on <Text span ff="monospace" fw={700}>http://127.0.0.1:3001</Text> from{' '}
              <Text span ff="monospace">plos-backend</Text>.
            </>
          ) : (
            <>
              Set <Text span ff="monospace">VITE_API_BASE_URL</Text> per <Text span ff="monospace">.env.example</Text>.
            </>
          )}
        </Text>
      </Stack>
    );
  }

  const displayData = data;

  const summary = displayData.summary;
  const momentumScore = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        summary.completionRate -
          summary.overdue * 8 +
          (summary.total > 0 ? (summary.completed / summary.total) * 12 : 0),
      ),
    ),
  );

  const act = displayData.activitySeries ?? [];
  const weekActivity = Math.round(act.slice(-7).reduce((s, pt) => s + pt.count, 0) || summary.completed);

  return (
    <Box data-page="dashboard">
      <DashboardPlosAnalytics
        data={displayData}
        displayName={displayName}
        formatInrCompact={formatInrCompact}
        momentumScore={momentumScore}
        weekActivity={weekActivity}
      />
    </Box>
  );
}

import { Box, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { IconBell, IconChecks } from '@tabler/icons-react';
import { notificationService } from '../services/notification.service';
import { useDS } from '../theme/palette';
import type { AppNotification } from '../types/notification';
import PageHeader from '../components/PageHeader';

const formatWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
};

const NotificationRow = ({
  n,
  onMarkRead,
  busy,
}: {
  n: AppNotification;
  onMarkRead: (id: number) => void;
  busy: boolean;
}) => {
  const DS = useDS();
  const unread = n.readAt == null;
  return (
    <Paper
      p="sm"
      radius="md"
      style={{
        border: `1px solid ${DS.border}`,
        background: unread ? DS.accentBg : DS.surface,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Box style={{ minWidth: 0 }}>
          <Text size="sm" fw={700} style={{ color: DS.text1 }}>
            {n.title}
          </Text>
          {n.message && (
            <Text size="xs" mt={4} style={{ color: DS.text2, lineHeight: 1.45 }}>
              {n.message}
            </Text>
          )}
          <Text size="xs" mt={6} style={{ color: DS.text3 }}>
            {formatWhen(n.createdAt)}
            {n.responsibility ? ` · ${n.responsibility.title}` : ''}
          </Text>
        </Box>
        {unread && (
          <Button
            size="xs"
            variant="light"
            color="violet"
            loading={busy}
            onClick={() => onMarkRead(n.id)}
          >
            Read
          </Button>
        )}
      </Group>
    </Paper>
  );
};

const NotificationsPage = () => {
  const DS = useDS();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationService.list(80),
    staleTime: 20_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Error', message: err.message, color: 'red' }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      notifications.show({ title: 'All caught up', message: 'Notifications marked read.', color: 'teal' });
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Error', message: err.message, color: 'red' }),
  });

  if (isLoading) {
    return (
      <Box h="40vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader color="violet" size="sm" type="dots" />
      </Box>
    );
  }

  if (isError) {
    const detail =
      error instanceof Error ? error.message : 'Could not load notifications.';
    return (
      <Stack gap="xs" maw={480}>
        <Text size="sm" fw={600} style={{ color: DS.red }}>
          Could not load notifications.
        </Text>
        <Text size="xs" style={{ color: DS.text2, lineHeight: 1.5 }}>
          {detail}
        </Text>
        {(/Request failed \(5\d\d\)/i.test(detail) ||
          /^internal server error$/i.test(detail.trim())) && (
          <Text size="xs" style={{ color: DS.text3, lineHeight: 1.5 }}>
            If you recently pulled code, run{' '}
            <Text component="span" ff="monospace" size="xs">
              npx prisma migrate deploy
            </Text>{' '}
            in <Text component="span" ff="monospace" size="xs">plos-backend</Text> so the
            database matches the API, then restart the server.
          </Text>
        )}
      </Stack>
    );
  }

  const rows = data ?? [];
  const unread = rows.filter((n) => n.readAt == null).length;

  return (
    <Box data-page="notifications" style={{ paddingBottom: 32 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <PageHeader
          eyebrow="INBOX · NOTIFICATIONS"
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread items need attention.` : 'You are all caught up.'}
          icon={IconBell}
          accent={DS.accent}
          metrics={[
            { label: 'Unread', value: unread, color: unread > 0 ? DS.orange : DS.green },
            { label: 'Total', value: rows.length, color: DS.accent },
          ]}
          action={(
            <Button
              leftSection={<IconChecks size={16} />}
              variant="light"
              color="violet"
              disabled={unread === 0}
              loading={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        />

        <Stack gap="sm">
          {rows.length === 0 ? (
            <Text size="sm" style={{ color: DS.text3 }}>
              Nothing here yet. Completing tasks or schedule changes will show up automatically.
            </Text>
          ) : (
            rows.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                busy={markReadMutation.isPending && markReadMutation.variables === n.id}
                onMarkRead={(id) => markReadMutation.mutate(id)}
              />
            ))
          )}
        </Stack>
      </motion.div>
    </Box>
  );
};

export default NotificationsPage;

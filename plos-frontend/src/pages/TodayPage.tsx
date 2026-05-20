import { useEffect, useState } from 'react';
import { Box, Button, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToday } from '../hooks/useToday';
import { TodayBucket } from '../components/today/TodayBucket';
import { StreakRiskBanner } from '../components/today/StreakRiskBanner';
import { DiaryFeed } from '../components/today/DiaryFeed';
import CreateResponsibilityModal from '../components/responsibilities/CreateResponsibilityModal';
import { responsibilityService } from '../services/responsibility.service';
import { useAppSelector } from '../store/hooks';
import { useDS } from '../theme/palette';
import { trackTodayViewLoaded } from '../lib/analytics';
import { registerDashboardCreateResponsibilityHandler } from '../utils/dashboard-create-bridge';

/** Time-of-day greeting from local clock. */
function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Today home — priorities first (overdue / due / upcoming) + diary feed below.
 */
export default function TodayPage() {
  const DS = useDS();
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useToday();
  const [createOpen, setCreateOpen] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    registerDashboardCreateResponsibilityHandler(() => setCreateOpen(true));
    return () => registerDashboardCreateResponsibilityHandler(null);
  }, []);

  useEffect(() => {
    if (!data) return;
    trackTodayViewLoaded(data.overdue.length, data.dueToday.length);
  }, [data]);

  const completeMutation = useMutation({
    mutationFn: (id: number) => responsibilityService.markComplete(id),
    onMutate: (id) => setCompletingId(id),
    onSettled: () => setCompletingId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['today'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const displayName = user?.name?.split(' ')[0] ?? 'there';
  const dateLine = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (isLoading) {
    return (
      <Box py={48} style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color="violet" size="sm" type="dots" />
      </Box>
    );
  }

  if (isError || !data) {
    const msg = error instanceof Error ? error.message : '';
    return (
      <Stack gap="sm" p="md" maw={520}>
        <Text size="sm" style={{ color: DS.red }}>
          Failed to load Today.{msg ? ` ${msg}` : ''}
        </Text>
      </Stack>
    );
  }

  const totalOpen = data.overdue.length + data.dueToday.length + data.upcoming7.length;
  const isEmpty = totalOpen === 0 && data.completedToday.length === 0;

  return (
    <Box data-page="today" style={{ padding: '0 clamp(14px, 2.8vw, 32px) clamp(22px, 3.5vw, 40px)' }}>
      <CreateResponsibilityModal opened={createOpen} onClose={() => setCreateOpen(false)} />

      <Stack gap={22}>
        <Box>
          <Text
            fw={900}
            style={{
              fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
              letterSpacing: '-0.035em',
              color: '#3a1f6e',
            }}
          >
            {greetingLabel()}, {displayName}
          </Text>
          <Text fz="sm" mt={6} style={{ color: '#584a84', fontWeight: 600 }}>
            {dateLine}
            {data.timeZone ? ` · ${data.timeZone}` : ''}
          </Text>
          <Text fz="sm" mt={10} style={{ color: DS.text2 }}>
            <Text span fw={800} style={{ color: DS.red }}>
              {data.dueToday.length} due
            </Text>
            {' · '}
            <Text span fw={800} style={{ color: DS.red }}>
              {data.overdue.length} overdue
            </Text>
            {' · '}
            <Text span fw={700}>
              {data.upcoming7.length} upcoming
            </Text>
          </Text>
        </Box>

        {isEmpty ? (
          <Box className="plos-studio-card" p="xl" ta="center">
            <Text fw={700} mb={8} style={{ color: DS.text1 }}>
              Your life OS starts with one responsibility
            </Text>
            <Text fz="sm" mb="lg" style={{ color: DS.text2 }}>
              Add something due today — a bill, habit, or family task — and it will show up here.
            </Text>
            <Button className="plos-btn-accent" onClick={() => setCreateOpen(true)}>
              + Add responsibility
            </Button>
          </Box>
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing={{ base: 16, md: 20 }}>
              <TodayBucket
                variant="overdue"
                items={data.overdue}
                completingId={completingId}
                onComplete={(id) => completeMutation.mutate(id)}
              />
              <TodayBucket
                variant="due"
                items={data.dueToday}
                completingId={completingId}
                onComplete={(id) => completeMutation.mutate(id)}
              />
              <TodayBucket
                variant="upcoming"
                items={data.upcoming7}
                completingId={completingId}
                onComplete={(id) => completeMutation.mutate(id)}
              />
            </SimpleGrid>

            <StreakRiskBanner items={data.streaksAtRisk} />

            <Box className="plos-studio-card" style={{ padding: '20px 22px 18px' }}>
              <Group justify="space-between" mb={14}>
                <Text component="span" className="plos-dash-chart-title">
                  Diary
                </Text>
                <Text fz="xs" fw={700} style={{ color: '#5b4788' }}>
                  Recent activity
                </Text>
              </Group>
              <DiaryFeed events={data.recentEvents} />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}

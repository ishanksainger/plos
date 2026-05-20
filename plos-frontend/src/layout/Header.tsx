import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Indicator,
  Menu,
  Popover,
  ScrollArea,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBell,
  IconLogout,
  IconMenu2,
  IconSearch,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMediaQuery } from '@mantine/hooks';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import { useDS } from '../theme/palette';
import { notificationService } from '../services/notification.service';
import type { AppNotification } from '../types/notification';
import { requestDashboardNewResponsibility } from '../utils/dashboard-create-bridge';

const formatPreviewTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const titleForPath = (path: string): string => {
  if (path === '/') return 'Dashboard';
  if (path.startsWith('/responsibilities')) return 'Files';
  if (path.startsWith('/people')) return 'Filter';
  if (path.startsWith('/finance')) return 'Analytics';
  if (path.startsWith('/health')) return 'Health';
  if (path.startsWith('/habits')) return 'Habits';
  if (path.startsWith('/timeline')) return 'Charts';
  if (path.startsWith('/notifications')) return 'Alerts';
  if (path.startsWith('/settings')) return 'Settings';
  return 'myWallet';
};

/** Reference header clock: `10:30 PM - 14th August 2022` */
const formatDashboardClock = (): string => {
  const d = new Date();
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dayNum = d.getDate();
  const month = d.toLocaleString(undefined, { month: 'long' });
  const year = d.getFullYear();
  return `${time} - ${dayNum} ${month} ${year}`;
};

interface AppHeaderProps {
  openMobileNav: () => void;
}

/**
 * Workspace header — shared purple rail (matches sidebar), white title/clock, search, notifications, profile.
 */
const AppHeader = ({ openMobileNav }: AppHeaderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const DS = useDS();
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const [notifOpen, setNotifOpen] = useState(false);
  const [clock, setClock] = useState(formatDashboardClock);

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatDashboardClock()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const title = titleForPath(location.pathname);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.unreadCount(),
    staleTime: 15_000,
    refetchInterval: 45_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  const { data: preview } = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => notificationService.list(8),
    enabled: notifOpen,
    staleTime: 5_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const rows = preview ?? [];

  const iconShell = (): React.CSSProperties => ({
    width: 42,
    height: 42,
    borderRadius: 999,
    border: '1px solid rgba(255, 255, 255, 0.32)',
    background: 'rgba(255, 255, 255, 0.14)',
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.15)',
    color: '#ffffff',
  });

  return (
    <Box
      style={{
        flexShrink: 0,
        padding: 'clamp(20px, 2.8vh, 30px) clamp(18px, 3.6vw, 40px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
        background: 'var(--sidebar-gradient, linear-gradient(168deg, #9248ee 0%, #6828dc 42%, #3d1698 94%))',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06), 0 14px 40px rgba(28, 10, 64, 0.28)',
        position: 'relative',
        zIndex: 3,
      }}
    >
      <Group justify="space-between" align="center" gap="lg" wrap="nowrap">
        <Group gap={isNarrow ? 'sm' : 'lg'} align="flex-start" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
          {isNarrow && (
            <ActionIcon variant="transparent" aria-label="Open menu" color="white" size="lg" onClick={openMobileNav}>
              <IconMenu2 size={20} stroke={1.5} />
            </ActionIcon>
          )}
          <Box style={{ minWidth: 0 }}>
            <Text
              lh={1.12}
              style={{
                fontSize: 'clamp(1.5rem, 3.8vw, 2.05rem)',
                fontWeight: 900,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
              }}
            >
              {title}
            </Text>
            <Text size="xs" mt={9} style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.82)' }}>
              {clock}
            </Text>
          </Box>
          {location.pathname === '/' && isNarrow && (
            <Button
              variant="unstyled"
              size="compact-sm"
              radius="md"
              className="plos-btn-header-cta"
              ml="auto"
              px={12}
              h={34}
              styles={{ root: { fontWeight: 700, fontSize: 12 } }}
              onClick={() => requestDashboardNewResponsibility()}
            >
              + New
            </Button>
          )}
        </Group>

        {!isNarrow && (
          <Box style={{ flex: '1 1 320px', maxWidth: 460, minWidth: 220 }}>
            <TextInput
              placeholder="Search"
              leftSection={<IconSearch size={18} stroke={1.7} style={{ color: DS.text2 }} />}
              variant="filled"
              size="sm"
              radius="xl"
              styles={{
                root: {
                  width: '100%',
                },
                section: {
                  color: DS.text2,
                  left: 10,
                },
                input: {
                  background: '#ffffff',
                  border: `1px solid ${DS.border2}`,
                  boxShadow: '0 10px 26px rgba(57, 73, 171, 0.08)',
                  color: DS.text1,
                  borderRadius: 16,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  height: 46,
                  paddingLeft: 42,
                  transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
                  '&::placeholder': {
                    color: DS.text2,
                    opacity: 1,
                    fontWeight: 600,
                  },
                  '&:hover': {
                    background: '#fbfaff',
                    borderColor: 'rgba(124, 79, 255, 0.34)',
                  },
                  '&:focus': {
                    background: '#ffffff',
                    borderColor: DS.accent,
                    boxShadow: '0 0 0 3px rgba(124, 79, 255, 0.12), 0 12px 28px rgba(57, 73, 171, 0.10)',
                  },
                },
              }}
            />
          </Box>
        )}

        {location.pathname === '/' && !isNarrow && (
          <Button
            variant="unstyled"
            size="sm"
            radius="md"
            className="plos-btn-header-cta"
            styles={{
              root: {
                fontWeight: 700,
                fontSize: '0.8125rem',
                height: 40,
                paddingLeft: 16,
                paddingRight: 16,
                flexShrink: 0,
                lineHeight: 1,
              },
            }}
            onClick={() => requestDashboardNewResponsibility()}
          >
            + New responsibility
          </Button>
        )}

        <Group gap={12} justify="flex-end" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Popover opened={notifOpen} onChange={setNotifOpen} position="bottom-end" shadow="lg" width={360} withinPortal>
            <Popover.Target>
              <Indicator
                inline
                disabled={unreadCount === 0}
                label={unreadCount > 9 ? '9+' : unreadCount}
                size={16}
                color="red"
                offset={4}
              >
                <ActionIcon
                  variant="transparent"
                  aria-label="Notifications"
                  radius="xl"
                  onClick={() => setNotifOpen((o) => !o)}
                  style={iconShell()}
                >
                  <IconBell size={18} stroke={1.5} />
                </ActionIcon>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                padding: 0,
                borderRadius: 'var(--pl-card-radius)',
                boxShadow: '0 26px 60px rgba(37,59,109,0.14)',
              }}
            >
              <Box p="sm" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                  <Text fw={700} size="sm" style={{ color: DS.text1 }}>
                    Notifications
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="violet"
                    disabled={unreadCount === 0}
                    loading={markAllMutation.isPending}
                    onClick={() => markAllMutation.mutate()}
                  >
                    Mark all read
                  </Button>
                </Group>
              </Box>
              <ScrollArea.Autosize mah={320} type="auto">
                <Box p="xs" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rows.length === 0 ? (
                    <Text size="xs" py="md" ta="center" style={{ color: DS.text3 }}>
                      No notifications yet.
                    </Text>
                  ) : (
                    rows.map((n: AppNotification) => {
                      const unread = n.readAt == null;
                      return (
                        <UnstyledButton
                          key={n.id}
                          onClick={() => {
                            if (unread) markReadMutation.mutate(n.id);
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: 14,
                            border: `1px solid ${unread ? DS.border2 : DS.border}`,
                            background: unread ? DS.accentBg : 'transparent',
                          }}
                        >
                          <Text size="xs" fw={700} style={{ color: DS.text1, lineHeight: 1.3 }}>
                            {n.title}
                          </Text>
                          {n.message && (
                            <Text size="xs" lineClamp={2} mt={2} style={{ color: DS.text2, lineHeight: 1.35 }}>
                              {n.message}
                            </Text>
                          )}
                          <Text size="xs" mt={4} style={{ color: DS.text3 }}>
                            {formatPreviewTime(n.createdAt)}
                            {unread ? ' · Tap to mark read' : ''}
                          </Text>
                        </UnstyledButton>
                      );
                    })
                  )}
                </Box>
              </ScrollArea.Autosize>
              <Box p="xs" style={{ borderTop: `1px solid ${DS.border}` }}>
                <UnstyledButton
                  w="100%"
                  py={8}
                  style={{ color: DS.accent, fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/notifications');
                  }}
                >
                  View all
                </UnstyledButton>
              </Box>
            </Popover.Dropdown>
          </Popover>

          <Menu shadow="lg" width={200} position="bottom-end" radius="lg">
            <Menu.Target>
              <ActionIcon variant="transparent" aria-label="Account menu" size="lg">
                <Avatar
                  radius="xl"
                  size={44}
                  style={{
                    cursor: 'pointer',
                    border: '2px solid rgba(255, 255, 255, 0.45)',
                    boxShadow: '0 10px 28px rgba(142,112,255,0.35)',
                    background: 'linear-gradient(145deg, var(--brand) 0%, var(--brand-light) 100%)',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {user?.name?.[0]?.toUpperCase() ?? <IconUser size={18} />}
                </Avatar>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 'var(--pl-card-radius)' }}>
              <Menu.Label style={{ color: DS.text2, fontSize: '0.65rem' }}>
                {user?.email ?? 'Account'}
              </Menu.Label>
              <Menu.Item
                leftSection={<IconSettings size={13} />}
                style={{ color: DS.text1, fontSize: '0.8125rem' }}
                onClick={() => navigate('/settings')}
              >
                Settings
              </Menu.Item>
              <Menu.Divider style={{ borderColor: DS.border }} />
              <Menu.Item
                leftSection={<IconLogout size={13} />}
                color="red"
                style={{ fontSize: '0.8125rem' }}
                onClick={() => {
                  dispatch(logout());
                  queryClient.removeQueries({ queryKey: ['dashboard'] });
                  navigate('/login');
                }}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
};

export default AppHeader;

import { Loader } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { notificationService } from '../services/notification.service';
import type { AppNotification } from '../types/notification';

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading, isError, error } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationService.list(80),
    staleTime: 20_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
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

  const unread = rows.filter((n: AppNotification) => n.readAt == null).length;
  const subLine = isLoading
    ? 'Loading…'
    : isError
    ? 'Could not load notifications.'
    : unread === 0
    ? 'You are all caught up.'
    : `${unread} unread · in-app only for now`;

  return (
    <div className="plos-page-enter">
      <div className="plos-page-eyebrow">Inbox</div>
      <div className="greeting-row">
        <div>
          <h1 className="plos-page-title">Notifications</h1>
          <div className="plos-page-sub">{subLine}</div>
        </div>
        <button
          type="button"
          className="plos-cta"
          style={{
            background: 'transparent',
            color: 'var(--plos-accent)',
            boxShadow: 'none',
            border: '1px solid var(--plos-accent-soft)',
            opacity: unread === 0 || markAllMutation.isPending ? 0.6 : 1,
            cursor: unread === 0 ? 'default' : 'pointer',
          }}
          disabled={unread === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
        >
          Mark all read
        </button>
      </div>

      {isLoading ? (
        <div className="glass" style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Loader color="violet" size="sm" type="dots" />
        </div>
      ) : isError ? (
        <div className="glass" style={{ padding: 24, color: '#ef4444', fontSize: 14 }}>
          Could not load notifications.
          {error instanceof Error && error.message ? ` ${error.message}` : ''}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass" style={{ padding: 28, textAlign: 'center', color: 'var(--plos-ink-3)', fontSize: 13 }}>
          Nothing here yet. Completing tasks or schedule changes will show up automatically.
        </div>
      ) : (
        <div className="glass" style={{ padding: '8px 24px' }}>
          {rows.map((n) => {
            const isUnread = n.readAt == null;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => isUnread && markReadMutation.mutate(n.id)}
                disabled={!isUnread}
                style={{
                  width: '100%',
                  padding: '16px 0',
                  borderTop: '1px solid var(--plos-rule)',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  borderTopColor: 'var(--plos-rule)',
                  borderTopStyle: 'solid',
                  borderTopWidth: 1,
                  cursor: isUnread ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 50,
                    background: isUnread ? 'var(--plos-accent)' : 'transparent',
                    marginTop: 8,
                    flex: 'none',
                    border: isUnread ? 'none' : '1.5px solid var(--plos-ink-4)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--plos-ink-1)', fontSize: 14 }}>
                    {n.title}
                  </div>
                  {n.message && (
                    <div style={{ color: 'var(--plos-ink-2)', fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                  )}
                  <div className="tl-event-time" style={{ marginTop: 4 }}>
                    {relativeTime(n.createdAt)} · {n.type}
                    {n.responsibility ? ` · ${n.responsibility.title}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

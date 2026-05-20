import { api } from './api';
import type { AppNotification } from '../types/notification';

export const notificationService = {
  list: (limit = 50) => api.get<AppNotification[]>(`/notifications?limit=${limit}`),

  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (id: number) => api.patch<AppNotification>(`/notifications/${id}/read`, {}),

  markAllRead: () => api.post<{ updated: boolean }>('/notifications/read-all', {}),
};

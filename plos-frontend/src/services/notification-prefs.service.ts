import { api } from './api';

export interface NotificationPrefs {
  inAppEnabled: boolean;
  emailDigests: boolean;
  whatsappOptIn: boolean;
  streakAtRisk: boolean;
  updatedAt: string;
}

export type NotificationPrefsPatch = Partial<
  Pick<NotificationPrefs, 'inAppEnabled' | 'emailDigests' | 'whatsappOptIn' | 'streakAtRisk'>
>;

export const notificationPrefsService = {
  get: () => api.get<NotificationPrefs>('/users/notification-preferences'),
  update: (patch: NotificationPrefsPatch) =>
    api.patch<NotificationPrefs>('/users/notification-preferences', patch),
};

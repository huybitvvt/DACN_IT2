import { api } from './api';

export type NotificationType =
  | 'SYSTEM'
  | 'PAYMENT'
  | 'REWARD'
  | 'CONTEST'
  | 'RETENTION'
  | 'BADGE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  metadata: unknown;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  emailPayments: boolean;
  emailRewards: boolean;
  emailContests: boolean;
  emailRetention: boolean;
  emailBadges: boolean;
}

export async function fetchNotifications(limit = 30) {
  const { data } = await api.get<{ notifications: AppNotification[]; unreadCount: number }>(
    '/notifications',
    { params: { limit } },
  );
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.put<{ notification: AppNotification }>(`/notifications/${id}/read`);
  return data.notification;
}

export const markAllNotificationsRead = () => api.put('/notifications/read-all');

export async function fetchNotificationPreferences() {
  const { data } = await api.get<{ preferences: NotificationPreferences }>(
    '/notifications/preferences',
  );
  return data.preferences;
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  const { data } = await api.put<{ preferences: NotificationPreferences }>(
    '/notifications/preferences',
    preferences,
  );
  return data.preferences;
}

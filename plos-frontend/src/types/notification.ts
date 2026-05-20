export interface AppNotification {
  id: number;
  type: string;
  channel: string;
  title: string;
  message: string | null;
  readAt: string | null;
  createdAt: string;
  responsibilityId: number | null;
  responsibility: { id: number; title: string } | null;
}

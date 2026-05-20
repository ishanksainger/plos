import { api } from './api';

export interface UserEventEntry {
  id: number;
  fromState: string;
  toState: string;
  occurredAt: string;
  note?: string | null;
  responsibility: {
    id: number;
    title: string;
    category: string;
    amount: number | null;
    person: { id: number; name: string; relation: string } | null;
  };
}

export const eventService = {
  getFeed: (limit = 100) =>
    api.get<UserEventEntry[]>(`/events?limit=${limit}`),
};

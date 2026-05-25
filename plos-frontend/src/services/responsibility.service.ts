import { api } from './api';
import type { Responsibility } from '../types/dashboard';
import type { HabitStreaksResponse } from '../types/habits';

export interface CreateResponsibilityPayload {
  title: string;
  category: string;
  module?: string;
  dueDate: string;
  personId?: number;
  amount?: number;
  recurrence?: string;
  notes?: string;
}

/** Fields accepted by PATCH /responsibility/:id (omit keys you do not want to change). */
export type UpdateResponsibilityPayload = {
  title?: string;
  category?: string;
  module?: string | null;
  dueDate?: string;
  personId?: number | null;
  amount?: number | null;
  recurrence?: string;
  notes?: string | null;
};

export const responsibilityService = {
  getAll: (params?: { state?: string; category?: string; personId?: number }) => {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.category) query.set('category', params.category);
    if (params?.personId) query.set('personId', String(params.personId));
    const qs = query.toString();
    return api.get<Responsibility[]>(`/responsibility${qs ? `?${qs}` : ''}`);
  },

  create: (data: CreateResponsibilityPayload) =>
    api.post<Responsibility>('/responsibility', data),

  update: (id: number, data: UpdateResponsibilityPayload) =>
    api.patch<Responsibility>(`/responsibility/${id}`, data),

  getById: (id: number) => api.get<Responsibility>(`/responsibility/${id}`),

  markComplete: (id: number) =>
    api.patch<Responsibility>(`/responsibility/${id}/complete`),

  deleteOne: (id: number) =>
    api.delete<void>(`/responsibility/${id}`),

  getTimeline: (id: number) =>
    api.get<{ fromState: string; toState: string; occurredAt: string; note?: string }[]>(
      `/responsibility/${id}/timeline`
    ),

  getHabitStreaks: () => api.get<HabitStreaksResponse>('/responsibility/habits/streaks'),

  getHabitHistory: (id: number, days = 42) =>
    api.get<{
      habitId: number;
      days: number;
      items: { date: string; completed: boolean }[];
    }>(`/responsibility/habits/${id}/history?days=${days}`),
};

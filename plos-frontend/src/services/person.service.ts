import { api } from './api';
import type { Person } from '../types/dashboard';

export interface PersonWithCount extends Person {
  _count?: { responsibilities: number };
}

export interface CreatePersonPayload {
  name: string;
  relation: string;
  dateOfBirth?: string;
}

export const personService = {
  getAll: () => api.get<PersonWithCount[]>('/persons'),
  create: (data: CreatePersonPayload) => api.post<Person>('/persons', data),
  deleteOne: (id: number) => api.delete<void>(`/persons/${id}`),
  getById: (id: number) =>
    api.get<Person & { responsibilities: { id: number; title: string; dueDate: string; completedAt: string | null; category: string }[] }>(
      `/persons/${id}`,
    ),
};

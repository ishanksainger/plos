import { api } from './api';
import type { Person } from '../types/dashboard';

export interface PersonWithCount extends Person {
  _count?: { responsibilities: number };
}

export interface CreatePersonPayload {
  name: string;
  email: string;
  phone?: string;
  relation: string;
  dateOfBirth?: string;
}

export interface HouseholdMemberPayload {
  name: string;
  email: string;
  phone?: string;
  relation: string;
}

export const personService = {
  getAll: () => api.get<PersonWithCount[]>('/persons'),
  create: (data: CreatePersonPayload) => api.post<Person>('/persons', data),
  update: (id: number, data: Partial<CreatePersonPayload>) =>
    api.patch<Person>(`/persons/${id}`, data),
  uploadAvatar: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<Person>(`/persons/${id}/avatar`, form);
  },
  deleteOne: (id: number) => api.delete<void>(`/persons/${id}`),
  getById: (id: number) =>
    api.get<Person & { responsibilities: { id: number; title: string; dueDate: string; completedAt: string | null; category: string }[] }>(
      `/persons/${id}`,
    ),
};

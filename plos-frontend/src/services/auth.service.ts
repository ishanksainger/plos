import { api } from './api';
import type { AuthUser, MeResponse, UpdateProfilePayload } from '../types/auth';

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  register: (email: string, password: string, name?: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get<MeResponse>('/auth/me'),
  updateProfile: (body: UpdateProfilePayload) => api.patch<MeResponse>('/auth/me', body),
};

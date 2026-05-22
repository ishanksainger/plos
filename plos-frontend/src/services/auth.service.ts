import { api } from './api';
import type {
  AccountType,
  AuthUser,
  HouseholdMemberRegister,
  MeResponse,
  UpdateProfilePayload,
} from '../types/auth';

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  register: (
    email: string,
    password: string,
    name?: string,
    accountType?: AccountType,
    householdMembers?: HouseholdMemberRegister[],
  ) =>
    api.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
      accountType,
      ...(householdMembers?.length ? { householdMembers } : {}),
    }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get<MeResponse>('/auth/me'),
  updateProfile: (body: UpdateProfilePayload) => api.patch<MeResponse>('/auth/me', body),
};

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
  /** Permanently deletes the current user + all their data. No undo. */
  deleteAccount: () => api.delete<{ deleted: true }>('/auth/me'),
  /**
   * Step 1 of password recovery — always succeeds even if the email isn't
   * registered (account-enumeration defence on the backend).
   */
  forgotPassword: (email: string) =>
    api.post<{ ok: true }>('/auth/forgot-password', { email }),
  /** Step 2 — consume a reset token and set a new password. */
  resetPassword: (token: string, password: string) =>
    api.post<{ ok: true }>('/auth/reset-password', { token, password }),
  /** Click target from the verification email. */
  verifyEmail: (token: string) =>
    api.post<{ ok: true }>('/auth/verify-email', { token }),
  /** Re-issue a verification email for the logged-in user. */
  resendVerification: () =>
    api.post<{ ok: true }>('/auth/resend-verification', {}),
};

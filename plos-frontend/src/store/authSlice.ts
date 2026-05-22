import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AccountType, AuthUser } from '../types/auth';

export type { AuthUser };

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const stored = localStorage.getItem('plos_token');
const storedUser = localStorage.getItem('plos_user');

/** Parses `plos_user` from localStorage; backfills timezone/currency for older cached shapes. */
function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as Partial<AuthUser> & { id?: number; email?: string };
    if (typeof u.id !== 'number' || typeof u.email !== 'string') return null;
    const accountType =
      u.accountType === 'family' || u.accountType === 'shared' ? u.accountType : 'solo';
    return {
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      timezone: typeof u.timezone === 'string' ? u.timezone : 'Asia/Kolkata',
      currency: typeof u.currency === 'string' ? u.currency : 'INR',
      accountType: accountType as AccountType,
      phone: typeof u.phone === 'string' ? u.phone : null,
    };
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  token: stored ?? null,
  user: parseStoredUser(storedUser),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('plos_token', action.payload.token);
      localStorage.setItem('plos_user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('plos_token');
      localStorage.removeItem('plos_user');
    },
    /** Merge fields into the signed-in user (e.g. after `PATCH /auth/me`). */
    patchUser(state, action: PayloadAction<Partial<AuthUser> & Pick<AuthUser, 'id'>>) {
      if (!state.user || state.user.id !== action.payload.id) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('plos_user', JSON.stringify(state.user));
    },
  },
});

export const { setCredentials, logout, patchUser } = authSlice.actions;
export default authSlice.reducer;

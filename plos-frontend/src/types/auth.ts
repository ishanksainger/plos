export type AccountType = 'solo' | 'family' | 'shared';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  timezone: string;
  currency: string;
  accountType: AccountType;
  phone: string | null;
}

export interface SubscriptionSummary {
  tier: string;
  status: string;
}

export interface MeResponse extends AuthUser {
  subscription: SubscriptionSummary | null;
}

export interface HouseholdMemberRegister {
  name: string;
  email: string;
  phone?: string;
  relation: string;
}

export interface UpdateProfilePayload {
  name?: string;
  timezone?: string;
  currency?: string;
  accountType?: AccountType;
  phone?: string;
}

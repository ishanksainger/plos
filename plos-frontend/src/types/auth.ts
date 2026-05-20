export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  timezone: string;
  currency: string;
}

export interface SubscriptionSummary {
  tier: string;
  status: string;
}

export interface MeResponse extends AuthUser {
  subscription: SubscriptionSummary | null;
}

export interface UpdateProfilePayload {
  name?: string;
  timezone?: string;
  currency?: string;
}

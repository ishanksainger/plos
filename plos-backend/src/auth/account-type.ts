/** Supported workspace account types (roadmap H). */
export const ACCOUNT_TYPES = ['solo', 'family', 'shared'] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * Normalizes and validates an account type string; defaults to solo.
 */
export function normalizeAccountType(value?: string | null): AccountType {
  const v = value?.trim().toLowerCase();
  if (v === 'family' || v === 'shared') return v;
  return 'solo';
}

/**
 * Human-readable warning when changing account type (sharing features ship in Step P).
 */
export function accountTypeChangeWarning(
  from: AccountType,
  to: AccountType,
): string | null {
  if (from === to) return null;

  if (to === 'solo') {
    return (
      'Switching to Solo keeps your data, but household or collaborator sharing ' +
      '(when we add it) will no longer apply to this account. Invites and shared views are not available yet.'
    );
  }

  if (from === 'solo' && (to === 'family' || to === 'shared')) {
    return to === 'family'
      ? 'Family mode prepares your account for household sharing. Invites and shared responsibilities will arrive in a later update — for now everything stays private to you.'
      : 'Shared mode prepares your account for collaborators (co-founder, VA, accountant). Invites and permissions will arrive in a later update — for now everything stays private to you.';
  }

  if (from === 'family' && to === 'shared') {
    return (
      'You are switching from Family (household) to Shared (collaborators). ' +
      'Sharing rules will differ when we ship invites; your existing data is unchanged.'
    );
  }

  if (from === 'shared' && to === 'family') {
    return (
      'You are switching from Shared (collaborators) to Family (household). ' +
      'Sharing rules will differ when we ship invites; your existing data is unchanged.'
    );
  }

  return 'Your account type will be updated. Shared access features are not enabled yet.';
}

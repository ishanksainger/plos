export type AccountType = 'solo' | 'family' | 'shared';

export const ACCOUNT_TYPE_OPTIONS: {
  value: AccountType;
  label: string;
  description: string;
}[] = [
  {
    value: 'solo',
    label: 'Solo',
    description: 'Just you — responsibilities and people stay private to your account.',
  },
  {
    value: 'family',
    label: 'Family',
    description: 'Household mode (spouse, kids, shared life admin). Sharing features come later.',
  },
  {
    value: 'shared',
    label: 'Shared',
    description: 'Work with others (co-founder, VA, accountant). Invites and permissions come later.',
  },
];

/**
 * Warning copy when changing account type in Settings (matches backend intent).
 */
export function accountTypeChangeWarning(from: AccountType, to: AccountType): string | null {
  if (from === to) return null;

  if (to === 'solo') {
    return (
      'Switching to Solo keeps your data, but household or collaborator sharing ' +
      '(when we add it) will no longer apply. Invites are not available yet.'
    );
  }

  if (from === 'solo' && to === 'family') {
    return (
      'Family mode prepares your account for household sharing. Invites and shared ' +
      'responsibilities arrive in a later update — for now everything stays private to you.'
    );
  }

  if (from === 'solo' && to === 'shared') {
    return (
      'Shared mode prepares your account for collaborators. Invites and permissions ' +
      'arrive in a later update — for now everything stays private to you.'
    );
  }

  if (from === 'family' && to === 'shared') {
    return (
      'You are switching from Family (household) to Shared (collaborators). Sharing rules ' +
      'will differ when invites ship; your existing data is unchanged.'
    );
  }

  if (from === 'shared' && to === 'family') {
    return (
      'You are switching from Shared (collaborators) to Family (household). Sharing rules ' +
      'will differ when invites ship; your existing data is unchanged.'
    );
  }

  return 'Your account type will be updated. Shared access is not enabled yet.';
}

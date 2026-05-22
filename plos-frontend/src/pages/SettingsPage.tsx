import { useLayoutEffect, useState, type ReactElement } from 'react';
import { Loader, Modal } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { authService } from '../services/auth.service';
import { personService } from '../services/person.service';
import { useAppDispatch } from '../store/hooks';
import { patchUser } from '../store/authSlice';
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from '../constants/preferences';
import { ACCOUNT_TYPE_OPTIONS, accountTypeChangeWarning } from '../constants/accountType';
import type { AccountType } from '../types/auth';
import { resolveMediaUrl } from '../utils/mediaUrl';

type Tab = 'profile' | 'account' | 'notifications' | 'plan';

const TAB_ORDER: Tab[] = ['profile', 'account', 'notifications', 'plan'];

const ACCT_ICON: Record<AccountType, ReactElement> = {
  solo: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M14 21a5 5 0 0 1 8-3" />
    </svg>
  ),
  shared: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="9" r="3" />
      <circle cx="17" cy="9" r="3" />
      <path d="M2 20a5 5 0 0 1 10 0" />
      <path d="M12 20a5 5 0 0 1 10 0" />
    </svg>
  ),
};

const TONE: Record<string, [string, string]> = {
  self:    ['#fde68a', '#f0abfc'],
  father:  ['#fcd34d', '#fb923c'],
  mother:  ['#bbf7d0', '#86efac'],
  partner: ['#a5f3fc', '#818cf8'],
  child:   ['#fecaca', '#f9a8d4'],
  sibling: ['#ddd6fe', '#c4b5fd'],
  other:   ['#e5e7eb', '#cbd5e1'],
};

const initials = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [accountType, setAccountType] = useState<AccountType>('solo');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingWarning, setPendingWarning] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    staleTime: 60_000,
  });

  const personsQuery = useQuery({
    queryKey: ['persons'],
    queryFn: personService.getAll,
    staleTime: 30_000,
  });

  useLayoutEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setPhone(data.phone ?? '');
    setTimezone(data.timezone);
    setCurrency(data.currency);
    setAccountType(data.accountType ?? 'solo');
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        name,
        timezone,
        currency,
        accountType,
        phone: phone.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated);
      dispatch(
        patchUser({
          id: updated.id,
          email: updated.email,
          name: updated.name,
          timezone: updated.timezone,
          currency: updated.currency,
          accountType: updated.accountType,
          phone: updated.phone,
        }),
      );
      setConfirmOpen(false);
      setPendingWarning(null);
      notifications.show({ title: 'Saved', message: 'Your preferences were updated.', color: 'teal' });
    },
    onError: (err: Error) =>
      notifications.show({ title: 'Could not save', message: err.message, color: 'red' }),
  });

  const savedAccountType = data?.accountType ?? 'solo';
  const accountTypeChanged = accountType !== savedAccountType;

  const handleSaveClick = () => {
    const warning = accountTypeChangeWarning(savedAccountType, accountType);
    if (warning) {
      setPendingWarning(warning);
      setConfirmOpen(true);
      return;
    }
    mutation.mutate();
  };

  const headerBlock = (
    <>
      <div className="plos-page-eyebrow">Settings</div>
      <div className="greeting-row">
        <div>
          <h1 className="plos-page-title">Settings</h1>
          <div className="plos-page-sub">Profile, account type, currency, notifications</div>
        </div>
        <div className="tabs">
          {TAB_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  if (isLoading || !data) {
    return (
      <div className="plos-page-enter">
        {headerBlock}
        <div className="glass" style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Loader color="violet" size="sm" type="dots" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="plos-page-enter">
        {headerBlock}
        <div className="glass" style={{ padding: 24, color: '#ef4444', fontSize: 14 }}>
          Could not load your profile. Check that the API is running.
        </div>
      </div>
    );
  }

  const tier = data.subscription?.tier ?? 'free';
  const subStatus = data.subscription?.status ?? '—';

  return (
    <div className="plos-page-enter">
      {headerBlock}

      <div className="glass" style={{ padding: '8px 28px' }}>
        {tab === 'profile' && (
          <>
            <div className="settings-row">
              <div>
                <div className="label">Name</div>
                <div className="help">Used in greetings and the diary feed.</div>
              </div>
              <input
                className="input"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="settings-row">
              <div>
                <div className="label">Email</div>
                <div className="help">For login and password reset.</div>
              </div>
              <input className="input" value={data.email} disabled />
            </div>
            <div className="settings-row">
              <div>
                <div className="label">Phone</div>
                <div className="help">Optional. For WhatsApp reminders later (opt-in).</div>
              </div>
              <input
                className="input"
                value={phone}
                placeholder="+91 98765 43210"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="settings-row">
              <div>
                <div className="label">Timezone & currency</div>
                <div className="help">All due dates and money displayed in these.</div>
              </div>
              <div className="input-row">
                <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  {TIMEZONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <select
                  className="input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ maxWidth: 160 }}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="plos-cta"
                onClick={handleSaveClick}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </>
        )}

        {tab === 'account' && (
          <>
            <div className="settings-row">
              <div>
                <div className="label">Account type</div>
                <div className="help">Solo, Family, or Shared. Changing this may affect who can see what.</div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {ACCOUNT_TYPE_OPTIONS.map((o) => (
                    <button
                      type="button"
                      key={o.value}
                      className={`acct-option ${accountType === o.value ? 'selected' : ''}`}
                      style={{ flex: 1, padding: 12 }}
                      onClick={() => setAccountType(o.value)}
                    >
                      <div className="icon" style={{ width: 32, height: 32 }}>{ACCT_ICON[o.value]}</div>
                      <div className="acct-option-body" style={{ flex: 1 }}>
                        <strong style={{ fontSize: 13 }}>{o.label}</strong>
                        <span style={{ fontSize: 11 }}>{o.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {accountTypeChanged && (
                  <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 10 }}>
                    Changing account type requires confirmation when you save.
                  </div>
                )}
                <button
                  type="button"
                  className="plos-cta"
                  onClick={handleSaveClick}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <div className="label">Household</div>
                <div className="help">People who share this account.</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {personsQuery.isLoading && (
                  <div style={{ color: 'var(--plos-ink-3)', fontSize: 13 }}>Loading…</div>
                )}
                {personsQuery.data?.length === 0 && (
                  <div style={{ color: 'var(--plos-ink-3)', fontSize: 13 }}>
                    No people yet. Add them on the People page.
                  </div>
                )}
                {(personsQuery.data ?? []).map((p) => {
                  const tone = TONE[p.relation] ?? TONE.other;
                  const avatar = resolveMediaUrl(p.avatarUrl);
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                      <div
                        className="person-avatar"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          fontSize: 12,
                          background: avatar
                            ? `center/cover no-repeat url(${avatar})`
                            : `linear-gradient(135deg, ${tone[0]}, ${tone[1]})`,
                        }}
                      >
                        {avatar ? '' : initials(p.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--plos-ink-1)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--plos-ink-3)' }}>{p.relation}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'notifications' && (
          <>
            {[
              { label: 'In-app notifications', help: 'Bell icon + notifications page.', on: true, disabled: false },
              { label: 'Email digests', help: 'A weekly summary every Sunday at 8am.', on: false, disabled: false },
              { label: 'WhatsApp reminders', help: 'Coming soon. Opt-in required.', on: false, disabled: true },
              { label: 'Streak-at-risk pings', help: 'Notify when a habit is one day from breaking.', on: true, disabled: false },
            ].map((row) => (
              <div key={row.label} className="settings-row">
                <div>
                  <div className="label">{row.label}</div>
                  <div className="help">{row.help}</div>
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      borderRadius: 999,
                      background: row.on ? 'var(--plos-accent-soft)' : 'var(--plos-rule)',
                      color: row.on ? 'var(--plos-accent)' : 'var(--plos-ink-3)',
                      fontSize: 12,
                      fontWeight: 600,
                      opacity: row.disabled ? 0.5 : 1,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 50,
                        background: row.on ? 'var(--plos-accent)' : 'var(--plos-ink-4)',
                      }}
                    />
                    {row.on ? 'On' : row.disabled ? 'Coming soon' : 'Off'}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'plan' && (
          <>
            <div className="settings-row">
              <div>
                <div className="label">Current plan</div>
                <div className="help">Free until Razorpay billing ships.</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'var(--plos-accent-soft)',
                    color: 'var(--plos-accent)',
                    fontWeight: 600,
                    fontSize: 13,
                    textTransform: 'capitalize',
                  }}
                >
                  {tier} · Founding
                </div>
                <span style={{ fontSize: 12, color: 'var(--plos-ink-3)' }}>
                  Status: <span style={{ textTransform: 'capitalize' }}>{subStatus}</span>
                </span>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <div className="label">Data export</div>
                <div className="help">All your responsibilities, people, and timeline as JSON or CSV.</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="input" style={{ width: 'auto', cursor: 'pointer', fontWeight: 600 }}>
                  Export JSON
                </button>
                <button type="button" className="input" style={{ width: 'auto', cursor: 'pointer', fontWeight: 600 }}>
                  Export CSV
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Change account type?"
        centered
        radius="md"
      >
        <div style={{ fontSize: 13, color: 'var(--plos-ink-2)', lineHeight: 1.55, marginBottom: 16 }}>
          {pendingWarning}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            className="plos-cta"
            style={{ background: 'transparent', color: 'var(--plos-ink-2)', boxShadow: 'none' }}
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="plos-cta"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Saving…' : 'Confirm & save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

import { useLayoutEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Modal } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { authService } from '../services/auth.service';
import { personService } from '../services/person.service';
import {
  notificationPrefsService,
  type NotificationPrefs,
  type NotificationPrefsPatch,
} from '../services/notification-prefs.service';
import { downloadExport, type ExportFormat } from '../services/export.service';
import { useAppDispatch as useAppDispatchUi, useAppSelector } from '../store/hooks';
import { setTheme, type ThemeMode } from '../store/uiSlice';
import { useAppDispatch } from '../store/hooks';
import { patchUser, logout } from '../store/authSlice';
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
            <ThemeRow />
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

        {tab === 'notifications' && <NotificationPrefsPanel />}

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
            <DataExportRow />
            <DangerZone />
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

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; hint: string }> = [
  { value: 'light', label: 'Light', hint: 'Glassy lavender (default)' },
  { value: 'dark',  label: 'Dark',  hint: 'Deep ink with glow accents' },
];

function ThemeRow() {
  const theme = useAppSelector((s) => s.ui.theme);
  const dispatch = useAppDispatchUi();
  return (
    <div className="settings-row">
      <div>
        <div className="label">Appearance</div>
        <div className="help">Saved on this browser. We respect your system preference on first visit.</div>
      </div>
      <div
        role="radiogroup"
        aria-label="Theme"
        style={{ display: 'inline-flex', gap: 6, padding: 4, borderRadius: 999, background: 'var(--plos-rule)' }}
      >
        {THEME_OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.hint}
              onClick={() => dispatch(setTheme(opt.value))}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: 0,
                background: active ? 'var(--plos-glass-bg-strong, white)' : 'transparent',
                color: active ? 'var(--plos-ink-1)' : 'var(--plos-ink-3)',
                fontWeight: active ? 600 : 500,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 160ms, color 160ms',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DangerZone() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setConfirmStep(0);
    setTyped('');
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await authService.deleteAccount();
      notifications.show({
        title: 'Account deleted',
        message: 'Everything has been removed. We will miss you.',
        color: 'teal',
      });
      // Wipe the local session so the JWT can't be replayed against another
      // (unrelated) account.
      localStorage.removeItem('plos_token');
      localStorage.removeItem('plos_user');
      dispatch(logout());
      navigate('/login', { replace: true });
    } catch (err) {
      notifications.show({
        title: 'Could not delete',
        message: err instanceof Error ? err.message : 'Try again in a minute.',
        color: 'red',
      });
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className="settings-row"
        style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid var(--plos-rule)',
        }}
      >
        <div>
          <div className="label" style={{ color: '#ef4444' }}>
            Delete account
          </div>
          <div className="help">
            Permanently removes your profile, responsibilities, people, and timeline.
            No undo. Per DPDP §11 we delete server-side within 24 hours.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmStep(1)}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(239, 68, 68, 0.06)',
            color: '#ef4444',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Delete account
        </button>
      </div>

      <Modal
        opened={confirmStep > 0}
        onClose={busy ? () => {} : close}
        title={confirmStep === 1 ? 'Delete your account?' : 'Final check'}
        centered
        radius="md"
        closeOnClickOutside={!busy}
        closeOnEscape={!busy}
      >
        {confirmStep === 1 && (
          <>
            <div style={{ fontSize: 13, color: 'var(--plos-ink-2)', lineHeight: 1.55, marginBottom: 16 }}>
              This deletes your user profile, every responsibility you've logged,
              everyone in your circle, your timeline, your notification
              preferences, your subscription record, and unsubscribes you from
              emails. <strong>It cannot be undone.</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="plos-cta"
                style={{ background: 'transparent', color: 'var(--plos-ink-2)', boxShadow: 'none' }}
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="button"
                className="plos-cta"
                style={{ background: '#ef4444' }}
                onClick={() => setConfirmStep(2)}
              >
                Continue
              </button>
            </div>
          </>
        )}
        {confirmStep === 2 && (
          <>
            <div style={{ fontSize: 13, color: 'var(--plos-ink-2)', lineHeight: 1.55, marginBottom: 14 }}>
              Type <strong>DELETE</strong> to confirm.
            </div>
            <input
              className="input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              autoFocus
              disabled={busy}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="plos-cta"
                style={{ background: 'transparent', color: 'var(--plos-ink-2)', boxShadow: 'none' }}
                onClick={close}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="plos-cta"
                style={{ background: '#ef4444' }}
                disabled={typed !== 'DELETE' || busy}
                onClick={doDelete}
              >
                {busy ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function DataExportRow() {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      await downloadExport(format);
      notifications.show({
        title: `${format.toUpperCase()} export ready`,
        message: 'Your download has started.',
        color: 'teal',
      });
    } catch (err) {
      notifications.show({
        title: 'Export failed',
        message: err instanceof Error ? err.message : 'Try again in a minute.',
        color: 'red',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="settings-row">
      <div>
        <div className="label">Data export</div>
        <div className="help">All your responsibilities, people, and timeline as JSON; CSV gives you the responsibility rows only.</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="input"
          style={{
            width: 'auto',
            cursor: busy ? 'wait' : 'pointer',
            fontWeight: 600,
            opacity: busy ? 0.6 : 1,
          }}
          disabled={busy !== null}
          onClick={() => run('json')}
        >
          {busy === 'json' ? 'Exporting…' : 'Export JSON'}
        </button>
        <button
          type="button"
          className="input"
          style={{
            width: 'auto',
            cursor: busy ? 'wait' : 'pointer',
            fontWeight: 600,
            opacity: busy ? 0.6 : 1,
          }}
          disabled={busy !== null}
          onClick={() => run('csv')}
        >
          {busy === 'csv' ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
    </div>
  );
}

const PREF_ROWS: Array<{
  key: keyof Omit<NotificationPrefs, 'updatedAt'>;
  label: string;
  help: string;
  disabled?: boolean;
}> = [
  { key: 'inAppEnabled',  label: 'In-app notifications', help: 'Bell icon + notifications page.' },
  { key: 'emailDigests',  label: 'Email digests',         help: 'A weekly summary every Sunday at 8am.' },
  { key: 'whatsappOptIn', label: 'WhatsApp reminders',    help: 'Opt-in required. Pipeline ships soon — toggle is saved either way.' },
  { key: 'streakAtRisk',  label: 'Streak-at-risk pings',  help: 'Notify when a habit is one day from breaking.' },
];

function NotificationPrefsPanel() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: notificationPrefsService.get,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (patch: NotificationPrefsPatch) => notificationPrefsService.update(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ['notification-prefs'] });
      const prev = queryClient.getQueryData<NotificationPrefs>(['notification-prefs']);
      if (prev) {
        queryClient.setQueryData<NotificationPrefs>(['notification-prefs'], {
          ...prev,
          ...patch,
        });
      }
      return { prev };
    },
    onError: (err: Error, _patch, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notification-prefs'], ctx.prev);
      notifications.show({
        title: 'Could not save',
        message: err.message || 'Try again in a minute.',
        color: 'red',
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-prefs'], data);
    },
  });

  if (isLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <Loader color="violet" size="sm" type="dots" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <div className="label" style={{ color: '#ef4444' }}>
          Couldn&rsquo;t load your notification preferences.
        </div>
        <div className="help">
          {error instanceof Error && error.message ? error.message : ''}
        </div>
        <button
          type="button"
          className="plos-cta"
          onClick={() => refetch()}
          style={{ marginTop: 6 }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {PREF_ROWS.map((row) => {
        const on = data[row.key];
        return (
          <div key={row.key} className="settings-row">
            <div>
              <div className="label">{row.label}</div>
              <div className="help">{row.help}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ [row.key]: !on } as NotificationPrefsPatch)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                border: 0,
                cursor: mutation.isPending ? 'wait' : 'pointer',
                background: on ? 'var(--plos-accent-soft)' : 'var(--plos-rule)',
                color: on ? 'var(--plos-accent)' : 'var(--plos-ink-3)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'background 160ms ease, color 160ms ease',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 50,
                  background: on ? 'var(--plos-accent)' : 'var(--plos-ink-4)',
                }}
              />
              {on ? 'On' : 'Off'}
            </button>
          </div>
        );
      })}
    </>
  );
}

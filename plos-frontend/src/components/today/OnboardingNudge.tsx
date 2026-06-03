import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * First-run guide for brand-new users (no responsibilities yet). Points at the
 * three highest-value first actions so the app isn't an empty void on day one
 * — weak onboarding is a known retention killer. Dismissible + remembered per
 * user; also disappears on its own once the first responsibility exists.
 */
export default function OnboardingNudge({
  userId,
  onAddResponsibility,
}: {
  userId?: number;
  onAddResponsibility: () => void;
}) {
  const navigate = useNavigate();
  const storageKey = `plos_onboarding_dismissed_${userId ?? 'anon'}`;
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(storageKey) === '1',
  );

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* private mode — fine, it just won't persist */
    }
    setDismissed(true);
  };

  const steps = [
    {
      title: 'Add your first responsibility',
      body: 'A bill, a deadline, a habit — anything you want to stop holding in your head.',
      cta: 'Add one',
      onClick: onAddResponsibility,
      primary: true,
    },
    {
      title: 'Add the people you carry',
      body: 'Family or clients. Responsibilities can belong to them, not just you.',
      cta: 'Add a person',
      onClick: () => navigate('/people'),
    },
    {
      title: 'Already track this in a sheet?',
      body: 'Import a tracker CSV from Settings → Plan and PLOS fills itself in.',
      cta: 'Import a tracker',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div
      className="glass"
      style={{
        padding: '20px 22px',
        marginBottom: 22,
        position: 'relative',
        border: '1px solid var(--plos-accent-soft)',
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        title="Dismiss"
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          background: 'transparent',
          color: 'var(--plos-ink-3)',
          padding: 4,
          cursor: 'pointer',
          lineHeight: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--plos-ink-1)', marginBottom: 4 }}>
        Welcome to PLOS 👋
      </div>
      <div style={{ fontSize: 13, color: 'var(--plos-ink-3)', marginBottom: 16, maxWidth: 560 }}>
        Let&apos;s get one thing off your mind. Pick whichever feels easiest — you only
        need to do one to get started.
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {steps.map((s) => (
          <div
            key={s.title}
            style={{
              border: '1px solid var(--plos-rule)',
              borderRadius: 14,
              padding: '14px 14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'var(--plos-surface, rgba(255,255,255,0.5))',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--plos-ink-1)' }}>{s.title}</div>
            <div style={{ fontSize: 12, color: 'var(--plos-ink-3)', flex: 1, lineHeight: 1.5 }}>{s.body}</div>
            <button
              type="button"
              className="plos-cta"
              style={
                s.primary
                  ? { alignSelf: 'flex-start' }
                  : {
                      alignSelf: 'flex-start',
                      background: 'transparent',
                      color: 'var(--plos-accent)',
                      boxShadow: 'none',
                      border: '1px solid var(--plos-accent-soft)',
                    }
              }
              onClick={s.onClick}
            >
              {s.cta} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

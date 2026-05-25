import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

const STORAGE_KEY = 'plos_install_dismissed';

/**
 * Listens for the browser's `beforeinstallprompt` event and surfaces a
 * single "Install PLOS" toast in the bottom-right. The browser only fires
 * the event once per session; the toast hides if the user dismisses it
 * or installs the app, and stays hidden across sessions via localStorage.
 */
export function PlosInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(STORAGE_KEY) === '1') {
      setHidden(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
      window.localStorage.setItem(STORAGE_KEY, '1');
    };

    window.addEventListener('beforeinstallprompt', onPrompt as EventListener);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hidden || !deferred) return null;

  const install = async () => {
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferred(null);
        setHidden(true);
        window.localStorage.setItem(STORAGE_KEY, '1');
      } else {
        // User dismissed the system dialog — respect that for this session.
        setDeferred(null);
      }
    } catch {
      setDeferred(null);
    }
  };

  const dismiss = () => {
    setDeferred(null);
    setHidden(true);
    window.localStorage.setItem(STORAGE_KEY, '1');
  };

  return (
    <div
      role="dialog"
      aria-label="Install PLOS"
      className="glass"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 80,
        padding: 16,
        borderRadius: 16,
        maxWidth: 320,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        boxShadow: '0 18px 50px -18px rgba(58, 31, 110, 0.32)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 44,
          height: 44,
          flex: 'none',
          borderRadius: 12,
          background: 'center/cover no-repeat url(/plos-icon.svg)',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--plos-ink-1)', fontSize: 13 }}>
          Install PLOS
        </div>
        <div style={{ fontSize: 12, color: 'var(--plos-ink-3)', marginTop: 2, lineHeight: 1.45 }}>
          Add to your home screen for one-tap access — works offline soon.
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            type="button"
            className="plos-cta"
            onClick={install}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              background: 'transparent',
              border: 0,
              color: 'var(--plos-ink-3)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

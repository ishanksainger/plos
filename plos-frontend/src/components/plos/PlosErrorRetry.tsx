import type { ReactNode } from 'react';

interface Props {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  /** "subtle" sits inside an existing card; "panel" renders its own glass shell. */
  variant?: 'subtle' | 'panel';
}

const AlertIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

/**
 * A standard "failed to load" state with a Retry button. Drop-in for the
 * existing `Failed to load …` red text scattered across the pages.
 */
export function PlosErrorRetry({
  title = 'Could not load',
  message,
  onRetry,
  retrying = false,
  variant = 'panel',
}: Props) {
  const body = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#ef4444',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {AlertIcon}
        <span>{title}</span>
      </div>
      {message && (
        <div style={{ fontSize: 13, color: 'var(--plos-ink-3)' }}>{message}</div>
      )}
      {onRetry && (
        <button
          type="button"
          className="plos-cta"
          onClick={onRetry}
          disabled={retrying}
          style={{ padding: '8px 16px', fontSize: 12 }}
        >
          {retrying ? 'Retrying…' : 'Try again'}
        </button>
      )}
    </div>
  );

  if (variant === 'subtle') return body;

  return (
    <div className="glass" style={{ padding: 22 }}>
      {body}
    </div>
  );
}

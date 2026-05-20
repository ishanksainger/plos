import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional key — when it changes, the boundary resets. Useful for resetting on route change. */
  resetKey?: string | number;
}

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary
 * ─────────────────────────────────────────────────────────────
 * Last-line-of-defence boundary that wraps the routed content
 * inside the app shell. If any rendered component throws — a
 * Three.js context loss, a stale query selector, a malformed
 * date — we render a recovery card instead of the white screen
 * the user was seeing.
 *
 * The boundary auto-resets when `resetKey` changes (we pass the
 * current pathname) so navigating away from a broken route
 * brings the app back to life without a hard reload.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — surfaced in dev tools.
    // eslint-disable-next-line no-console
    console.error('[PLOS ErrorBoundary] caught:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private handleReset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          padding: '40px 24px',
          maxWidth: 640,
          margin: '40px auto',
          background: 'var(--ds-surface, #12151e)',
          border: '1px solid var(--ds-border, #1c2030)',
          borderRadius: 12,
          color: 'var(--ds-text1, #dde3f0)',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#b86b5c',
            marginBottom: 10,
          }}
        >
          Something glitched on this view
        </div>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}
        >
          The page hit an error and was paused
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--ds-text2, #7e8fa3)',
            lineHeight: 1.6,
            marginBottom: 18,
          }}
        >
          Don't worry — your data is safe. You can recover by clicking <em>Try again</em>,
          or jump back to the dashboard. If the problem persists, copy the message below
          and report it.
        </p>

        <pre
          style={{
            background: 'var(--ds-elev, #181b26)',
            border: '1px solid var(--ds-border, #1c2030)',
            borderRadius: 8,
            padding: 12,
            fontSize: '0.72rem',
            color: 'var(--ds-text2, #7e8fa3)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 160,
            overflow: 'auto',
            margin: '0 0 16px',
          }}
        >
          {error.name}: {error.message}
        </pre>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #6f8f72 0%, #5fa88a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '9px 18px',
              background: 'transparent',
              color: 'var(--ds-text1, #dde3f0)',
              border: '1px solid var(--ds-border, #1c2030)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

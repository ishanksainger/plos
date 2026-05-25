import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';

type State =
  | { kind: 'verifying' }
  | { kind: 'ok' }
  | { kind: 'missing-token' }
  | { kind: 'error'; message: string };

/**
 * Click target from the verification email. Verifies once on mount,
 * shows success / error, and links back to the app.
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>(
    token ? { kind: 'verifying' } : { kind: 'missing-token' },
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await authService.verifyEmail(token);
        if (!cancelled) setState({ kind: 'ok' });
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Verification link is invalid or expired.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="plos plos-auth-shell" data-theme="light">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="plos-auth-card"
      >
        <div className="plos-auth-brand">
          <div className="name">PL<em>O</em>S</div>
          <div className="tag">Email verification</div>
        </div>

        {state.kind === 'verifying' && (
          <>
            <h2 className="plos-auth-h">Verifying…</h2>
            <p className="plos-auth-sub">One moment while we confirm your email.</p>
          </>
        )}

        {state.kind === 'ok' && (
          <>
            <h2 className="plos-auth-h">All set</h2>
            <p className="plos-auth-sub">
              Your email is verified. You can close this tab or jump back into PLOS.
            </p>
            <Link to="/" className="plos-cta plos-cta-block" style={{ marginTop: 18 }}>
              Open PLOS
            </Link>
          </>
        )}

        {state.kind === 'missing-token' && (
          <>
            <h2 className="plos-auth-h">No token in this link</h2>
            <p className="plos-auth-sub">
              The verification URL is missing its <code>?token=…</code> piece. Open
              the original email or re-send a fresh one from Settings → Profile.
            </p>
            <Link to="/settings" className="plos-cta plos-cta-block" style={{ marginTop: 18 }}>
              Open Settings
            </Link>
          </>
        )}

        {state.kind === 'error' && (
          <>
            <div className="plos-alert" role="alert">{state.message}</div>
            <p className="plos-auth-sub" style={{ marginTop: 16 }}>
              Sign in and request a fresh verification link from Settings → Profile.
            </p>
            <Link to="/login" className="plos-cta plos-cta-block" style={{ marginTop: 18 }}>
              Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

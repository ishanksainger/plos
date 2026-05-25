import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = useMemo(
    () => password.length >= 8 && password === confirm && Boolean(token),
    [password, confirm, token],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: 'submitting' });
    try {
      await authService.resetPassword(token, password);
      setStatus({ kind: 'done' });
      setTimeout(() => navigate('/login', { replace: true }), 1_500);
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Reset link is invalid or expired.',
      });
    }
  };

  if (!token) {
    return (
      <div className="plos plos-auth-shell" data-theme="light">
        <div className="plos-auth-card">
          <h2 className="plos-auth-h">No reset token</h2>
          <p className="plos-auth-sub">
            The link you followed is missing its token. Request a fresh one.
          </p>
          <Link to="/forgot-password" className="plos-cta plos-cta-block" style={{ marginTop: 18 }}>
            Send a new reset link
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="tag">Pick a new password</div>
        </div>

        {status.kind === 'done' ? (
          <>
            <h2 className="plos-auth-h">Password updated</h2>
            <p className="plos-auth-sub">
              Taking you to sign-in… or{' '}
              <Link to="/login">click here</Link>.
            </p>
          </>
        ) : (
          <>
            <h2 className="plos-auth-h">Set a new password</h2>
            <p className="plos-auth-sub">
              At least 8 characters. Mix in numbers or symbols for something stronger.
            </p>

            {status.kind === 'error' && (
              <div className="plos-alert" role="alert">{status.message}</div>
            )}

            <form onSubmit={submit}>
              <div className="plos-field">
                <label className="label" htmlFor="rp-pw">New password</label>
                <input
                  id="rp-pw"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-invalid={tooShort ? 'true' : undefined}
                />
                <div
                  className="help"
                  style={tooShort ? { color: '#ef4444' } : undefined}
                >
                  {password.length === 0
                    ? '8 characters minimum.'
                    : tooShort
                      ? `${8 - password.length} more to go.`
                      : 'Looks good.'}
                </div>
              </div>

              <div className="plos-field">
                <label className="label" htmlFor="rp-confirm">Confirm</label>
                <input
                  id="rp-confirm"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  aria-invalid={mismatch ? 'true' : undefined}
                />
                {mismatch && (
                  <div className="help" style={{ color: '#ef4444' }}>
                    Passwords don&rsquo;t match.
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="plos-cta plos-cta-block"
                disabled={!canSubmit || status.kind === 'submitting'}
                style={{ width: '100%', marginTop: 18 }}
              >
                {status.kind === 'submitting' ? 'Updating…' : 'Update password'}
              </button>
            </form>

            <div className="plos-auth-foot">
              <Link to="/login">Back to sign in</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus({ kind: 'error', message: 'Enter a valid email.' });
      return;
    }
    setStatus({ kind: 'submitting' });
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setStatus({ kind: 'sent' });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not send right now.',
      });
    }
  };

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
          <div className="tag">Reset your password</div>
        </div>

        {status.kind === 'sent' ? (
          <>
            <h2 className="plos-auth-h">Check your inbox</h2>
            <p className="plos-auth-sub">
              If <strong>{email}</strong> is on our books, we just emailed a reset link.
              It expires in 30 minutes. If you don&rsquo;t see it, check spam.
            </p>
            <Link to="/login" className="plos-cta plos-cta-block" style={{ marginTop: 18 }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h2 className="plos-auth-h">Forgot your password?</h2>
            <p className="plos-auth-sub">
              Enter the email you registered with. We&rsquo;ll send a single-use reset link.
            </p>

            {status.kind === 'error' && (
              <div className="plos-alert" role="alert">{status.message}</div>
            )}

            <form onSubmit={submit}>
              <div className="plos-field">
                <label className="label" htmlFor="fp-email">Email</label>
                <input
                  id="fp-email"
                  className="input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="plos-cta plos-cta-block"
                disabled={status.kind === 'submitting'}
                style={{ width: '100%', marginTop: 18 }}
              >
                {status.kind === 'submitting' ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <div className="plos-auth-foot">
              Remembered it? <Link to="/login">Sign in</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

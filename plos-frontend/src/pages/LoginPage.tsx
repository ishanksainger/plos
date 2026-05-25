import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';
import { identifyUser, trackAppOpened } from '../lib/analytics';

export default function LoginPage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(email, password);
      dispatch(setCredentials(res));
      identifyUser(res.user.id, res.user.email, res.user.name);
      trackAppOpened();
      queryClient.removeQueries({ queryKey: ['dashboard'] });
      queryClient.removeQueries({ queryKey: ['today'] });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
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
          <div className="tag">Your personal life operating system</div>
        </div>

        <h2 className="plos-auth-h">Welcome back</h2>
        <p className="plos-auth-sub">Sign in to pick up where you left off.</p>

        {error && <div className="plos-alert" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="plos-field">
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="plos-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="label" htmlFor="login-password">Password</label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: 12,
                  color: 'var(--plos-ink-3)',
                  textDecoration: 'none',
                }}
              >
                Forgot?
              </Link>
            </div>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="plos-cta plos-cta-block"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="plos-auth-foot">
          No account? <Link to="/register">Create one free</Link>
        </div>
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { personService } from '../services/person.service';
import { setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';
import { identifyUser, trackAppOpened } from '../lib/analytics';
import { AccountTypePicker } from '../components/account/AccountTypePicker';
import { HouseholdMembersSection } from '../components/person/HouseholdMembersSection';
import { emptyPersonContactDraft, type PersonContactDraft } from '../components/person/PersonContactFields';
import type { AccountType, HouseholdMemberRegister } from '../types/auth';

export default function RegisterPage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('solo');
  const [householdMembers, setHouseholdMembers] = useState<PersonContactDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showHousehold = accountType === 'family' || accountType === 'shared';

  useEffect(() => {
    if (showHousehold && householdMembers.length === 0) {
      setHouseholdMembers([emptyPersonContactDraft()]);
    }
    if (!showHousehold) {
      setHouseholdMembers([]);
    }
  }, [showHousehold, householdMembers.length]);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const nameMissing = trimmedName.length === 0;
  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMissing = password.length === 0;
  const canSubmit =
    !nameMissing && emailValid && !passwordMissing && !passwordTooShort;

  const passwordScore = (() => {
    if (password.length < 8) return { label: 'Too short', tone: '#ef4444' };
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;
    if (score <= 2) return { label: 'OK', tone: '#f59e0b' };
    if (score <= 3) return { label: 'Good', tone: '#22d3ee' };
    return { label: 'Strong', tone: '#10b981' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (nameMissing) setError('Please add your name so PLOS can greet you.');
      else if (!emailValid) setError('That doesn’t look like a valid email.');
      else if (passwordMissing) setError('Pick a password (8+ characters).');
      else if (passwordTooShort) setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    const membersPayload: HouseholdMemberRegister[] = [];
    const avatarQueue: { email: string; file: File }[] = [];

    if (showHousehold) {
      for (const m of householdMembers) {
        const trimmedName = m.name.trim();
        const trimmedEmail = m.email.trim();
        if (!trimmedName && !trimmedEmail && !m.phone.trim()) continue;
        if (!trimmedName || !trimmedEmail) {
          setError('Each person needs a name and email.');
          setLoading(false);
          return;
        }
        membersPayload.push({
          name: trimmedName,
          email: trimmedEmail,
          relation: m.relation,
          ...(m.phone.trim() ? { phone: m.phone.trim() } : {}),
        });
        if (m.avatarFile) {
          avatarQueue.push({ email: trimmedEmail.toLowerCase(), file: m.avatarFile });
        }
      }
    }

    try {
      const res = await authService.register(
        email,
        password,
        name,
        accountType,
        membersPayload.length ? membersPayload : undefined,
      );
      dispatch(setCredentials(res));
      identifyUser(res.user.id, res.user.email, res.user.name);
      trackAppOpened();

      if (avatarQueue.length) {
        const persons = await personService.getAll();
        await Promise.all(
          avatarQueue.map(async ({ email: memberEmail, file }) => {
            const person = persons.find(
              (p) => p.email.toLowerCase() === memberEmail && p.relation !== 'self',
            );
            if (person) await personService.uploadAvatar(person.id, file);
          }),
        );
      }

      queryClient.removeQueries({ queryKey: ['dashboard'] });
      queryClient.removeQueries({ queryKey: ['today'] });
      queryClient.removeQueries({ queryKey: ['persons'] });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
        className={`plos-auth-card${showHousehold ? ' wide' : ''}`}
        style={showHousehold ? { maxHeight: '88vh', overflowY: 'auto' } : undefined}
      >
        <div className="plos-auth-brand">
          <div className="name">PL<em>O</em>S</div>
          <div className="tag">Start managing your life better</div>
        </div>

        <h2 className="plos-auth-h">Create your account</h2>
        <p className="plos-auth-sub">Free forever for the founding cohort.</p>

        {error && <div className="plos-alert" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="plos-field">
            <label className="label" htmlFor="reg-name">Your name</label>
            <input
              id="reg-name"
              className="input"
              value={name}
              placeholder="Rohan"
              autoComplete="given-name"
              required
              aria-invalid={nameMissing && error ? 'true' : undefined}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="help">
              {nameMissing
                ? 'PLOS greets you by name on Today and in emails.'
                : `We'll call you ${trimmedName}.`}
            </div>
          </div>

          <div className="plos-field">
            <label className="label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={trimmedEmail.length > 0 && !emailValid ? 'true' : undefined}
            />
            <div
              className="help"
              style={
                trimmedEmail.length > 0 && !emailValid
                  ? { color: '#ef4444' }
                  : undefined
              }
            >
              {trimmedEmail.length === 0
                ? 'Used to sign in and for email notifications.'
                : emailValid
                  ? 'Looks good.'
                  : 'Use the format you@example.com.'}
            </div>
          </div>

          <div className="plos-field">
            <label className="label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={passwordTooShort ? 'true' : undefined}
            />
            <div
              className="help"
              style={
                passwordTooShort
                  ? { color: '#ef4444' }
                  : password.length >= 8
                    ? { color: passwordScore.tone }
                    : undefined
              }
            >
              {password.length === 0
                ? 'At least 8 characters. Mix in numbers or symbols for a stronger password.'
                : passwordTooShort
                  ? `${8 - password.length} more character${
                      8 - password.length === 1 ? '' : 's'
                    } to go.`
                  : `Strength: ${passwordScore.label}.`}
            </div>
          </div>

          <div style={{ marginTop: 18, marginBottom: 18 }}>
            <AccountTypePicker value={accountType} onChange={setAccountType} />
          </div>

          {showHousehold && (
            <HouseholdMembersSection members={householdMembers} onChange={setHouseholdMembers} />
          )}

          <button
            type="submit"
            className="plos-cta plos-cta-block"
            disabled={loading || !canSubmit}
            style={{ width: '100%', marginTop: 18 }}
          >
            {loading ? 'Creating your account…' : "Get started — it's free"}
          </button>
        </form>

        <div className="plos-auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}

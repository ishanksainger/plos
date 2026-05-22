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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="plos-field">
            <label className="label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="help">Required — used to sign in and for email notifications.</div>
          </div>

          <div className="plos-field">
            <label className="label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="help">At least 6 characters.</div>
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
            disabled={loading}
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

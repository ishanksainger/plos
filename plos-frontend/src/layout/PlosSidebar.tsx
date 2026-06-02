import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import { usePlan } from '../hooks/usePlan';

/* Icons inlined to match the prototype's stroke / sizing exactly. */
const Icon = {
  today: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v14H4V6Z" />
      <path d="M4 9h16M8 4v3M16 4v3" />
    </svg>
  ),
  insights: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5M9 19V11M14 19V8M19 19V14" />
    </svg>
  ),
  finance: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12M6 8h12M6 12h7" />
      <path d="M16 14l3 3-3 3" />
      <path d="M19 17H6a3 3 0 0 1 0-6" />
    </svg>
  ),
  health: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  habits: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="16" r="3" />
      <path d="M8 11v2a3 3 0 0 0 3 3h2" />
    </svg>
  ),
  people: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  timeline: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  notif: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  settings: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  plans: (
    <svg className="plos-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 3 7v6c0 5 3.8 8.5 9 9 5.2-.5 9-4 9-9V7l-9-5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

/** Short label for the current tier, shown as a chip by the brand. */
const TIER_BADGE: Record<string, { label: string; tone: string } | null> = {
  free: null,
  pro: { label: 'Pro', tone: 'var(--brand, #7c4fff)' },
  family: { label: 'Family', tone: 'var(--brand, #7c4fff)' },
  founding: { label: 'Founding', tone: '#b8860b' },
};

const DAILY = [
  { to: '/',         label: 'Today',    icon: Icon.today,    exact: true },
  { to: '/insights', label: 'Insights', icon: Icon.insights, exact: false },
];

const MODULES = [
  { to: '/finance', label: 'Finance', icon: Icon.finance, exact: false },
  { to: '/health',  label: 'Health',  icon: Icon.health,  exact: false },
  { to: '/habits',  label: 'Habits',  icon: Icon.habits,  exact: false },
];

const LIFE = [
  { to: '/people',   label: 'People',   icon: Icon.people,   exact: false },
  { to: '/timeline', label: 'Timeline', icon: Icon.timeline, exact: false },
];

function NavRow({
  to,
  label,
  icon,
  active,
  badge,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link to={to} className={`plos-nav-item ${active ? 'active' : ''}`} onClick={onNavigate}>
      {icon}
      <span>{label}</span>
      {badge && badge > 0 ? <span className="plos-nav-badge">{badge}</span> : null}
    </Link>
  );
}

export default function PlosSidebar({
  unread = 0,
  onNavigate,
}: {
  unread?: number;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { tier, isFreeTier } = usePlan();
  const tierBadge = TIER_BADGE[tier] ?? null;

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'P';
  const displayName = user?.name ?? user?.email ?? 'Account';
  const cityLine = 'Family · Pune';

  const signOut = () => {
    dispatch(logout());
    queryClient.removeQueries({ queryKey: ['dashboard'] });
    navigate('/login');
    onNavigate?.();
  };

  return (
    <aside className="plos-sidebar">
      <div className="plos-brand">
        <div className="plos-brand-mark">P</div>
        <div className="plos-brand-text">
          <span className="name">PLOS</span>
          <span className="who">Personal Life OS</span>
        </div>
        {tierBadge && (
          <span
            title={`${tierBadge.label} plan`}
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: tierBadge.tone,
              border: `1px solid ${tierBadge.tone}55`,
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            {tierBadge.label}
          </span>
        )}
      </div>

      <div className="plos-section-label">Daily</div>
      {DAILY.map((n) => (
        <NavRow key={n.to} {...n} active={isActive(n.to, n.exact)} onNavigate={onNavigate} icon={n.icon} />
      ))}

      <div className="plos-section-label">Modules</div>
      {MODULES.map((n) => (
        <NavRow key={n.to} {...n} active={isActive(n.to, n.exact)} onNavigate={onNavigate} icon={n.icon} />
      ))}

      <div className="plos-section-label">Life</div>
      {LIFE.map((n) => (
        <NavRow key={n.to} {...n} active={isActive(n.to, n.exact)} onNavigate={onNavigate} icon={n.icon} />
      ))}

      <NavRow
        to="/notifications"
        label="Notifications"
        icon={Icon.notif}
        active={isActive('/notifications', false)}
        badge={unread}
        onNavigate={onNavigate}
      />
      <NavRow
        to="/pricing"
        label="Plans"
        icon={Icon.plans}
        active={isActive('/pricing', false)}
        onNavigate={onNavigate}
      />
      <NavRow
        to="/settings"
        label="Settings"
        icon={Icon.settings}
        active={isActive('/settings', false)}
        onNavigate={onNavigate}
      />

      {isFreeTier && (
        <Link
          to="/pricing"
          onClick={onNavigate}
          style={{
            display: 'block',
            margin: '12px 4px 0',
            padding: '12px 14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124,79,255,0.14), rgba(124,79,255,0.05))',
            border: '1px solid rgba(124,79,255,0.28)',
            textDecoration: 'none',
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand, #7c4fff)' }}>
            Upgrade to Pro
          </div>
          <div style={{ fontSize: 11, color: 'var(--plos-ink-3)', marginTop: 2 }}>
            Unlimited everything + WhatsApp
          </div>
        </Link>
      )}

      <div className="plos-user-card">
        <div className="plos-avatar">{initial}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--plos-ink-1)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--plos-ink-3)' }}>{cityLine}</div>
        </div>
        <button
          type="button"
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out"
          style={{
            background: 'transparent',
            color: 'var(--plos-ink-3)',
            padding: 4,
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

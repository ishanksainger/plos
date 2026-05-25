import { useNavigate } from 'react-router-dom';
import { PlosSearchPopover } from '../components/plos/PlosSearchPopover';

const BellIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

const PlusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MenuIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export default function PlosTopbar({
  unread = 0,
  onAddClick,
  onMenuClick,
}: {
  unread?: number;
  onAddClick?: () => void;
  onMenuClick?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="plos-topbar">
      {onMenuClick && (
        <button
          className="plos-icon-btn plos-menu-btn"
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          {MenuIcon}
        </button>
      )}
      <a
        href={(import.meta as any).env?.VITE_NIS_URL ?? 'http://localhost:3000'}
        className="plos-back"
      >
        <svg width="12" height="12" viewBox="0 0 14 10" fill="none">
          <path d="M13 5H1m0 0l4-4M1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        NIS
      </a>
      <PlosSearchPopover />
      <div className="plos-topbar-actions">
        <button
          className="plos-icon-btn"
          type="button"
          title="Notifications"
          onClick={() => navigate('/notifications')}
        >
          {BellIcon}
          {unread > 0 && <span className="badge" />}
        </button>
        <button
          className="plos-cta"
          type="button"
          onClick={onAddClick}
          aria-label="New responsibility"
        >
          {PlusIcon}
          <span className="plos-cta-label">New responsibility</span>
        </button>
      </div>
    </div>
  );
}

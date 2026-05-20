import type { ElementType } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Stack, Text } from '@mantine/core';
import {
  IconAdjustmentsHorizontal,
  IconChartBar,
  IconChartDots,
  IconFolder,
  IconHome,
  IconLogout,
  IconSettings,
} from '@tabler/icons-react';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';

const RAIL_W = 'var(--pl-sidebar-width)';

/**
 * Sidebar row styled to match frozen myWallet reference (white active pill · flat #8e70ff rail).
 */
const NavRow = ({
  to,
  icon: Icon,
  label,
  active,
  onNavigate,
}: {
  to: string;
  icon: ElementType;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) => (
  <Link
    to={to}
    onClick={onNavigate}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 14px',
      borderRadius: 14,
      textDecoration: 'none',
      background: active ? '#ffffff' : 'transparent',
      color: active ? '#111827' : 'rgba(255,255,255,0.95)',
      boxShadow: active ? '0 8px 24px rgba(17,24,39,0.12)' : 'none',
      fontWeight: active ? 700 : 600,
      transition: 'background 0.15s ease, color 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
  >
    <Icon size={22} stroke={active ? 2.05 : 1.75} style={{ flexShrink: 0, opacity: active ? 1 : 0.94 }} />
    <Text fz={14} lh={1.2} inherit>
      {label}
    </Text>
  </Link>
);

interface AppSidebarProps {
  variant?: 'rail' | 'drawer';
  onNavigate?: () => void;
}

/**
 * Vertical nav matching myWallet reference labeling (routes wired to nearest PLOS pages).
 */
const AppSidebar = ({ variant = 'rail', onNavigate }: AppSidebarProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const is = (path: string, exact = false) => (exact ? pathname === path : pathname.startsWith(path));

  const shellStyle: React.CSSProperties = {
    width: variant === 'rail' ? RAIL_W : '100%',
    minHeight: variant === 'rail' ? 0 : '100vh',
    height: variant === 'rail' ? '100%' : undefined,
    maxHeight: variant === 'rail' ? '100%' : undefined,
    position: 'relative',
    background: 'var(--sidebar-gradient, #8e70ff)',
    borderRadius: variant === 'rail' ? 26 : 0,
    padding: variant === 'rail' ? '24px 16px 20px' : '24px 20px 28px',
    boxShadow:
      variant === 'rail'
        ? '0 22px 56px rgba(72,36,158,0.52), inset 0 1px 0 rgba(255,255,255,0.20)'
        : 'none',
    border:
      variant === 'rail'
        ? '1px solid rgba(255,255,255,0.38)'
        : 'none',
    display: 'flex',
    flexDirection: 'column',
    overflowY: variant === 'rail' ? 'auto' : undefined,
    overscrollBehavior: 'contain',
  };

  const signOut = () => {
    dispatch(logout());
    queryClient.removeQueries({ queryKey: ['dashboard'] });
    navigate('/login');
    onNavigate?.();
  };

  return (
    <Box style={shellStyle}>
      <Link
        to="/"
        onClick={onNavigate}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 28,
          padding: '6px 4px',
          textDecoration: 'none',
        }}
      >
        <IconFolder size={28} stroke={1.85} style={{ flexShrink: 0, color: '#ffffff' }} />
        <Text fw={900} fz={21} style={{ color: '#ffffff', letterSpacing: '-0.03em' }}>
          myWallet
        </Text>
      </Link>

      <Stack gap={6} style={{ flex: 1 }}>
        <NavRow to="/" icon={IconHome} label="Home" active={is('/', true)} onNavigate={onNavigate} />
        <NavRow to="/responsibilities" icon={IconFolder} label="Files" active={is('/responsibilities')} onNavigate={onNavigate} />
        <NavRow to="/finance" icon={IconChartDots} label="Analytics" active={is('/finance')} onNavigate={onNavigate} />
        <NavRow to="/timeline" icon={IconChartBar} label="Charts" active={is('/timeline')} onNavigate={onNavigate} />
        <NavRow to="/people" icon={IconAdjustmentsHorizontal} label="Filter" active={is('/people')} onNavigate={onNavigate} />
        <NavRow to="/settings" icon={IconSettings} label="Settings" active={is('/settings')} onNavigate={onNavigate} />
      </Stack>

      <Box
        style={{
          marginTop: 'auto',
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.22)',
          flexShrink: 0,
        }}
      >
        <Box
          style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: '16px 14px',
            boxShadow: '0 14px 32px rgba(0,0,0,0.12)',
          }}
        >
          <Box
            style={{
              height: 64,
              borderRadius: 14,
              marginBottom: 12,
              background: 'linear-gradient(135deg, #ffe082 0%, #ffcc80 40%, #f48fb1 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              aria-hidden
              style={{
                position: 'absolute',
                bottom: -8,
                right: 14,
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(145deg,#6d4cae,#8e70ff)',
                opacity: 0.92,
              }}
            />
            <Box
              aria-hidden
              style={{
                position: 'absolute',
                bottom: 4,
                left: 12,
                width: 44,
                height: 56,
                borderRadius: '50% 50% 12px 12px',
                background: '#5e35b1',
                opacity: 0.95,
              }}
            />
          </Box>
          <Text fz={12} lh={1.45} fw={700} style={{ color: '#374151', textAlign: 'center', marginBottom: 12 }}>
            Become a{' '}
            <Text span inherit fw={900} component="span" style={{ color: '#111827' }}>
              Pro{' '}
            </Text>
            to get more{' '}
            <Text span inherit fw={900} component="span" style={{ color: '#111827' }}>
              Features
            </Text>
          </Text>
          <button
            type="button"
            style={{
              width: '100%',
              border: 'none',
              cursor: 'pointer',
              padding: '12px 14px',
              borderRadius: 999,
              background: '#8e70ff',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: 'inherit',
              boxShadow: '0 8px 20px rgba(142,112,255,0.45)',
            }}
          >
            Upgrade
          </button>
        </Box>

        <button
          type="button"
          onClick={signOut}
          style={{
            marginTop: 18,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 4px',
            borderRadius: 12,
            border: 'none',
            background: 'transparent',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <IconLogout size={20} stroke={1.65} />
          Log Out
        </button>
      </Box>
    </Box>
  );
};

export default AppSidebar;

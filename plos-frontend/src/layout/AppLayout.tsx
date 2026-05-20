import { Box, Drawer, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppHeader from './Header';
import AppSidebar from './Sidebar';
import ErrorBoundary from '../components/ErrorBoundary';

/** Horizontal breathing room scales down on narrower viewports. */
const SHELL_PADDING = 'clamp(10px, 2vw, 24px)';

/**
 * Light shell · purple sidebar rail · rounded white workspace (myWallet-inspired).
 */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileNav, setMobileNav] = useState(false);
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const location = useLocation();

  /** Desktop: lock shell height so only main workspace scrolls; sidebar stays viewport-aligned. */
  const desktopShellLocked = !isNarrow;
  const isTintedWorkspace = location.pathname === '/' || location.pathname === '/insights';

  return (
    <Box
      style={{
        boxSizing: 'border-box',
        minHeight: '100vh',
        ...(desktopShellLocked
          ? { height: '100vh', maxHeight: '100vh', overflow: 'hidden', alignItems: 'stretch' as const }
          : { alignItems: isNarrow ? 'stretch' : 'flex-start' }),
        background: 'var(--shell-bg)',
        display: 'flex',
        flexDirection: isNarrow ? 'column' : 'row',
        gap: isNarrow ? 12 : 20,
        padding: SHELL_PADDING,
      }}
    >
      {!isNarrow && (
        <Box
          style={{
            flexShrink: 0,
            display: 'flex',
            alignSelf: 'stretch',
            minHeight: 0,
            /** Match vertical shell padding (~24px × 2) so rail fits viewport */
            maxHeight: 'calc(100vh - 48px)',
          }}
        >
          <AppSidebar variant="rail" />
        </Box>
      )}

      <Drawer
        opened={isNarrow && mobileNav}
        onClose={() => setMobileNav(false)}
        padding={0}
        size={280}
        withCloseButton={false}
        overlayProps={{ opacity: 0.35, blur: 2 }}
        styles={{ content: { background: 'transparent' } }}
      >
        <ScrollArea.Autosize mah="100vh">
          <AppSidebar
            variant="drawer"
            onNavigate={() => setMobileNav(false)}
          />
        </ScrollArea.Autosize>
      </Drawer>

      <Box
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          style={{
            flex: 1,
            minHeight: desktopShellLocked ? 0 : isNarrow ? 'auto' : 'calc(100vh - 26px)',
            minWidth: 0,
            background: 'var(--surface)',
            borderRadius: isNarrow ? 20 : 22,
            border: '1px solid rgba(255,255,255,0.92)',
            boxShadow: 'var(--pl-shadow-shell)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AppHeader openMobileNav={() => setMobileNav(true)} />

          <ErrorBoundary resetKey={location.pathname}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={isTintedWorkspace ? 'plos-workspace-dashboard' : undefined}
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                padding: 'clamp(16px, 2.4vw, 26px) 0 clamp(28px, 4vw, 44px)',
                ...(!isTintedWorkspace
                  ? { background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 32%)' }
                  : {}),
              }}
            >
              {children}
            </motion.div>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;

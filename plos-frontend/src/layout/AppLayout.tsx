import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import { Drawer, ScrollArea } from '@mantine/core';
import { motion } from 'framer-motion';
import PlosSidebar from './PlosSidebar';
import PlosTopbar from './PlosTopbar';
import ErrorBoundary from '../components/ErrorBoundary';
import { requestDashboardNewResponsibility } from '../utils/dashboard-create-bridge';
import { usePlosMouseMesh } from '../components/plos/usePlosMouseMesh';
import { PlosInstallPrompt } from '../components/plos/PlosInstallPrompt';
import LimitReachedModal from '../components/billing/LimitReachedModal';
import { useAppSelector } from '../store/hooks';

/**
 * Glassy light shell, ported from the design prototype.
 * Layout: 260px sidebar + main column, both inside a `.plos` wrapper
 * whose background gradient mesh lives on `body.plos-body`.
 */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileNav, setMobileNav] = useState(false);
  const isNarrow = useMediaQuery('(max-width: 900px)');
  const location = useLocation();
  const theme = useAppSelector((s) => s.ui.theme);

  // Apply the body class + theme attribute once on mount. The attribute
  // also lives on .plos for the prototype CSS selectors; mirroring it on
  // body keeps full-bleed elements (modals, drawers) consistent.
  useEffect(() => {
    document.body.classList.add('plos-body');
    return () => {
      document.body.classList.remove('plos-body');
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.plosTheme = theme;
    return () => {
      delete document.documentElement.dataset.plosTheme;
    };
  }, [theme]);

  // Drive the body mesh gradient off the cursor.
  usePlosMouseMesh(!isNarrow);

  return (
    <div className="plos" data-theme={theme} data-display="sans">
      {!isNarrow && <PlosSidebar />}

      <Drawer
        opened={Boolean(isNarrow && mobileNav)}
        onClose={() => setMobileNav(false)}
        padding={0}
        size={280}
        withCloseButton={false}
        overlayProps={{ opacity: 0.35, blur: 2 }}
        styles={{ content: { background: 'transparent' } }}
      >
        <ScrollArea.Autosize mah="100vh">
          <PlosSidebar onNavigate={() => setMobileNav(false)} />
        </ScrollArea.Autosize>
      </Drawer>

      <main className="plos-main">
        <PlosTopbar
          onAddClick={() => requestDashboardNewResponsibility()}
          onMenuClick={isNarrow ? () => setMobileNav(true) : undefined}
        />

        <ErrorBoundary resetKey={location.pathname}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </ErrorBoundary>
      </main>
      <PlosInstallPrompt />
      <LimitReachedModal />
    </div>
  );
};

export default AppLayout;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import './index.css';
import App from './App.tsx';
import { store } from './store/store.ts';
import { BRAND, BRAND_VIOLET_SCALE } from './theme/brand.ts';
import { initAnalytics, identifyUser, trackAppOpened } from './lib/analytics.ts';
import { initSentry } from './lib/sentry.ts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

void initSentry();
initAnalytics();

const storedUser = localStorage.getItem('plos_user');
if (storedUser) {
  try {
    const u = JSON.parse(storedUser) as { id?: number; email?: string; name?: string | null };
    if (typeof u.id === 'number' && typeof u.email === 'string') {
      identifyUser(u.id, u.email, u.name);
      trackAppOpened();
    }
  } catch {
    /* ignore */
  }
}

const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'xl',
  fontFamily: BRAND.fontFamily,
  fontSizes: {
    xs: '0.7rem',
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
  },
  colors: {
    gray: [
      '#F9FAFB',
      '#F3F4F6',
      '#E5E7EB',
      '#D1D5DB',
      '#9CA3AF',
      '#6B7280',
      '#4B5563',
      '#374151',
      '#1F2937',
      '#111827',
    ],
    violet: [...BRAND_VIOLET_SCALE],
  },
  components: {
    Paper: {
      defaultProps: { radius: 'md', withBorder: false },
      styles: { root: { boxShadow: 'var(--pl-shadow-card)', color: 'var(--text-primary)' } },
    },
    Card: {
      defaultProps: { radius: 'md', withBorder: false },
      styles: { root: { boxShadow: 'var(--pl-shadow-card)', color: 'var(--text-primary)' } },
    },
    Modal: {
      defaultProps: { radius: 'md' },
      styles: {
        header: { background: 'var(--surface)', borderBottom: '1px solid var(--border)' },
        title: { color: 'var(--text-primary)', fontWeight: 700 },
        content: { background: 'var(--surface)' },
        body: { color: 'var(--text-primary)' },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MantineProvider defaultColorScheme="light" forceColorScheme="light" theme={theme}>
            <Notifications position="top-right" />
            <App />
          </MantineProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);

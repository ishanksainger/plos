type PosthogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
};

let posthog: PosthogClient | null = null;

/**
 * Initializes PostHog when `VITE_POSTHOG_KEY` is set.
 */
export function initAnalytics(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com';
  if (!key?.trim()) return;

  import('posthog-js')
    .then((mod) => {
      mod.default.init(key, { api_host: host, person_profiles: 'identified_only' });
      posthog = mod.default as PosthogClient;
    })
    .catch(() => {
      /* optional dependency */
    });
}

/**
 * Tracks a product analytics event (no-op without PostHog).
 */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  posthog?.capture(event, properties);
}

/**
 * Identifies the signed-in user for analytics.
 */
export function identifyUser(userId: number, email: string, name?: string | null): void {
  posthog?.identify(String(userId), { email, name: name ?? undefined });
}

/**
 * Fires after successful login / session restore.
 */
export function trackAppOpened(): void {
  trackEvent('app_opened');
}

/**
 * Fires when the Today home view loads.
 */
export function trackTodayViewLoaded(overdueCount: number, dueTodayCount: number): void {
  trackEvent('today_view_loaded', { overdue_count: overdueCount, due_today_count: dueTodayCount });
}

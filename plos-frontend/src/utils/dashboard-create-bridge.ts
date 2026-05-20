/**
 * Lightweight bridge so UI outside the dashboard tree (e.g. AppHeader) can open the
 * same create-responsibility modal registered by DashboardPlosAnalytics.
 */
let dashboardCreateOpener: (() => void) | null = null;

/**
 * Sets the opener callback while the dashboard is mounted; clears on unmount.
 */
export function registerDashboardCreateResponsibilityHandler(fn: (() => void) | null): void {
  dashboardCreateOpener = fn;
}

/**
 * Opens the dashboard create modal if the dashboard is mounted and registered.
 */
export function requestDashboardNewResponsibility(): void {
  dashboardCreateOpener?.();
}

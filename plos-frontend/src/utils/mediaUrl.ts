/**
 * Resolves a backend-relative media path (e.g. `/uploads/avatars/...`) to a fetchable URL.
 */
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed) {
    return `${trimmed.replace(/\/$/, '')}${path}`;
  }
  if (import.meta.env.DEV) {
    return path;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const h = window.location.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') {
      return path;
    }
    return `${window.location.origin}${path}`;
  }
  return `http://127.0.0.1:3001${path}`;
}

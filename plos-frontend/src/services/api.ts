import { logout } from '../store/authSlice';
import { store } from '../store/store';

/**
 * Error thrown by every API call. Extends Error (so existing `.message`
 * consumers keep working) but also carries the HTTP `status` and the parsed
 * response `body`, so callers can branch on structured codes — e.g. the
 * `PLAN_LIMIT_REACHED` 403 that opens the upgrade modal.
 */
export class ApiError extends Error {
  status: number;
  /** Machine-readable code from the backend body, when present. */
  code?: string;
  /** The parsed JSON response body, when the server returned one. */
  body?: Record<string, unknown>;

  constructor(message: string, status: number, body?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    if (body && typeof body.code === 'string') this.code = body.code;
  }
}

/** Narrow an unknown error to the plan-limit 403 the upgrade modal listens for. */
export function isPlanLimitError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.code === 'PLAN_LIMIT_REACHED';
}

/** Pull a human message out of a parsed error body, falling back to `fallback`. */
function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const m = (body as { message?: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return fallback;
}

/**
 * API origin: `VITE_API_BASE_URL` if set; otherwise in dev use same-origin `/api` (Vite proxy);
 * for production builds opened on localhost/`127.*` (including `vite preview`), also use `/api`
 * when `preview.proxy` is configured so local testing works without rebuild.
 * Else fall back to the current site origin (monolith-style deploy) or localhost:3001 as last resort.
 */
function apiOriginAndPrefix(): { origin: string; prefix: string } {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed) {
    return { origin: trimmed.replace(/\/$/, ''), prefix: '' };
  }
  if (import.meta.env.DEV) {
    return { origin: '', prefix: '/api' };
  }

  const isLocalHost = (): boolean => {
    if (typeof window === 'undefined' || !window.location?.hostname) return false;
    const h = window.location.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  };

  if (typeof window !== 'undefined' && isLocalHost()) {
    return { origin: '', prefix: '/api' };
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return { origin: window.location.origin, prefix: '' };
  }
  return { origin: 'http://127.0.0.1:3001', prefix: '' };
}

function getToken(): string | null {
  return localStorage.getItem('plos_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { origin, prefix } = apiOriginAndPrefix();
  const url = `${origin}${prefix}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let body: Record<string, unknown> | undefined;
    let message = `Request failed (${res.status})`;
    try {
      body = (await res.json()) as Record<string, unknown>;
      message = messageFromBody(body, message);
    } catch {
      message = res.statusText || message;
    }

    if (res.status === 401) {
      const isPublicAuth =
        path.startsWith('/auth/login') || path.startsWith('/auth/register');
      if (!isPublicAuth && getToken()) {
        store.dispatch(logout());
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          window.location.assign('/login');
        }
      }
    }

    throw new ApiError(message, res.status, body);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const { origin, prefix } = apiOriginAndPrefix();
  const url = `${origin}${prefix}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let body: Record<string, unknown> | undefined;
    let message = `Upload failed (${res.status})`;
    try {
      body = (await res.json()) as Record<string, unknown>;
      message = messageFromBody(body, message);
    } catch {
      message = res.statusText || message;
    }
    throw new ApiError(message, res.status, body);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),
};

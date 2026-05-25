/**
 * Triggers a download of the user's account data. Uses fetch + Blob so
 * we can attach the Authorization header (a plain <a download> can't).
 */

export type ExportFormat = 'json' | 'csv';

function apiOrigin(): { origin: string; prefix: string } {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed) return { origin: trimmed.replace(/\/$/, ''), prefix: '' };
  if (import.meta.env.DEV) return { origin: '', prefix: '/api' };
  if (typeof window !== 'undefined' && window.location?.origin) {
    return { origin: window.location.origin, prefix: '' };
  }
  return { origin: 'http://127.0.0.1:3001', prefix: '' };
}

export async function downloadExport(format: ExportFormat): Promise<void> {
  const { origin, prefix } = apiOrigin();
  const token = localStorage.getItem('plos_token');
  const url = `${origin}${prefix}/users/export?format=${format}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const filename = parseFilename(res.headers.get('content-disposition')) ??
    `plos-export-${new Date().toISOString().slice(0, 10)}.${format}`;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click cycle so Safari has time to act on it.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match ? decodeURIComponent(match[1]) : null;
}

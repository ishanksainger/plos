'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * First-party, privacy-clean pageview beacon.
 *
 * - Fires only in a real browser (crawlers don't run JS), so counts are humans,
 *   not bots.
 * - No cookies and no PII. An ephemeral `sessionStorage` id lets us count
 *   "visits" without tracking anyone across sessions — it dies when the tab
 *   closes and is never linked to identity.
 * - Delivered via `sendBeacon` (falls back to a keepalive fetch), so it can
 *   never block, slow, or error a page render.
 */
function sessionId(): string {
  try {
    const KEY = 'nis_sid';
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id =
        (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage blocked — still count the view, just without a
    // stable session id.
    return 'anon';
  }
}

export default function PageViewBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;

    try {
      const payload = JSON.stringify({ p: pathname, s: sessionId() });
      const blob = new Blob([payload], { type: 'application/json' });
      const sent =
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/api/pv', blob);
      if (!sent) {
        void fetch('/api/pv', {
          method: 'POST',
          body: payload,
          keepalive: true,
          headers: { 'content-type': 'application/json' },
        }).catch(() => {});
      }
    } catch {
      // Analytics must never throw into the app.
    }
  }, [pathname]);

  return null;
}

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// SPA PageView tracker. The Meta Pixel base code + the first PageView are a
// parse-time inline script in the root layout (so `window.fbq` exists before any
// component effect — e.g. a product page's ViewContent — can run). Because this
// is a Next App Router SPA, route changes don't reload the page, so we re-fire
// PageView on each client-side pathname change — skipping the first run, which
// the base snippet's initial PageView already covers.
export default function MetaPixel() {
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
}

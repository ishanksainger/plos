'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Meta (Facebook) Pixel base code. Loads fbevents.js, inits the pixel and
// fires the first PageView. Because this is a Next App Router SPA (route
// changes don't reload the page), we also re-fire PageView on every client-side
// pathname change — skipping the very first run so the one the base snippet
// already fired isn't double-counted.
//
// Pixel ID comes from NEXT_PUBLIC_META_PIXEL_ID, falling back to the known NIS
// pixel so the tag works even if the build-time env var isn't set (mirrors the
// NEXT_PUBLIC_PLOS_URL pattern). A NEXT_PUBLIC_ value is inlined at build time.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1150082800937167';

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

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's tracking pixel must be a bare <img>, not next/image */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

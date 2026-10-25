import type { Metadata } from 'next';
import Script from 'next/script';
import { Sora, Instrument_Serif, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import PageViewBeacon from '@/components/PageViewBeacon';
import MetaPixel from '@/components/MetaPixel';

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.js';

// Meta (Facebook) Pixel id. Env override with a hardcoded fallback so the tag
// works without a build-arg change (mirrors NEXT_PUBLIC_PLOS_URL).
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1150082800937167';

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Geist isn't in next/font/google on Next 14; using Inter + JetBrains Mono
// under the same CSS variable names so the prototype stylesheets resolve.
const geist = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thenispace.com'),
  title: {
    default: 'NIS — Your creative nest. Built for India.',
    template: '%s — NIS',
  },
  description:
    'NIS (Nest of Innovative Space) — Indian-rupee-native trackers, canvases, merch, and PLOS, the personal life operating system.',
  openGraph: {
    title: 'NIS — Your creative nest. Built for India.',
    description:
      'Trackers, canvases, merch, and PLOS, the personal life operating system. INR-native.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${instrumentSerif.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body>
        {/* Meta Pixel base code — a parse-time inline script (not next/script),
            so window.fbq exists before any React effect (e.g. a product page's
            ViewContent) can run and get dropped. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- Meta tracking pixel must be a bare 1x1 img */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <MetaPixel />
        {children}
        <PageViewBeacon />
        {PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src={PLAUSIBLE_SRC}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Sora, Instrument_Serif, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}

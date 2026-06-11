import type { Metadata } from 'next';
import Link from 'next/link';
import { NisShell } from '@/components/nis/Shell';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for has moved or never existed.',
};

const SUGGESTIONS: Array<{ href: string; label: string; hint: string }> = [
  { href: '/',                 label: 'Home',     hint: 'Start at the studio nest' },
  { href: '/trackers',         label: 'Trackers', hint: 'INR-native sheets' },
  { href: '/ebooks',           label: 'E-books',  hint: 'Guides for Indian freelancers' },
  { href: '/plos',             label: 'PLOS',     hint: 'The life OS' },
  { href: '/about',            label: 'About',    hint: 'A two-person studio' },
];

export default function NotFound() {
  return (
    <NisShell>
      <section className="nis-section nis-404">
        <div className="nis-section-eyebrow">404</div>
        <h1
          className="nis-h2"
          style={{
            fontSize: 'clamp(64px, 12vw, 144px)',
            margin: '12px 0 24px',
            lineHeight: 0.92,
          }}
        >
          We don&rsquo;t have{' '}
          <em
            style={{
              fontFamily: 'var(--nis-font-serif)',
              fontStyle: 'italic',
              color: 'var(--accent)',
            }}
          >
            this page
          </em>
          .
        </h1>
        <p
          style={{
            margin: '0 0 36px',
            fontSize: 'clamp(16px, 1.5vw, 19px)',
            color: 'var(--ink-2)',
            maxWidth: '52ch',
            lineHeight: 1.55,
          }}
        >
          It might have moved, or you may have caught us between renames. Try one of
          these instead — or write to{' '}
          <a href="mailto:hello@thenispace.com" style={{ color: 'var(--accent)' }}>
            hello@thenispace.com
          </a>{' '}
          and we&rsquo;ll point you the right way.
        </p>

        <ul className="nis-404-list">
          {SUGGESTIONS.map((s, i) => (
            <li key={s.href}>
              <Link href={s.href} className="nis-404-row">
                <span className="nis-404-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="nis-404-row-main">
                  <span className="nis-404-row-title">{s.label}</span>
                  <span className="nis-404-row-hint">{s.hint}</span>
                </span>
                <span className="nis-404-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </NisShell>
  );
}

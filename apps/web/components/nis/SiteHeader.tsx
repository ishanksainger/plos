'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/',         label: 'Home' },
  { href: '/trackers', label: 'Trackers' },
  { href: '/canvas',   label: 'Canvas' },
  { href: '/shop',     label: 'Shop' },
  { href: '/plos',     label: 'PLOS' },
  { href: '/about',    label: 'About' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="nis-header">
      <div className="nis-header-inner">
        <Link href="/" className="nis-logo">
          <span className="nis-mark" />
          <span>NIS</span>
        </Link>
        <nav className="nis-nav">
          {LINKS.map((l) => {
            const active =
              l.href === '/'
                ? pathname === '/'
                : pathname === l.href || pathname.startsWith(l.href + '/');
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nis-nav-link ${active ? 'active' : ''}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="nis-header-actions">
          <button className="nis-btn" type="button">Sign in</button>
          <Link href="/plos" className="nis-btn nis-btn-primary">Open PLOS</Link>
        </div>
      </div>
    </header>
  );
}

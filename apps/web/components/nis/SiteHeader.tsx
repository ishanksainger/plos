'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CartButton } from './CartButton';

const LINKS = [
  { href: '/',         label: 'Home' },
  { href: '/trackers', label: 'Trackers' },
  { href: '/canvas',   label: 'Canvas' },
  { href: '/shop',     label: 'Shop' },
  { href: '/plos',     label: 'PLOS' },
  { href: '/about',    label: 'About' },
];

const PLOS_URL = process.env.NEXT_PUBLIC_PLOS_URL ?? 'http://localhost:5173';
const SIGN_IN_HREF = `${PLOS_URL.replace(/\/+$/, '')}/login`;

function isActive(pathname: string, href: string) {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(href + '/');
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Close the menu when the route changes (e.g. user clicks a link).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="nis-header">
      <div className="nis-header-inner">
        <Link href="/" className="nis-logo">
          <span className="nis-mark" />
          <span>NIS</span>
        </Link>

        <nav className="nis-nav" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nis-nav-link ${isActive(pathname, l.href) ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nis-header-actions">
          <a className="nis-btn" href={SIGN_IN_HREF}>Sign in</a>
          <Link href="/plos" className="nis-btn nis-btn-primary">Open PLOS</Link>
          <CartButton />
          <button
            type="button"
            className="nis-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nis-mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span aria-hidden="true" data-state={menuOpen ? 'open' : 'closed'}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <div
        id="nis-mobile-menu"
        className={`nis-mobile-menu ${menuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!menuOpen}
        {...(!menuOpen ? { inert: '' as unknown as boolean } : {})}
      >
        <button
          type="button"
          className="nis-mobile-menu-backdrop"
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
        />
        <div className="nis-mobile-menu-sheet">
          <nav className="nis-mobile-nav" aria-label="Mobile primary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nis-mobile-nav-link ${isActive(pathname, l.href) ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="nis-mobile-menu-actions">
            <a className="nis-btn" href={SIGN_IN_HREF} onClick={() => setMenuOpen(false)}>
              Sign in
            </a>
            <Link
              href="/plos"
              className="nis-btn nis-btn-primary"
              onClick={() => setMenuOpen(false)}
            >
              Open PLOS
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

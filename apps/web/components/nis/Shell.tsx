'use client';

import { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { CartDrawer } from './CartDrawer';

export function NisShell({
  pillar,
  children,
}: {
  pillar?: 'trackers' | 'canvas' | 'shop' | 'plos' | 'about' | 'legal';
  children: ReactNode;
}) {
  return (
    <div className="nis" data-direction="safe" data-display="sans" data-orb="on">
      <SiteHeader />
      <main className="nis-page" key={pillar ?? 'home'}>
        {pillar && <div className="nis-page-bg" data-pillar={pillar} />}
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}

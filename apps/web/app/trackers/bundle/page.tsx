import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { BundlePage } from '@/components/nis/pages/BundlePage';
import { ProductJsonLd } from '@/components/nis/ProductJsonLd';
import { BUNDLE } from '@/lib/tracker-catalog';

export const metadata: Metadata = {
  title: 'All-Trackers Bundle',
  description:
    'All four NIS trackers — Freelancer GST, Household Money, Indian Wedding, Small Business Cashflow — at 25% off the sum of individual prices. Lifetime access, price locked.',
};

export default function Page() {
  return (
    <NisShell pillar="trackers">
      <ProductJsonLd
        slug="bundle"
        title={BUNDLE.title}
        description={BUNDLE.description}
        pricePaise={BUNDLE.pricePaise}
        isAvailable={BUNDLE.active}
        catalogEntry={BUNDLE}
      />
      <BundlePage />
    </NisShell>
  );
}

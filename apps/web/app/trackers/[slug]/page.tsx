import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NisShell } from '@/components/nis/Shell';
import { TrackerDetailPage } from '@/components/nis/pages/TrackerDetailPage';
import { ProductJsonLd } from '@/components/nis/ProductJsonLd';
import { NIS_TRACKERS } from '@/lib/nis-data';
import { getTracker } from '@/lib/tracker-catalog';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  // Only pre-render trackers with a real file behind them (active in the
  // commerce catalog). Hidden placeholders 404 via the check in Page().
  return NIS_TRACKERS.filter((t) => getTracker(t.slug)?.active).map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const t = NIS_TRACKERS.find((x) => x.slug === params.slug);
  if (!t) return { title: 'Tracker not found' };
  return { title: t.title, description: t.tagline };
}

export default function Page({ params }: Props) {
  const tracker = NIS_TRACKERS.find((x) => x.slug === params.slug);
  if (!tracker) notFound();

  const catalogEntry = getTracker(params.slug);
  // Hide trackers without a real file (no live catalog entry) — no teaser pages.
  if (!catalogEntry?.active) notFound();

  const pricePaise = catalogEntry.pricePaise;
  const isAvailable = true;

  return (
    <NisShell pillar="trackers">
      <ProductJsonLd
        slug={tracker.slug}
        title={tracker.title}
        description={tracker.desc}
        pricePaise={pricePaise}
        isAvailable={isAvailable}
        catalogEntry={catalogEntry}
      />
      <TrackerDetailPage tracker={tracker} />
    </NisShell>
  );
}

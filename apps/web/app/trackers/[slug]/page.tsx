import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NisShell } from '@/components/nis/Shell';
import { TrackerDetailPage } from '@/components/nis/pages/TrackerDetailPage';
import { ProductJsonLd } from '@/components/nis/ProductJsonLd';
import { NIS_TRACKERS } from '@/lib/nis-data';
import { getTracker } from '@/lib/tracker-catalog';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return NIS_TRACKERS.map((t) => ({ slug: t.slug }));
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
  const pricePaise = catalogEntry?.pricePaise ?? tracker.price * 100;
  const isAvailable = Boolean(catalogEntry?.active);

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

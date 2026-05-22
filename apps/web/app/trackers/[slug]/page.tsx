import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NisShell } from '@/components/nis/Shell';
import { TrackerDetailPage } from '@/components/nis/pages/TrackerDetailPage';
import { NIS_TRACKERS } from '@/lib/nis-data';

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

  return (
    <NisShell pillar="trackers">
      <TrackerDetailPage tracker={tracker} />
    </NisShell>
  );
}

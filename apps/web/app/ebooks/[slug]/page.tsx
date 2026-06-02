import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NisShell } from '@/components/nis/Shell';
import { EbookDetailPage } from '@/components/nis/pages/EbookDetailPage';
import { ProductJsonLd } from '@/components/nis/ProductJsonLd';
import { listEbooks, getEbook } from '@/lib/ebook-catalog';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return listEbooks().map((e) => ({ slug: e.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const e = getEbook(params.slug);
  if (!e) return { title: 'E-book not found' };
  return { title: e.title, description: e.tagline };
}

export default function Page({ params }: Props) {
  const ebook = getEbook(params.slug);
  if (!ebook) notFound();

  return (
    <NisShell pillar="trackers">
      <ProductJsonLd
        slug={ebook.slug}
        title={ebook.title}
        description={ebook.description}
        pricePaise={ebook.pricePaise}
        isAvailable={ebook.active}
        pathPrefix="ebooks"
        catalogEntry={ebook}
      />
      <EbookDetailPage ebook={ebook} />
    </NisShell>
  );
}

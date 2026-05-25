import type { Tracker as CatalogTracker } from '@/lib/tracker-catalog';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thenispace.com').replace(/\/+$/, '');

interface Props {
  /** Slug used for the URL (e.g. /trackers/freelancer-gst). */
  slug: string;
  title: string;
  description: string;
  pricePaise: number;
  isAvailable: boolean;
  /** Optional catalog reference to pull extra fields (sku, gtin, etc) in future. */
  catalogEntry?: CatalogTracker;
}

/**
 * Inline structured data for tracker / bundle pages. Helps Google show
 * price + availability in search results.
 */
export function ProductJsonLd({ slug, title, description, pricePaise, isAvailable }: Props) {
  const url = `${SITE_URL}/trackers/${slug}`;
  const priceRupees = (pricePaise / 100).toFixed(2);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: title,
    description,
    url,
    brand: { '@type': 'Brand', name: 'NIS' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: priceRupees,
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      seller: { '@type': 'Organization', name: 'NIS Studio' },
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

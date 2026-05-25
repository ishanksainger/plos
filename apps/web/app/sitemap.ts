import type { MetadataRoute } from 'next';
import { NIS_TRACKERS } from '@/lib/nis-data';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thenispace.com').replace(/\/+$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const lastModified = now;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,         lastModified, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/trackers`, lastModified, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/trackers/bundle`, lastModified, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/canvas`,   lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/shop`,     lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/plos`,     lastModified, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/about`,    lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`,  lastModified, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/terms`,    lastModified, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/refund`,   lastModified, changeFrequency: 'yearly',  priority: 0.2 },
  ];

  const trackerRoutes: MetadataRoute.Sitemap = NIS_TRACKERS.map((t) => ({
    url: `${SITE_URL}/trackers/${t.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...trackerRoutes];
}

/**
 * Lookbook — NIS's own marketing designs, shown as social proof on /lookbook.
 *
 * These are NOT catalog products (nothing here is for sale) — they are the
 * carousels / posters / images NIS posts to Instagram + Facebook to show off
 * design quality and funnel toward the Canva + tracker products.
 *
 * TO ADD A NEW DESIGN:
 *   1. Web-optimise the slides into `public/lookbook/<slug>/1.jpg …`
 *      (source PNGs are ~1MB each; commit JPEGs — see the carousels README).
 *   2. Add one entry to LOOKBOOK below.
 * That's it — the /lookbook page renders whatever is in this list.
 *
 * `type: 'carousel'` renders all slides in one swipeable box (the Carousel
 * component). A future single still image can use `type: 'image'` with a
 * one-entry `slides` array.
 *
 * Titles + categories + DM keywords are taken verbatim from the carousels
 * README ("NIS Social Carousels/README - carousels + captions.md"). The accent
 * colours are decorative (a per-card tint) and were picked to match each
 * theme — not brand-locked.
 */

export type LookbookItem = {
  slug: string;
  title: string;
  /** Human label shown as the card eyebrow, e.g. "Branding". */
  category: string;
  /** DM keyword the caption ends on (BRAND / SALON / …). Absent = a follow CTA. */
  keyword?: string;
  /** Decorative per-card accent (see note above — not a brand token). */
  accent: string;
  type: 'carousel' | 'image';
  slides: string[];
};

const slides = (slug: string, n = 4): string[] =>
  Array.from({ length: n }, (_, i) => `/lookbook/${slug}/${i + 1}.jpg`);

export const LOOKBOOK: LookbookItem[] = [
  {
    slug: 'brand-amateur',
    title: '5 signs your brand looks amateur',
    category: 'Branding',
    keyword: 'BRAND',
    accent: '#7c3aed',
    type: 'carousel',
    slides: slides('brand-amateur'),
  },
  {
    slug: 'salon-posts',
    title: 'Salon: posts that fill your chairs',
    category: 'Salon',
    keyword: 'SALON',
    accent: '#ec4899',
    type: 'carousel',
    slides: slides('salon-posts'),
  },
  {
    slug: 'cafe-content',
    title: 'Café: one dish, a week of content',
    category: 'Café',
    keyword: 'CAFE',
    accent: '#d97706',
    type: 'carousel',
    slides: slides('cafe-content'),
  },
  {
    slug: 'festive-calendar',
    title: 'Your festive content calendar (Rakhi → Diwali)',
    category: 'Festive planner',
    keyword: 'FESTIVE',
    accent: '#f59e0b',
    type: 'carousel',
    slides: slides('festive-calendar'),
  },
  {
    slug: 'diwali-money',
    title: 'Survive Diwali without the money regret',
    category: 'Finance',
    keyword: 'BUDGET',
    accent: '#10b981',
    type: 'carousel',
    slides: slides('diwali-money'),
  },
  {
    slug: 'wedding-shaadi',
    title: 'Plan your whole wedding budget in one sheet',
    category: 'Wedding',
    keyword: 'SHAADI',
    accent: '#f43f5e',
    type: 'carousel',
    slides: slides('wedding-shaadi'),
  },
  {
    slug: 'stop-posts',
    title: '7 posts to stop making today',
    category: 'Social tips',
    accent: '#3b82f6',
    type: 'carousel',
    slides: slides('stop-posts'),
  },
  {
    slug: 'boutique-shoot',
    title: 'Boutique: shoot outfits that sell on your phone',
    category: 'Boutique',
    keyword: 'STYLE',
    accent: '#d946ef',
    type: 'carousel',
    slides: slides('boutique-shoot'),
  },
];

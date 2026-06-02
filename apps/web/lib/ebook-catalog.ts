/**
 * Single source of truth for e-book products.
 *
 * E-books reuse the EXACT same commerce pipeline as trackers — Razorpay
 * order/verify (`/api/razorpay/*`), Supabase Storage delivery, download
 * tokens, and the Resend receipt email. The only requirement for that to
 * work is that every e-book SKU is resolvable via `getTracker(slug)` /
 * `getPurchasableTracker(slug)`. We achieve that by spreading `EBOOKS` into
 * the catalog's `ALL_SKUS` (see `tracker-catalog.ts`), so adding an e-book
 * needs ZERO changes to any API route or the fulfillment code.
 *
 * To go live with a new e-book:
 *   1. Add (or flip `active: true` on) an entry here with the real copy.
 *   2. Upload the file to the Supabase `products` bucket at
 *      `ebooks/<slug>.pdf` (or `.epub`).
 *   3. Upsert a row into `commerce.products`:
 *      type='digital', id='<slug>', storage_path='ebooks/<slug>.pdf'.
 *      (See the seed template in `supabase/schema.sql`.)
 *
 * Prices are in PAISE (₹1 = 100 paise) to match Razorpay + the tracker catalog.
 */

import type { Tracker } from './tracker-catalog';

export type Ebook = Tracker & {
  /** Hex accent used for the cover gradient + card dot. */
  accent: string;
  /** Human-friendly format label, e.g. "PDF · EPUB". */
  formatLabel?: string;
  /** Reading-time estimate shown on the detail page, e.g. "~50 min read". */
  readingTime?: string;
};

export const EBOOKS: Ebook[] = [
  {
    slug: 'ai-freelancer-india',
    title: 'The AI-Assisted Freelancer · India Edition',
    // NOTE: placeholder copy — confirm/replace the positioning before going live.
    tagline:
      'Use Claude and AI to win clients, write proposals, and stay on top of GST — built for Indian freelancers.',
    description:
      'A practical, India-first playbook for running a freelance business with AI as your unfair advantage. Prompt recipes for client proposals and cold outreach, an AI workflow for invoices and GST paperwork, and the exact systems to bill in INR without an accountant. No fluff, no "10x your income" promises — just the workflows that actually save hours every week.',
    pricePaise: 29900,
    features: [
      '40+ copy-paste prompts for proposals, outreach & scope docs',
      'An AI workflow for invoicing, GST notes & quarterly summaries',
      'Client-acquisition playbook tuned for the Indian market',
      'Pairs with the Freelancer GST Tracker',
      'Lifetime updates as the tools change',
    ],
    audience: 'Indian freelancers, consultants, and solo founders billing in INR.',
    fileType: 'pdf',
    formatLabel: 'PDF · EPUB',
    pages: 68,
    readingTime: '~70 min read',
    active: false,
    badge: 'Coming soon',
    kind: 'ebook',
    accent: '#f59e0b',
  },
];

const ALL_EBOOK_SLUGS = new Set(EBOOKS.map((e) => e.slug));

export function getEbook(slug: string): Ebook | undefined {
  return EBOOKS.find((e) => e.slug === slug);
}

export function isEbookSlug(slug: string): boolean {
  return ALL_EBOOK_SLUGS.has(slug);
}

/** Every e-book, including "coming soon" ones (rendered with a disabled CTA). */
export function listEbooks(): Ebook[] {
  return EBOOKS;
}

/** Only e-books that can actually be purchased right now. */
export function listActiveEbooks(): Ebook[] {
  return EBOOKS.filter((e) => e.active);
}

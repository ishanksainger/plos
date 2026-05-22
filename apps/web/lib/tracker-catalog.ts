/**
 * Single source of truth for tracker products until we move to Supabase CMS.
 * Prices are in PAISE (1 INR = 100 paise) — Razorpay expects paise on order create.
 */

export type Tracker = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  pricePaise: number;
  features: string[];
  audience: string;
  fileType: 'xlsx' | 'gsheet' | 'pdf';
  pages?: number;
  active: boolean;
  badge?: string;
};

export const TRACKERS: Tracker[] = [
  {
    slug: 'freelancer-gst',
    title: 'Freelancer GST Tracker',
    tagline: 'Track invoices, GST collected, and TDS — without an accountant.',
    description:
      'Designed for Indian freelancers earning ₹2L–₹40L/year. Logs every invoice, computes GST output and input, tracks TDS deducted by clients, and shows a clean quarterly summary you can hand to a CA. Works in Google Sheets and Excel.',
    pricePaise: 24900,
    features: [
      'Invoice log with GST/TDS split',
      'Quarterly GST + ITR summary',
      'TDS reconciliation against Form 26AS',
      'Client-wise outstanding tracker',
      'Built-in formulas — paste your invoice, done',
    ],
    audience: 'Indian freelancers, consultants, solo founders billing in INR.',
    fileType: 'xlsx',
    active: true,
    badge: 'Best seller',
  },
];

export function getTracker(slug: string): Tracker | undefined {
  return TRACKERS.find((t) => t.slug === slug && t.active);
}

export function listTrackers(): Tracker[] {
  return TRACKERS.filter((t) => t.active);
}

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

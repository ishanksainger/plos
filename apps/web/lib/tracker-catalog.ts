/**
 * Single source of truth for tracker products until we move to Supabase CMS.
 * Prices are in PAISE (1 INR = 100 paise) — Razorpay expects paise on order create.
 *
 * `active` controls whether the tracker can be purchased / added to cart.
 * Inactive ("In queue") trackers still render on /trackers with a "coming
 * soon" badge but their Buy / Add-to-cart buttons are disabled.
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
    pages: 9,
    active: true,
    badge: 'Best seller',
  },
  {
    slug: 'household',
    title: 'Household Money Planner',
    tagline:
      'A dual-income spreadsheet for couples who share a calendar but split rent.',
    description:
      'Track shared bills, split them in any ratio, log who paid what, and end every month with a settlement number neither of you has to negotiate.',
    pricePaise: 19900,
    features: [
      'Shared + personal bill ledger',
      'Auto-settlement at month end',
      'SIP and goal jars',
      'Festival fund',
      'Vendor & home-help tracker',
    ],
    audience: 'Dual-income households, couples splitting expenses.',
    fileType: 'xlsx',
    pages: 7,
    active: false,
    badge: 'In queue',
  },
  {
    slug: 'wedding',
    title: 'Indian Wedding Planner',
    tagline:
      'Nine sheets — venue, catering, photo, jewellery, vendors, guests, pandit, payments.',
    description:
      'A spreadsheet that survives a 600-guest wedding. Tags every expense to a ceremony (Mehendi, Haldi, Sangeet, Wedding, Reception) and reconciles UPI, cash, and card payments.',
    pricePaise: 34900,
    features: [
      'Ceremony-tagged line items',
      'GST handling (5% / 18%)',
      'Guest RSVP + table plan',
      'Pandit & ritual checklist',
      'Photo/video shot list',
    ],
    audience: 'Indian families planning a wedding.',
    fileType: 'xlsx',
    pages: 9,
    active: false,
    badge: 'In queue',
  },
  {
    slug: 'small-business',
    title: 'Small Business Cashflow',
    tagline:
      'Daily cashflow with festival spike modelling for shop-front India.',
    description:
      'A practical cashflow for shops, salons, and studios doing ₹ 1L–₹ 25L monthly revenue. Plans for the Diwali bump and the post-Diwali dip in the same view.',
    pricePaise: 29900,
    features: [
      'Daily till + UPI log',
      'Festival demand forecast',
      'Vendor payable ageing',
      'Owner draw vs business spend',
      'GSTR-3B summary block',
    ],
    audience: 'Shop owners, salons, studios billing under ₹25L/month.',
    fileType: 'xlsx',
    pages: 6,
    active: false,
    badge: 'In queue',
  },
];

export function getTracker(slug: string): Tracker | undefined {
  return TRACKERS.find((t) => t.slug === slug);
}

/** Trackers eligible for purchase. */
export function getPurchasableTracker(slug: string): Tracker | undefined {
  return TRACKERS.find((t) => t.slug === slug && t.active);
}

export function listTrackers(): Tracker[] {
  return TRACKERS;
}

export function listActiveTrackers(): Tracker[] {
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

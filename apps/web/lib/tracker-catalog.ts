/**
 * Single source of truth for tracker products until we move to Supabase CMS.
 * Prices are in PAISE (1 INR = 100 paise) — Razorpay expects paise on order create.
 *
 * `active` controls whether the tracker can be purchased / added to cart.
 * Inactive ("In queue") trackers still render on /trackers with a "coming
 * soon" badge but their Buy / Add-to-cart buttons are disabled.
 */

import { EBOOKS } from './ebook-catalog';

export type TrackerKind = 'tracker' | 'bundle' | 'ebook';

export type Tracker = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  pricePaise: number;
  features: string[];
  audience: string;
  fileType: 'xlsx' | 'gsheet' | 'pdf' | 'epub';
  pages?: number;
  active: boolean;
  badge?: string;
  /** `'tracker'` (single product), `'bundle'` (groups other slugs), or `'ebook'`. */
  kind?: TrackerKind;
  /** For bundles: slugs of the trackers included. */
  components?: string[];
  /**
   * For link-delivered SKUs (e.g. a Google Sheet "make a copy" link): the URL
   * handed to the buyer after payment instead of a stored file. When set, the
   * product has no Storage `storage_path` and `/api/download` redirects here
   * (still token-gated — only a paid buyer ever reaches the redirect).
   */
  deliveryUrl?: string;
};

export const TRACKERS: Tracker[] = [
  {
    slug: 'freelancer-gst',
    title: 'Freelancer Income & Tax Tracker',
    tagline:
      'Log income, chase invoices, and see your estimated tax the moment money lands — no formulas, no jargon.',
    description:
      "A single Google Sheet for Indian freelancers, consultants and solo professionals. Log income, raise and chase invoices, record expenses, and watch an estimated tax figure update under both regimes the moment money lands — built for FY 2025–26 with Section 44ADA presumptive tax, TDS reconciliation and foreign-receipt handling baked in. Pure Google Sheets: copy it once and it's yours, on any device. No app, no subscription.",
    pricePaise: 49900,
    features: [
      'Dashboard — the whole year at a glance: gross income, tax under both regimes, TDS refund',
      'Invoices — domestic + export, marked received or awaiting, auto-totalled and converted to INR',
      'Tax Summary — Section 44ADA, new vs old regime side by side (FY 2025–26)',
      'TDS Reconciliation — match Form 26AS and claim every rupee of TDS',
      'Foreign Receipts — USD/EUR/GBP at the SBI rate, with FIRC, purpose code & LUT notes',
    ],
    audience: 'Indian freelancers, consultants and solo professionals billing in INR.',
    fileType: 'gsheet',
    pages: 8,
    active: true,
    badge: 'New',
    // Force-copy Google Sheet (carries a bound Apps Script → can't ship as a
    // downloadable file). No storage_path; /api/download redirects to this.
    deliveryUrl:
      'https://docs.google.com/spreadsheets/d/1SbBxWfx58tQbCzS-ruvEFxzdGekGCSEMS60n6FscxOw/copy',
  },
  {
    slug: 'budget-upi',
    title: 'Indian Budget & UPI Tracker — 2026',
    tagline:
      'Track every rupee in one Google Sheet — UPI, SIPs, EMIs, all auto-calculated.',
    description:
      'A budget tracker that looks like an app and runs itself. Log a spend and your dashboard, monthly view, budgets and savings goals update automatically. Built for India — ₹ formatting, GPay/PhonePe/Paytm tracking, and SIP & EMI categories out of the box. Works in Google Sheets and Excel; you get your own private copy to fill in.',
    pricePaise: 29900,
    features: [
      'Auto-updating dashboard — log once, every tab refreshes',
      'UPI-app split (GPay / PhonePe / Paytm) — see where money really goes',
      '12-month view + category spending heatmap',
      'Budget vs actual with over-budget alerts',
      'Savings goals, net worth & 50/30/20 built in',
    ],
    audience:
      'Indian salaried earners, freelancers, and dual-income households who want one clean money sheet.',
    fileType: 'gsheet',
    pages: 6,
    active: true,
    badge: 'New',
  },
  {
    slug: 'habit-tracker',
    title: 'Daily Routine & Habit Tracker 2026',
    tagline: 'Build routines that actually stick.',
    description:
      'Choose your habits once, tick a box each day, and watch the whole thing come alive. The Daily Routine & Habit Tracker is a single Google Sheet — no apps, no subscriptions, nothing to install — built to keep you consistent. It flags the habit you skipped yesterday so you never miss twice, celebrates your streaks with a 🔥 counter, and turns your entire year into a wall of green you can see at a glance. Set it up in 60 seconds, then just show up.',
    pricePaise: 39900,
    features: [
      'Live Dashboard — Today / This-week / This-month / Streak-King cards, two auto-updating donuts, and a "Don\'t Miss Twice" panel that flags what you skipped yesterday',
      'Year heatmap — every day of the year as a colour square; greener = more done. The most honest progress bar you\'ll ever keep',
      "Monthly grids with streaks — tick a box a day; today's column is gold, weekends shaded, traffic-light bars show where you're winning, plus a Daily Progress chart",
      'Week Planner + smart Settings — 7 day-cards with donuts and extra to-dos; set up to 15 habits with habit-stacking, a 2-minute version, and your identity line',
      'Yours forever — works on desktop & mobile, no monthly fees, no accounts. One-time purchase, instant copy',
    ],
    audience: 'Anyone building daily routines and habits that stick.',
    fileType: 'gsheet',
    pages: 16,
    active: true,
    badge: 'New',
    // Force-copy Google Sheet (carries a bound Apps Script → can't ship as a
    // downloadable file). No storage_path; /api/download redirects to this.
    deliveryUrl:
      'https://docs.google.com/spreadsheets/d/1f-HisJNG8jr_KGhZPhRGO15LyUABMMOkjTj-sRckxYA/copy',
  },
  {
    slug: 'wedding-budget',
    title: 'Indian Wedding Budget Planner',
    tagline:
      'One Google Sheet to plan a calm, on-budget Indian wedding — every ceremony, vendor, guest and rupee, with totals that update themselves.',
    description:
      "A single, beautifully designed Google Sheet that does the wedding maths for you. Set your budget, tick the ceremonies you're having, and type real costs into each tab — everything rolls up into one live dashboard automatically. Pure Google Sheets: works the moment you copy it, on any device, yours forever. No app, no subscription, no ads.",
    pricePaise: 89900,
    features: [
      'Live budget dashboard — auto-totals, progress bars and status',
      '7 ceremony tabs — Roka, Pre-wedding, Sagan, Haldi, Mehendi & Sangeet, Wedding, Reception',
      'Vendors & Payments log — advance, balance, due dates, GST',
      'Guest list & RSVP tracker',
      'Shagun & Neg ledger — every gift, lifafa and gold coin, and who you thanked',
      'Bride / Groom split + 4 switchable colour themes',
    ],
    audience: 'Indian families and couples planning a wedding.',
    fileType: 'gsheet',
    pages: 11,
    active: true,
    badge: 'New',
    // Force-copy Google Sheet (carries a bound Apps Script → can't ship as a
    // downloadable file). No storage_path; /api/download redirects to this.
    deliveryUrl:
      'https://docs.google.com/spreadsheets/d/1KzcG7ka4npWR1Pcvt00M857Tx2iPR1l8n_7BIeYEY54/copy',
  },
  {
    slug: 'household',
    title: 'Household Money Planner',
    tagline:
      "One calm Google Sheet to run your whole household's money — spending, bills, EMIs and savings goals, all auto-totalled.",
    description:
      "A single, calm Google Sheet that runs a household's everyday money, for Indian families and dual-income couples. Log spending (mostly UPI), stay ahead of every bill and EMI, and watch savings goals fill up — one live dashboard updates itself. Built for FY 2025–26 on the 50/30/20 rule, with Indian lakh formatting, real calendar date pickers and checkbox bill tracking. Pure Google Sheets: copy it once and it's yours, on any device. No app, no subscription.",
    pricePaise: 99900,
    features: [
      'Dashboard — income, spending, savings and net cash at a glance, with budget-vs-actual bars and a 12-month strip',
      'Spending — log every expense with a payment-method tag (UPI / Card / Cash / Auto-debit); categories total themselves',
      'Budget Plan — a planned amount per category vs what you actually spent, with over/under flags (50/30/20)',
      'Savings Goals — goals and sinking funds (emergency, Diwali, trips) with % bars and months-to-go',
      "Bills & EMIs — every recurring bill, EMI and SIP with due dates and a checkbox to tick off what's paid",
    ],
    audience: 'Indian families and dual-income couples running a shared household budget.',
    fileType: 'gsheet',
    pages: 6,
    active: true,
    badge: 'New',
    // Force-copy Google Sheet (carries a bound Apps Script → can't ship as a
    // downloadable file). No storage_path; /api/download redirects to this.
    deliveryUrl:
      'https://docs.google.com/spreadsheets/d/1yMMClXp35FX-resLdOmTryqrK-94Xnb5b6Xhga8zwnk/copy',
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
    title: 'Small Business Accounts & GST Book',
    tagline:
      'Record sales and purchases, and watch GST payable and real profit update themselves — no accounting software, no monthly fees.',
    description:
      "A single Google Sheet that runs a small business's books, for Indian shops, traders and small businesses. Record sales and purchases, track who owes you and who you owe, and see GST payable and real profit update themselves, quarter by quarter — built for FY 2025–26 on India's GST 2.0 slabs (5% / 18% / 40%). Pure Google Sheets: copy it once and it's yours, on any device. No software, no subscription.",
    pricePaise: 69900,
    features: [
      'Dashboard — sales, profit, GST and cash in hand for the whole year',
      'Sales — every invoice, GST-tagged at 5 / 18 / 40%',
      'Purchases & Expenses — supplier bills and running costs, with the input GST you can claim',
      'GST Summary — output − input = net payable, quarter by quarter, credits carried forward',
      'Profit & Cashflow — gross and net profit, margins and cash in hand',
      'Income Tax Estimate — a rough 44AD figure, separate from GST',
    ],
    audience: 'Indian shops, traders and small businesses.',
    fileType: 'gsheet',
    pages: 7,
    active: true,
    badge: 'New',
    // Force-copy Google Sheet (carries a bound Apps Script → can't ship as a
    // downloadable file). No storage_path; /api/download redirects to this.
    deliveryUrl:
      'https://docs.google.com/spreadsheets/d/1v8Cd3kphOPfJVf-w46lgnDxJ97yHZq1gFpNqEfuGmdw/copy',
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Bundle SKU — kept separate from `TRACKERS` so /trackers doesn't list it
// (it has its own landing at /trackers/bundle), but the cart still resolves
// it via getPurchasableTracker(slug).
// ──────────────────────────────────────────────────────────────────────────

const BUNDLE_DISCOUNT = 0.25; // 25% off the sum of individual prices

const ALL_TRACKER_SLUGS = ['freelancer-gst', 'household', 'wedding', 'small-business'];

function sumComponentPrices(): number {
  return TRACKERS.filter((t) => ALL_TRACKER_SLUGS.includes(t.slug)).reduce(
    (sum, t) => sum + t.pricePaise,
    0,
  );
}

// Round bundle price down to the nearest 100 paise (₹1) for clean pricing.
const BUNDLE_PRICE_PAISE = Math.floor((sumComponentPrices() * (1 - BUNDLE_DISCOUNT)) / 100) * 100;

export const BUNDLE: Tracker = {
  slug: 'all-trackers-bundle',
  title: 'All-Trackers Bundle',
  tagline:
    'Every tracker we ship — one price, one email. 25% off the sum of individual prices.',
  description:
    'Pay once for the full library. The Freelancer GST Tracker reaches your inbox immediately; the remaining three (Household Money Planner, Wedding Planner, Small Business Cashflow) arrive as each one ships. Locked-in price even if individual prices rise later.',
  pricePaise: BUNDLE_PRICE_PAISE,
  features: [
    'Freelancer GST Tracker · live now',
    'Household Money Planner · ships next',
    'Indian Wedding Planner · in production',
    'Small Business Cashflow · in production',
    '25% off the sum of individual prices',
    'Price locked — future tracker price hikes don\'t apply to you',
  ],
  audience: 'Anyone who wants the full library at a discount, even pre-launch.',
  fileType: 'xlsx',
  pages: 31,
  // Hidden 2026-06-12 (BACKLOG #6): "buy all" doesn't scale + the bundle is
  // half-empty. Flip back to `true` to relist it everywhere (banner, route,
  // sitemap all key off this). Future: themed packs, not "buy everything".
  active: false,
  badge: 'Best value',
  kind: 'bundle',
  components: ALL_TRACKER_SLUGS,
};

export function getBundlePricing() {
  const totalIndividualPaise = sumComponentPrices();
  return {
    bundle: BUNDLE,
    components: TRACKERS.filter((t) => ALL_TRACKER_SLUGS.includes(t.slug)),
    totalIndividualPaise,
    bundlePricePaise: BUNDLE.pricePaise,
    savingsPaise: totalIndividualPaise - BUNDLE.pricePaise,
    discountPercent: Math.round(BUNDLE_DISCOUNT * 100),
  };
}

// Every purchasable SKU the commerce pipeline can resolve by slug. E-books are
// spread in here so /api/razorpay/* + fulfillment + /api/download work for them
// with no per-route changes (they all call getTracker / getPurchasableTracker).
const ALL_SKUS: Tracker[] = [...TRACKERS, BUNDLE, ...EBOOKS];

export function getTracker(slug: string): Tracker | undefined {
  return ALL_SKUS.find((t) => t.slug === slug);
}

/** Trackers/bundles eligible for purchase. */
export function getPurchasableTracker(slug: string): Tracker | undefined {
  return ALL_SKUS.find((t) => t.slug === slug && t.active);
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

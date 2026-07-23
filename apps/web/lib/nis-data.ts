/** NIS — site copy data, ported from the design prototype (data.js). */

import { listActiveTrackers } from './tracker-catalog';

export type Pillar = {
  key: 'trackers' | 'canvas' | 'shop' | 'plos';
  num: string;
  name: string;
  desc: string;
  color: string;
  meta: string;
};

/** One preview image in a product's gallery (see `Tracker.gallery`). */
export type GalleryItem = {
  /** Path under /public. */
  src: string;
  /** Short caption shown under the carousel, e.g. "Save the date". */
  label: string;
};

export type Tracker = {
  slug: string;
  title: string;
  badge?: string;
  accent: string;
  tagline: string;
  price: number;
  /** Optional "was" price (rupees) shown struck-through next to `price`. */
  mrp?: number;
  fileType: string;
  /**
   * Tab/sheet count, shown next to `fileType`. Optional: a multi-part product
   * (a sheet + guides + designs) has no single honest number, so it omits this
   * rather than inventing one — the meta line then shows `fileType` alone.
   */
  pages?: number;
  /** Noun for the `pages` count — defaults to 'sheets'; a single Google Sheet uses 'tabs'. */
  unit?: string;
  /**
   * Optional preview images shown as a carousel on the detail page (e.g. the
   * Wedding Box's four invitation designs). Absent → no gallery section.
   * These are PUBLIC marketing art committed under /public — never the paid
   * deliverable, which stays token-gated behind /api/download.
   */
  gallery?: GalleryItem[];
  /** Heading for the gallery section. Defaults to "A closer look". */
  galleryTitle?: string;
  /**
   * Optional square cover image (served from /public). When set, the shop card
   * + detail page render it (object-fit: cover) instead of the placeholder SVG.
   * Omit it and the tracker keeps the branded faux-spreadsheet placeholder.
   */
  image?: string;
  desc: string;
  features: string[];
};

export type Merch = {
  name: string;
  price: number;
  kind: string;
  slot: string;
};

export type Testimonial = {
  quote: string;
  who: string;
  slot: string;
};

export type Stat = { fig: string; label: string };

export const NIS_PILLARS: Pillar[] = [
  { key: 'trackers', num: '01', name: 'Trackers',  desc: 'Spreadsheets that hold a freelance life together.',     color: '#3b82f6', meta: '1 live · 4 in queue' },
  { key: 'canvas',   num: '02', name: 'Canvas',    desc: '3D and motion scenes Nikita builds. Drop in via Spline.', color: '#ec4899', meta: '6 scenes · drop in via Spline' },
  { key: 'shop',     num: '03', name: 'Shop',      desc: 'T-shirts, notebooks, trackers. A small store, well-made.', color: '#10b981', meta: 'Print-on-demand · Razorpay' },
  { key: 'plos',     num: '04', name: 'PLOS',      desc: 'The life OS app. Today, money, habits, people, timeline.',  color: '#7c3aed', meta: 'Free · founding tier' },
];

export const NIS_TRACKERS: Tracker[] = [
  {
    slug: 'freelancer-gst', title: 'Freelancer Income & Tax Tracker', badge: 'New', accent: '#f43f5e',
    tagline: 'Log income, chase invoices, and see your estimated tax the moment money lands — no formulas, no jargon.',
    price: 499, fileType: 'Google Sheet', pages: 8, unit: 'tabs', image: '/trackers/freelancer-gst.png',
    desc: 'For Indian freelancers, consultants and solo professionals. Log income, raise and chase invoices, record expenses, and watch an estimated tax figure update under both regimes the moment money lands — built for FY 2025–26 with Section 44ADA, TDS reconciliation and foreign-receipt handling baked in.',
    features: [
      'Dashboard — gross income, tax under both regimes, TDS refund',
      'Invoices — domestic + export, auto-totalled and converted to INR',
      'Tax Summary — Section 44ADA, new vs old regime side by side',
      'TDS Reconciliation — match Form 26AS, claim every rupee of TDS',
      'Foreign Receipts — USD/EUR/GBP at the SBI rate, FIRC + LUT notes',
    ],
  },
  {
    slug: 'budget-upi', title: 'Indian Budget & UPI Tracker — 2026', badge: 'New', accent: '#10b981',
    tagline: 'Track every rupee in one Google Sheet — UPI, SIPs, EMIs, all auto-calculated.',
    price: 299, mrp: 599, fileType: 'Google Sheet', pages: 6, unit: 'tabs',
    desc: 'A budget tracker that looks like an app and runs itself. Log a spend and your dashboard, monthly view, budgets and savings goals update automatically. Built for India — ₹ formatting, GPay/PhonePe/Paytm tracking, and SIP & EMI categories out of the box. Works in Google Sheets and Excel; you get your own private copy to fill in.',
    features: [
      'Auto-updating dashboard — log once, every tab refreshes',
      'UPI-app split (GPay / PhonePe / Paytm) — see where money really goes',
      '12-month view + category spending heatmap',
      'Budget vs actual with over-budget alerts',
      'Savings goals, net worth & 50/30/20 built in',
    ],
  },
  {
    slug: 'habit-tracker', title: 'Daily Routine & Habit Tracker 2026', badge: 'New', accent: '#274e37',
    tagline: 'Build routines that actually stick.',
    price: 399, fileType: 'Google Sheet', pages: 16, unit: 'tabs', image: '/trackers/habit-tracker.png',
    desc: 'Choose your habits once, tick a box each day, and watch the whole thing come alive. The Daily Routine & Habit Tracker is a single Google Sheet — no apps, no subscriptions, nothing to install — built to keep you consistent. It flags the habit you skipped yesterday so you never miss twice, celebrates your streaks with a 🔥 counter, and turns your entire year into a wall of green you can see at a glance. Set it up in 60 seconds, then just show up.',
    features: [
      'Live Dashboard — Today / This-week / This-month / Streak-King cards, two auto-updating donuts, and a "Don\'t Miss Twice" panel that flags what you skipped yesterday',
      'Year heatmap — every day of the year as a colour square; greener = more done. The most honest progress bar you\'ll ever keep',
      "Monthly grids with streaks — tick a box a day; today's column is gold, weekends shaded, traffic-light bars show where you're winning, plus a Daily Progress chart",
      'Week Planner + smart Settings — 7 day-cards with donuts and extra to-dos; set up to 15 habits with habit-stacking, a 2-minute version, and your identity line',
      'Yours forever — works on desktop & mobile, no monthly fees, no accounts. One-time purchase, instant copy',
    ],
  },
  {
    slug: 'wedding-budget', title: 'Indian Wedding Budget Planner', badge: 'New', accent: '#f59e0b',
    tagline: 'One Google Sheet to plan a calm, on-budget Indian wedding — every ceremony, vendor, guest and rupee, with totals that update themselves.',
    price: 899, fileType: 'Google Sheet', pages: 11, unit: 'tabs',
    desc: "A single, beautifully designed Google Sheet that does the wedding maths for you. Set your budget, tick the ceremonies you're having, and type real costs into each tab — everything rolls up into one live dashboard automatically. Pure Google Sheets: works the moment you copy it, on any device, yours forever. No app, no subscription.",
    features: [
      'Live budget dashboard — auto-totals, progress bars and status',
      '7 ceremony tabs — Roka, Pre-wedding, Sagan, Haldi, Mehendi & Sangeet, Wedding, Reception',
      'Vendors & Payments log — advance, balance, due dates, GST',
      'Guest list & RSVP tracker',
      'Shagun & Neg ledger — every gift, lifafa and gold coin, and who you thanked',
      'Bride / Groom split + 4 switchable colour themes',
    ],
  },
  {
    // STAGED, NOT LIVE — the commerce entry is `active: false`, so this never
    // renders anywhere (grid, home, sitemap and the detail page all gate on
    // getPurchasableTracker). Copy below is a draft describing only what the
    // box actually contains; replace with Ishank's / Desktop's final wording
    // before go-live. Couple names on the invitation art ("Aanya & Rohan")
    // are demo text baked into the designs, not a customer.
    slug: 'wedding-box', title: 'The Wedding Box', badge: 'New', accent: '#0f4c3a',
    tagline: 'Everything for the wedding in one box — the budget planner, two guides, and a matching invitation suite.',
    price: 2499, fileType: 'Google Sheet + PDF guides',
    image: '/trackers/wedding-box/1.jpg',
    desc: "The Indian Wedding Budget Planner, plus the pieces that surround it. You get the full 11-tab Google Sheet that does the wedding maths for you, a 12-month planning checklist and a guide to what each ritual actually means, a Start-Here page that tells you where to begin — and a four-piece invitation suite designed to match: save-the-date, invitation, RSVP and thank-you.",
    features: [
      'Indian Wedding Budget Planner — the full 11-tab Google Sheet, yours to copy',
      '12-month wedding checklist — what to book and when, as a printable PDF',
      'Ritual meanings guide — what each ceremony is for, in plain language',
      'Start-Here page — where to begin on day one',
      'Invitation suite — save-the-date, invitation, RSVP and thank-you designs',
    ],
    galleryTitle: "What's inside — the invitation suite",
    gallery: [
      { src: '/trackers/wedding-box/1.jpg', label: 'Save the date' },
      { src: '/trackers/wedding-box/2.jpg', label: 'Wedding invitation' },
      { src: '/trackers/wedding-box/3.jpg', label: 'RSVP card' },
      { src: '/trackers/wedding-box/4.jpg', label: 'Thank-you card' },
    ],
  },
  {
    slug: 'household', title: 'Household Money Planner', badge: 'New', accent: '#588157',
    tagline: "One calm Google Sheet to run your whole household's money — spending, bills, EMIs and savings goals, all auto-totalled.",
    price: 999, fileType: 'Google Sheet', pages: 6, unit: 'tabs', image: '/trackers/household.png',
    desc: "One calm Google Sheet that runs a household's everyday money, for Indian families and dual-income couples. Log spending (mostly UPI), stay ahead of every bill and EMI, and watch savings goals fill up — a live dashboard updates itself. Built for FY 2025–26 on the 50/30/20 rule, with Indian lakh formatting, real calendar date pickers and checkbox bill tracking.",
    features: [
      'Dashboard — income, spending, savings and net cash at a glance, with budget bars + a 12-month strip',
      'Spending — tag each expense UPI / Card / Cash / Auto-debit; categories total themselves',
      'Budget Plan — planned vs actual per category, with over/under flags (50/30/20)',
      'Savings Goals — emergency, Diwali, trips — % bars and months-to-go',
      "Bills & EMIs — due dates + a checkbox to tick off what's paid",
    ],
  },
  {
    slug: 'wedding', title: 'Indian Wedding Planner', badge: 'In queue', accent: '#ec4899',
    tagline: 'Nine sheets — venue, catering, photo, jewellery, vendors, guests, pandit, payments.',
    price: 349, fileType: 'XLSX · GSheets', pages: 9,
    desc: 'A spreadsheet that survives a 600-guest wedding. Tags every expense to a ceremony (Mehendi, Haldi, Sangeet, Wedding, Reception) and reconciles UPI, cash, and card payments.',
    features: ['Ceremony-tagged line items', 'GST handling (5% / 18%)', 'Guest RSVP + table plan', 'Pandit & ritual checklist', 'Photo/video shot list'],
  },
  {
    slug: 'small-business', title: 'Small Business Accounts & GST Book', badge: 'New', accent: '#1e40af',
    tagline: 'Record sales and purchases, and watch GST payable and real profit update themselves — no software, no monthly fees.',
    price: 699, fileType: 'Google Sheet', pages: 7, unit: 'tabs', image: '/trackers/small-business.png',
    desc: "A single Google Sheet that runs a small business's books — for Indian shops, traders and small businesses. Record sales and purchases, track who owes you and who you owe, and see GST payable and real profit update themselves, quarter by quarter, on India's GST 2.0 slabs.",
    features: [
      'Dashboard — sales, profit, GST and cash in hand',
      'Sales — every invoice, GST-tagged at 5 / 18 / 40%',
      'Purchases & Expenses — bills and costs, with input GST to claim',
      'GST Summary — output − input = net payable, quarter by quarter',
      'Profit & Cashflow + a rough 44AD income-tax estimate',
    ],
  },
];

export const NIS_MERCH: Merch[] = [
  { name: 'Nest tee — Crew',             price: 1490, kind: 'Tee · 240gsm cotton', slot: 'tee-1' },
  { name: 'Founder hoodie',              price: 3490, kind: 'Hoodie · Heavyweight', slot: 'hoodie-1' },
  { name: 'Slate notebook · A5',         price: 690,  kind: 'Notebook · Dotted',    slot: 'note-1' },
  { name: 'Marigold tote',               price: 890,  kind: 'Tote · Cotton canvas', slot: 'tote-1' },
  { name: 'Cap — PLOS embroidered',      price: 990,  kind: 'Cap · Unstructured',   slot: 'cap-1' },
  { name: 'Sticker pack — eight stamps', price: 290,  kind: 'Stickers · 8 pieces',  slot: 'sticker-1' },
];

/**
 * EMPTY ON PURPOSE — do not invent quotes.
 *
 * This used to ship two fabricated testimonials ("Aanya · UX consultant,
 * Bengaluru", "Rohan · founder, Mumbai") on a live site that takes real money
 * and has never had a customer. That's fabricated social proof: dishonest to
 * the first real buyer and a misleading-advertisement exposure under India's
 * Consumer Protection Act.
 *
 * Add entries only for REAL customers who gave permission, quoted verbatim.
 * While this array is empty, the home page and /plos testimonial sections hide
 * themselves — so an empty list is a safe state, not a broken one.
 */
export const NIS_TESTIMONIALS: Testimonial[] = [];

/**
 * Only claims we can actually stand behind.
 *
 * These were previously invented ("4,200 trackers downloaded", "₹14L saved on
 * CA fees", "38 cities served") while the real numbers were zero. Never put an
 * unverifiable figure here. The tracker count is derived from the catalog, so
 * it can't drift out of date and become a lie on its own.
 */
export const NIS_STATS: Stat[] = [
  { fig: String(listActiveTrackers().length), label: 'Trackers, live today' },
  { fig: '₹0/mo', label: 'No subscription — pay once, yours forever' },
  { fig: 'India', label: 'Built for GST, UPI and lakhs' },
];

export const fmtINR = (n: number) =>
  '₹ ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

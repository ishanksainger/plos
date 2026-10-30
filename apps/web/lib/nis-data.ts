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
  /**
   * Made-to-order products (e.g. the Wedding Box + video invites) are
   * personalised by hand AFTER checkout — they are not an instant download.
   * When true, the detail page swaps the "instant · lifetime access" line for a
   * "made to order" note + a How-it-works block, and the buy flow tells the
   * buyer to expect a details request rather than a download link.
   */
  madeToOrder?: boolean;
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
    price: 299, fileType: 'Google Sheet', pages: 11, unit: 'tabs', image: '/trackers/wedding-budget.png',
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
    slug: 'wedding-box', title: 'The Wedding Box', badge: 'Made to order', accent: '#0f4c3a',
    madeToOrder: true,
    tagline: 'The whole wedding in one box — four personalised invite videos, four matching cards, the budget planner and its guides.',
    price: 999, fileType: 'Videos, cards & planner',
    image: '/trackers/wedding-box/1.jpg',
    desc: "Everything for the wedding, personalised for you by hand. Four WhatsApp invite videos — Main Wedding, Haldi, Mehendi & Sangeet, and Sagan — plus four matching cards (save-the-date, invitation, RSVP, thank-you), the full 11-tab Indian Wedding Budget Planner, the ritual-meanings keepsake guide and your 12-month checklist. You check out, tell us your names, dates and venue, and we craft the whole suite around them.",
    features: [
      'Four personalised WhatsApp invite videos — Main Wedding, Haldi, Mehendi & Sangeet, Sagan (9:16, ready to share)',
      'Four matching cards — save-the-date, invitation, RSVP and thank-you, print-ready',
      'Indian Wedding Budget Planner — the full 11-tab Google Sheet, yours to copy',
      'The Meaning Behind Every Ritual — keepsake guide (PDF)',
      'Your 12-month wedding planning checklist (PDF)',
      'Personalisation done for you — we add your names, dates and venue by hand',
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
    // ── ₹199 à-la-carte video invite — STAGED, made to order ────────────────
    // One personalised WhatsApp invite video (buyer picks the ceremony in the
    // details form) + all four matching cards. Staged active:false in the
    // commerce catalog; go live alongside the box. Video preview stills would
    // strengthen this page (Claude Desktop's lane) — for now the gallery shows
    // the four cards that ship with it.
    slug: 'wedding-video-invite', title: 'Wedding Invite Video + Cards', badge: 'Made to order', accent: '#f59e0b',
    madeToOrder: true,
    tagline: 'One personalised WhatsApp invite video for your ceremony, with all four matching cards.',
    price: 199, fileType: 'Video + 4 cards',
    image: '/trackers/wedding-box/2.jpg',
    desc: "A single personalised invite video — your choice of Main Wedding, Haldi, Mehendi & Sangeet or Sagan — made in vertical 9:16 to share straight on WhatsApp, and it comes with all four matching cards (save-the-date, invitation, RSVP, thank-you). You check out, tell us your names, date and venue, and pick the ceremony, and we craft it around you.",
    features: [
      'One personalised WhatsApp invite video (9:16) — you choose the ceremony',
      'All four matching cards — save-the-date, invitation, RSVP and thank-you',
      'Made with your names, date and venue',
      'Ready to forward on WhatsApp',
    ],
    galleryTitle: 'The four cards you get',
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

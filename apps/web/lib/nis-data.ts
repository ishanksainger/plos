/** NIS — site copy data, ported from the design prototype (data.js). */

export type Pillar = {
  key: 'trackers' | 'canvas' | 'shop' | 'plos';
  num: string;
  name: string;
  desc: string;
  color: string;
  meta: string;
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
  pages: number;
  /** Noun for the `pages` count — defaults to 'sheets'; a single Google Sheet uses 'tabs'. */
  unit?: string;
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
    slug: 'household', title: 'Household Money Planner', badge: 'New', accent: '#7c3aed',
    tagline: 'A dual-income spreadsheet for couples who share a calendar but split rent.',
    price: 199, fileType: 'XLSX · GSheets', pages: 7,
    desc: 'Track shared bills, split them in any ratio, log who paid what, and end every month with a settlement number neither of you has to negotiate.',
    features: [
      'Shared + personal bill ledger',
      'Auto-settlement at month end',
      'SIP and goal jars',
      'Festival fund',
      'Vendor & home-help tracker',
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

export const NIS_TESTIMONIALS: Testimonial[] = [
  {
    quote: 'The tracker did in twenty minutes what my CA charged me four thousand rupees a quarter to do.',
    who: 'Aanya · UX consultant, Bengaluru',
    slot: 'q1',
  },
  {
    quote: 'I opened PLOS on a Sunday with two overdue bills and a forgotten passport renewal. By Monday lunch all three were closed.',
    who: 'Rohan · founder, Mumbai',
    slot: 'q2',
  },
];

export const NIS_STATS: Stat[] = [
  { fig: '4,200',  label: 'Trackers downloaded' },
  { fig: '₹ 14L',  label: 'Saved on CA fees by users' },
  { fig: '38',     label: 'Cities served · India only' },
];

export const fmtINR = (n: number) =>
  '₹ ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

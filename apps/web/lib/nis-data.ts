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
    slug: 'freelancer-gst', title: 'Freelancer GST Tracker', badge: 'Bestseller', accent: '#3b82f6',
    tagline: 'GST, TDS, and a CA-ready quarterly summary — without an accountant.',
    price: 249, fileType: 'XLSX · GSheets', pages: 9,
    desc: 'For Indian freelancers earning ₹ 2L–₹ 40L/year. Logs every invoice, computes GST output + input, tracks TDS deducted by clients, and shows a clean quarterly summary you can hand to your CA.',
    features: [
      'Invoice log with GST / TDS split',
      'Quarterly GST + ITR summary',
      'TDS reconciliation against Form 26AS',
      'Client-wise outstanding tracker',
      'Drop-in formulas — paste your invoice, done',
    ],
  },
  {
    slug: 'budget-upi', title: 'Indian Budget & UPI Tracker — 2026', badge: 'New', accent: '#f59e0b',
    tagline: 'Track every rupee in one Google Sheet — UPI, SIPs, EMIs, all auto-calculated.',
    price: 299, mrp: 599, fileType: 'Google Sheet', pages: 6,
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
    slug: 'small-business', title: 'Small Business Cashflow', badge: 'In queue', accent: '#10b981',
    tagline: 'Daily cashflow with festival spike modelling for shop-front India.',
    price: 299, fileType: 'XLSX · GSheets', pages: 6,
    desc: 'A practical cashflow for shops, salons, and studios doing ₹ 1L–₹ 25L monthly revenue. Plans for the Diwali bump and the post-Diwali dip in the same view.',
    features: ['Daily till + UPI log', 'Festival demand forecast', 'Vendor payable ageing', 'Owner draw vs business spend', 'GSTR-3B summary block'],
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

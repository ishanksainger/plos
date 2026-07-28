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
  /**
   * Storage path of the "Start Here" welcome guide (a PDF), if one exists.
   * This is a COMPANION to `deliveryUrl`, never a replacement: the download
   * link always goes straight to the sheet, and the guide rides along as a
   * second button in the receipt email (`/api/guide?token=…`).
   *
   * It must stay behind the token — the guide contains the force-copy link, so
   * hosting it publicly would hand out the product for free. Trackers without
   * a guide simply omit the button.
   */
  welcomePath?: string;
  /**
   * Made-to-order SKUs (the Wedding Box + video invites) are personalised by
   * hand AFTER payment, so they have NO instant deliverable. On purchase the
   * order is recorded and left `paid` (awaiting fulfilment) and the buyer gets
   * a "send us your details" email (see WEDDING_DETAILS_FORM_URL) instead of a
   * download token. They must have no `deliveryUrl`/`welcomePath` so the admin
   * resend action correctly refuses (there is nothing to auto-deliver).
   */
  madeToOrder?: boolean;
  /**
   * A PDF bundled in the repo (path relative to `apps/web`, e.g.
   * `assets/welcome-wedding-box.pdf`) that is attached to the made-to-order
   * confirmation email. Unlike `welcomePath` (a token-gated Storage guide that
   * rides a receipt as a link), this is a warm welcome the buyer keeps
   * immediately — it does NOT gate a deliverable, so it never affects the
   * admin resend logic. Read at send time via `fs`; if the read fails we still
   * send the email, just without the attachment.
   */
  emailAttachmentPath?: string;
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
    welcomePath: 'trackers/freelancer-gst.pdf',
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
    // Was the ONLY tracker delivered as a stored PDF (the buyer had to open it
    // and hunt for the sheet link) — a leftover from before `deliveryUrl`
    // existed. Now link-delivered like every other tracker: straight to the
    // sheet. Its Welcome PDF stays, but as the email's guide (welcomePath).
    deliveryUrl:
      'https://docs.google.com/spreadsheets/d/1_A43NoNVbTjK3tLRw2K4ILChHRYYojiCMQSdaTecVYs/copy',
    welcomePath: 'trackers/budget-upi.pdf',
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
    welcomePath: 'trackers/habit-tracker.pdf',
  },
  {
    slug: 'wedding-budget',
    title: 'Indian Wedding Budget Planner',
    tagline:
      'One Google Sheet to plan a calm, on-budget Indian wedding — every ceremony, vendor, guest and rupee, with totals that update themselves.',
    description:
      "A single, beautifully designed Google Sheet that does the wedding maths for you. Set your budget, tick the ceremonies you're having, and type real costs into each tab — everything rolls up into one live dashboard automatically. Pure Google Sheets: works the moment you copy it, on any device, yours forever. No app, no subscription, no ads.",
    // Repriced ₹899 → ₹299 (2026-07-28) as the "tracker alone" tier below the ₹999 Wedding Box.
    pricePaise: 29900,
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
    welcomePath: 'trackers/wedding-budget.pdf',
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
    welcomePath: 'trackers/household.pdf',
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
    // ── The Wedding Box — LIVE, made to order (₹999, locked 2026-07-28) ──────
    // The full personalised suite: 4 WhatsApp invite videos + 4 matching cards
    // + the Wedding Budget Planner + its guides. `madeToOrder: true` → paying
    // does NOT auto-deliver a file; the buyer is emailed a details form and we
    // craft the suite by hand (see fulfillment.ts persistMadeToOrder). Its
    // preview gallery lives in nis-data.ts. Went live in the go-live PR:
    //   • WEDDING_DETAILS_FORM_URL set on the VPS (Google Form intake).
    //   • commerce.products row inserted in nis-prod (id=wedding-box, 99900).
    //   • Deliberately NO deliveryUrl/welcomePath — made-to-order has no instant
    //     deliverable, and their absence makes admin "resend" correctly refuse.
    //   • emailAttachmentPath rides a "Welcome to your Wedding Box" PDF along
    //     with the confirmation email (bundled in the image, fs-read at send).
    slug: 'wedding-box',
    title: 'The Wedding Box',
    tagline:
      'The whole wedding in one box — four personalised invite videos, four matching cards, the budget planner and its guides.',
    description:
      'Everything for the wedding, personalised by hand: four WhatsApp invite videos (Main Wedding, Haldi, Mehendi & Sangeet, Sagan), four matching cards (save-the-date, invitation, RSVP, thank-you), the full 11-tab Indian Wedding Budget Planner, the ritual-meanings keepsake guide and a 12-month checklist. You check out, send us your names, dates and venue, and we craft the suite around them.',
    pricePaise: 99900,
    features: [
      'Four personalised WhatsApp invite videos — Main Wedding, Haldi, Mehendi & Sangeet, Sagan',
      'Four matching cards — save-the-date, invitation, RSVP, thank-you',
      'Indian Wedding Budget Planner — the full 11-tab Google Sheet',
      'The Meaning Behind Every Ritual — keepsake guide (PDF)',
      '12-month wedding planning checklist (PDF)',
      'Personalisation done for you — your names, dates and venue added by hand',
    ],
    audience: 'Indian families and couples planning a wedding who want everything in one place.',
    fileType: 'gsheet',
    active: true,
    badge: 'Made to order',
    madeToOrder: true,
    // Warm welcome PDF attached to the confirmation email (wedding-box only).
    emailAttachmentPath: 'assets/welcome-wedding-box.pdf',
  },
  {
    // ── ₹199 à-la-carte video invite — LIVE, made to order ──────────────────
    // One personalised WhatsApp invite video (ceremony chosen in the details
    // form) + all four matching cards. Same made-to-order flow as the box.
    // Went live alongside it (commerce.products row id=wedding-video-invite,
    // 19900). No welcome-PDF attachment — that's the full box's touch.
    slug: 'wedding-video-invite',
    title: 'Wedding Invite Video + Cards',
    tagline:
      'One personalised WhatsApp invite video for your ceremony, with all four matching cards.',
    description:
      'A single personalised invite video — your choice of Main Wedding, Haldi, Mehendi & Sangeet or Sagan — in vertical 9:16 for WhatsApp, with all four matching cards (save-the-date, invitation, RSVP, thank-you). You check out, tell us your names, date and venue and pick the ceremony, and we craft it around you.',
    pricePaise: 19900,
    features: [
      'One personalised WhatsApp invite video (9:16) — you choose the ceremony',
      'All four matching cards — save-the-date, invitation, RSVP, thank-you',
      'Made with your names, date and venue',
      'Ready to forward on WhatsApp',
    ],
    audience: 'Couples who want one standout ceremony invite to share on WhatsApp.',
    fileType: 'gsheet',
    active: true,
    badge: 'Made to order',
    madeToOrder: true,
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
    welcomePath: 'trackers/small-business.pdf',
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

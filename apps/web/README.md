# apps/web — NIS brand site (thenispace.com)

Next.js 14 (App Router) + Tailwind + shared `@nis/brand-tokens`. This is the marketing site, trackers storefront, canvas section (Week 3+), and shop (Week 5+). PLOS lives in a separate app at `app.thenispace.com`.

## What's in here (Week 1)

- `/` — homepage with hero + 4-pillar teaser
- `/trackers` — list of Indian-tax-aware Google Sheet products
- `/trackers/[slug]` — product detail + Razorpay checkout
- `/api/razorpay/order` — creates a Razorpay order (server)
- `/api/razorpay/verify` — verifies payment signature, persists order, emails download link
- `/api/razorpay/webhook` — webhook safety net (idempotent fulfillment)
- `/api/download?token=…` — redirects to a short-lived signed URL from Supabase Storage
- `supabase/schema.sql` — commerce schema (products, orders, order_items, download_tokens)

## Quick start

```bash
# from repo root, install everything (workspaces resolve @nis/* packages)
npm install

# copy env template and fill in keys (you can start with empty Razorpay keys —
# the UI will show "not configured" until you add them)
cp apps/web/.env.example apps/web/.env.local

# start the dev server
npm run dev:web
# → http://localhost:3000
```

The PLOS dev script (`npm run dev`) is untouched — backend on :3001 + frontend on :5173. The NIS site uses `npm run dev:web` on :3000.

## Setup checklist (in order)

| # | What | Where | Status |
|---|------|-------|--------|
| 1 | Buy / verify `thenispace.com` ownership | Registrar | ✅ done |
| 2 | Sign up Vercel, link repo, set root to `apps/web` | vercel.com | ☐ |
| 3 | Sign up Supabase, create `thenispace` project | supabase.com | ☐ |
| 4 | Run `supabase/schema.sql` in the SQL editor | Supabase Studio | ☐ |
| 5 | Create Storage bucket named `products` | Supabase Studio | ☐ |
| 6 | Upload any file-delivered tracker to `products/trackers/<slug>.xlsx` (note: the live Google-Sheet trackers are link-delivered via `deliveryUrl` — no upload) | Supabase Studio | ☐ |
| 7 | Sign up Razorpay, generate test mode API keys | dashboard.razorpay.com | ☐ |
| 8 | Sign up Resend, verify `thenispace.com` domain | resend.com | ☐ |
| 9 | Paste all keys into `apps/web/.env.local` | local machine | ☐ |
| 10 | Test purchase in browser using Razorpay test card `4111 1111 1111 1111` | localhost:3000 | ☐ |
| 11 | Wait for Razorpay live KYC (5–7 days) | Razorpay | ☐ |
| 12 | Swap test keys for live keys in Vercel env vars | Vercel | ☐ |

You can build & deploy with steps 2–6 missing — the homepage and `/trackers` pages render fine without Razorpay/Supabase/Resend. Checkout shows a "not configured" message until keys are present.

## Environment variables

See `.env.example` for the full list. All Razorpay/Supabase/Resend integrations gracefully no-op when their keys are missing — meaning you can ship the marketing pages before commerce is wired up.

## Architecture (Week 1)

```
[Browser]
   │
   ├── GET /                    → static homepage
   ├── GET /trackers/[slug]     → static product page (revalidated on build)
   │
   └── User clicks "Buy"
          │
          ├── POST /api/razorpay/order      → creates order in Razorpay
          ├── Razorpay Checkout modal opens (client-side hosted)
          ├── User pays via UPI/card/netbanking
          ├── POST /api/razorpay/verify     → verifies sig, persists Order/Item,
          │                                    generates download token,
          │                                    emails buyer via Resend
          └── (parallel) POST /api/razorpay/webhook → idempotent safety net
                                                       (in case verify never fires)

[Buyer's inbox]
   │
   └── Email contains `/api/download?token=xxx`
          │
          └── 302 → Supabase Storage signed URL (60s TTL)
                    → .xlsx streams to user
```

Tokens: 7-day expiry, max 5 uses. After either limit hits, the download endpoint returns `410 Gone`.

## Conventions

This app follows the rules in `/CLAUDE.md` at the repo root. Notable:

- Brand colors/fonts come from `@nis/brand-tokens` — never hardcode hex.
- Razorpay calls go through `@nis/razorpay-sdk` — never `new Razorpay()` directly.
- Money is stored in **paise** (integer). Display via `Intl.NumberFormat`.
- No imports from `../plos-backend` or `../plos-frontend`.

## Deployment

- **Hosting:** Vercel (`apps/web` as the project root).
- **Domain:** `thenispace.com` → Vercel via DNS A/CNAME records Vercel provides.
- **Env vars:** set the same keys from `.env.example` in Vercel Project Settings.
- **Webhook URL:** `https://thenispace.com/api/razorpay/webhook` — paste this into Razorpay Dashboard → Webhooks.

## What's coming (next weeks)

| Week | Adds |
|---|---|
| 2 | Cart (Zustand), 3 more trackers, bundle page |
| 3 | Canvas section (Nikita's printable designs) |
| 4 | Waitlist for PLOS → posts to PLOS backend |
| 5 | Print-to-order via Qikink (t-shirts) |
| 6+ | Analytics, A/B tests, SEO push |

See `/Volumes/DevSSD/dev/claude/nis_code_plan_v1.md` for the full plan.

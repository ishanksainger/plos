-- NIS commerce schema (Week 1 baseline).
-- Run this in the Supabase SQL editor for the `thenispace` project.
-- All amounts are in PAISE (₹1 = 100 paise) to avoid floating-point money.

create schema if not exists commerce;
create schema if not exists marketing;

-- ----------------------------------------------------------------------------
-- products: source of truth for what you sell.
-- ----------------------------------------------------------------------------
create table if not exists commerce.products (
  id              text primary key,           -- slug, e.g. 'freelancer-gst'
  type            text not null,              -- 'digital' | 'pod' | 'canvas' | 'bundle'
  title           text not null,
  description     text,
  price_paise     integer not null check (price_paise >= 0),
  image_url       text,
  storage_path    text,                       -- Supabase Storage path for digital
  qikink_sku      text,                       -- for POD (Week 5+)
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- orders: one row per Razorpay order.
-- ----------------------------------------------------------------------------
create table if not exists commerce.orders (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null,
  phone               text,
  total_paise         integer not null check (total_paise >= 0),
  status              text not null default 'pending'
                        check (status in ('pending','paid','fulfilled','failed','refunded')),
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  notes               jsonb,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  fulfilled_at        timestamptz
);

create index if not exists orders_email_idx on commerce.orders (email);
create index if not exists orders_status_idx on commerce.orders (status);

-- ----------------------------------------------------------------------------
-- order_items: line items inside an order. One order can hold many products.
-- ----------------------------------------------------------------------------
create table if not exists commerce.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references commerce.orders(id) on delete cascade,
  product_id   text not null references commerce.products(id),
  quantity     integer not null default 1 check (quantity > 0),
  price_paise  integer not null check (price_paise >= 0)
);

create index if not exists order_items_order_id_idx on commerce.order_items (order_id);

-- Optional hardening (recommended before high volume): this unique constraint
-- makes fulfillment idempotent even under a *simultaneous* /verify + webhook
-- race — the second insert fails instead of minting a duplicate token + email.
-- lib/fulfillment.ts already guards every realistic *sequential* duplicate with
-- a select-then-insert check; this closes the millisecond overlap window too.
-- Note: it collapses qty>1 of the same digital SKU on one order to a single
-- delivery (intended — a digital file is identical per copy).
--   alter table commerce.order_items
--     add constraint order_items_order_product_uniq unique (order_id, product_id);

-- ----------------------------------------------------------------------------
-- download_tokens: signed download access for digital purchases.
-- ----------------------------------------------------------------------------
create table if not exists commerce.download_tokens (
  token          text primary key,
  order_item_id  uuid not null references commerce.order_items(id) on delete cascade,
  expires_at     timestamptz not null,
  used_count     integer not null default 0,
  max_uses       integer not null default 5,
  created_at     timestamptz not null default now()
);

create index if not exists download_tokens_order_item_idx
  on commerce.download_tokens (order_item_id);

-- ----------------------------------------------------------------------------
-- waitlist: emails captured from /plos for PLOS launch + tracker-coming-soon.
-- ----------------------------------------------------------------------------
create table if not exists marketing.waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  source        text not null default 'plos',   -- 'plos' | 'tracker:<slug>' | etc.
  interested_in text,                           -- optional free-text reason / tracker slug
  user_agent    text,
  created_at    timestamptz not null default now(),
  unique (email, source)
);

create index if not exists waitlist_created_at_idx on marketing.waitlist (created_at desc);

-- ============================================================================
-- RLS posture
-- ============================================================================
-- Default-deny is the rule for every table here. Server API routes go through
-- the service-role key (`getServiceSupabase()` in apps/web/lib/supabase.ts),
-- which bypasses RLS entirely. The browser client uses the anon key, which
-- IS subject to RLS — so any table without an explicit "for select" / "for
-- insert" / etc. policy is completely inaccessible from the browser.
--
-- Today only one table needs anon read: `commerce.products` (so the catalog
-- can render server-side or client-side without a session). Everything else
-- — orders, order_items, download_tokens, waitlist — stays server-only.
-- ============================================================================
alter table commerce.products        enable row level security;
alter table commerce.orders          enable row level security;
alter table commerce.order_items     enable row level security;
alter table commerce.download_tokens enable row level security;
alter table marketing.waitlist       enable row level security;

-- Anon users can READ active products (so the homepage can render the catalog
-- without authentication once we switch from the lib/tracker-catalog.ts hardcode).
drop policy if exists products_read_active on commerce.products;
create policy products_read_active on commerce.products
  for select to anon, authenticated
  using (active = true);

-- Defence in depth: explicitly revoke client write grants on products. RLS
-- already denies by default; this means even if someone later adds a
-- permissive policy by mistake, the underlying GRANT is missing too.
revoke insert, update, delete on commerce.products from anon, authenticated;

-- Orders, order_items, download_tokens, waitlist: no client policies.
-- Every read/write goes through the service-role key in our API routes:
--   - /api/razorpay/order, /api/razorpay/cart-order   → orders / order_items
--   - /api/razorpay/verify, /api/razorpay/cart-verify → orders / order_items / download_tokens
--   - /api/razorpay/webhook                           → orders (idempotent)
--   - /api/download                                   → download_tokens / order_items / products
--   - /api/waitlist                                   → marketing.waitlist
-- If you ever add a client-side "view my orders" page, gate it by email
-- match: `for select using (email = current_setting('request.jwt.claims', true)::json->>'email')`.
revoke all on commerce.orders          from anon, authenticated;
revoke all on commerce.order_items     from anon, authenticated;
revoke all on commerce.download_tokens from anon, authenticated;
revoke all on marketing.waitlist       from anon, authenticated;

-- ============================================================================
-- Storage RLS reminder
-- ============================================================================
-- Once you create the `products` bucket in the Supabase dashboard, lock its
-- objects too. From the SQL editor, run:
--
--   -- Anon CANNOT list or read; only the service role (used by /api/download)
--   -- can fetch the underlying file.
--   create policy products_storage_service_only on storage.objects
--     for all to service_role using (bucket_id = 'products');
--
-- And in the bucket Settings, set it to PRIVATE (not public). The signed
-- download token in commerce.download_tokens is the only legitimate path
-- to the file.

-- ----------------------------------------------------------------------------
-- Seed: insert the Freelancer GST Tracker + bundle so server-side reads work.
-- ----------------------------------------------------------------------------
insert into commerce.products (id, type, title, description, price_paise, storage_path)
values (
  'freelancer-gst',
  'digital',
  'Freelancer GST Tracker',
  'Logs invoices, GST output/input, TDS deducted, and produces a clean quarterly summary for Indian freelancers.',
  24900,
  'trackers/freelancer-gst.xlsx'
),
(
  'all-trackers-bundle',
  'bundle',
  'All-Trackers Bundle',
  'All four NIS trackers at 25% off. Freelancer GST delivered immediately; the remaining three ship as each tracker goes live.',
  81450,
  null
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paise = excluded.price_paise,
  storage_path = excluded.storage_path;

-- ----------------------------------------------------------------------------
-- E-book seed template (commented until the first PDF actually exists).
-- E-books reuse the digital pipeline: type='digital', storage_path points at
-- the file in the `products` bucket under ebooks/<slug>.<ext>. The matching
-- catalog entry lives in apps/web/lib/ebook-catalog.ts. To go live:
--   1. Upload the file:   products/ebooks/<slug>.pdf
--   2. Flip active: true on the ebook-catalog.ts entry
--   3. Run the upsert below with the real slug/title/price.
-- ----------------------------------------------------------------------------
-- insert into commerce.products (id, type, title, description, price_paise, storage_path)
-- values (
--   'ai-freelancer-india',
--   'digital',
--   'The AI-Assisted Freelancer · India Edition',
--   'India-first playbook for running a freelance business with AI — proposals, outreach, invoicing, GST.',
--   29900,
--   'ebooks/ai-freelancer-india.pdf'
-- )
-- on conflict (id) do update set
--   title = excluded.title,
--   description = excluded.description,
--   price_paise = excluded.price_paise,
--   storage_path = excluded.storage_path;

-- NIS commerce schema (Week 1 baseline).
-- Run this in the Supabase SQL editor for the `thenispace` project.
-- All amounts are in PAISE (₹1 = 100 paise) to avoid floating-point money.

create schema if not exists commerce;

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
-- RLS: lock everything down by default. API routes use the service role key.
-- ----------------------------------------------------------------------------
alter table commerce.products enable row level security;
alter table commerce.orders enable row level security;
alter table commerce.order_items enable row level security;
alter table commerce.download_tokens enable row level security;

-- Anon users can READ active products (so the homepage can render the catalog
-- without authentication once we switch from the lib/tracker-catalog.ts hardcode).
drop policy if exists products_read_active on commerce.products;
create policy products_read_active on commerce.products
  for select using (active = true);

-- All other access goes through service role (which bypasses RLS).
-- No additional policies needed.

-- ----------------------------------------------------------------------------
-- waitlist: emails captured from /plos for PLOS launch + tracker-coming-soon.
-- ----------------------------------------------------------------------------
create schema if not exists marketing;

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

-- ----------------------------------------------------------------------------
-- Seed: insert the Freelancer GST Tracker so server-side reads can find it.
-- ----------------------------------------------------------------------------
insert into commerce.products (id, type, title, description, price_paise, storage_path)
values (
  'freelancer-gst',
  'digital',
  'Freelancer GST Tracker',
  'Logs invoices, GST output/input, TDS deducted, and produces a clean quarterly summary for Indian freelancers.',
  24900,
  'trackers/freelancer-gst.xlsx'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paise = excluded.price_paise,
  storage_path = excluded.storage_path;

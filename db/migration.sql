-- =====================================================================
-- KORASUTRA — Self-hosted commerce schema (replaces Shopify)
-- =====================================================================
-- Run order matters: extensions → enums → tables → indexes → functions
-- → triggers → RLS policies → realtime publication.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type public.app_role         as enum ('admin', 'staff');
create type public.product_status   as enum ('active', 'draft', 'archived');
create type public.order_status     as enum (
  'pending_payment', 'confirmed', 'processing',
  'shipped', 'delivered', 'cancelled', 'refunded'
);
create type public.payment_status   as enum ('pending', 'paid', 'failed', 'refunded');
create type public.payment_method   as enum ('razorpay', 'cod');
create type public.inventory_reason as enum ('purchase', 'restock', 'adjustment', 'return', 'cancellation');

-- =====================================================================
-- AUTH / ROLES
-- =====================================================================

-- Admin users (separate from customers; managed via /admin)
create table public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  password_hash text not null,
  email         text,
  created_at    timestamptz not null default now()
);

create table public.admin_sessions (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.admin_users(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Role table (best practice — never store roles on the user row)
create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.admin_users(id) on delete cascade,
  role       app_role not null,
  created_at timestamptz not null default now(),
  unique (admin_id, role)
);

-- =====================================================================
-- CUSTOMERS (WhatsApp-OTP based, no Supabase auth.users)
-- =====================================================================

create table public.customers (
  id                 uuid primary key default gen_random_uuid(),
  phone              text not null,
  country_code       text not null default '+91',
  name               text,
  email              text,
  is_verified        boolean not null default false,
  marketing_opt_in   boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (country_code, phone)
);

create table public.customer_sessions (
  id         uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.customer_addresses (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  address_line1 text not null,
  address_line2 text,
  city          text not null,
  state         text not null,
  postal_code   text not null,
  country       text not null default 'India',
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- WhatsApp OTP verifications (AISensy)
create table public.otp_verifications (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null,
  country_code text not null default '+91',
  otp_hash     text not null,
  expires_at   timestamptz not null,
  verified     boolean not null default false,
  attempts     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index idx_otp_phone on public.otp_verifications(country_code, phone, created_at desc);

-- =====================================================================
-- CATALOG
-- =====================================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  handle             text not null unique,            -- URL slug, used by /products/:handle
  title              text not null,
  description        text,                            -- SEO-optimised long description (HTML/markdown)
  short_description  text,
  category_id        uuid references public.categories(id) on delete set null,
  fabric             text,
  technique          text,
  color              text,
  has_blouse_piece   boolean not null default false,  -- "Blouse yes/no" — surfaces in Blouses catalog
  status             product_status not null default 'active',
  -- Pricing (single source of truth at product level; variants can override)
  price              numeric(10,2) not null,          -- Selling price (incl. GST)
  compare_at_price   numeric(10,2),                   -- "Actual" / strike-through price
  -- SEO
  seo_title          text,
  seo_description    text,
  -- Metadata
  tags               text[] not null default '{}',
  position           integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_products_status   on public.products(status);
create index idx_products_category on public.products(category_id);
create index idx_products_handle   on public.products(handle);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt_text    text,
  position    integer not null default 0,             -- 0..4 (max 5 enforced in app)
  created_at  timestamptz not null default now()
);
create index idx_product_images_product on public.product_images(product_id, position);

create table public.product_variants (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  sku               text not null unique,
  title             text not null default 'Default',  -- e.g. "Red / Free Size"
  option1_name      text,                              -- e.g. "Color"
  option1_value     text,
  option2_name      text,
  option2_value     text,
  price             numeric(10,2),                    -- nullable -> falls back to product.price
  compare_at_price  numeric(10,2),
  inventory_qty     integer not null default 0,
  track_inventory   boolean not null default true,
  position          integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_variants_product on public.product_variants(product_id);

-- Inventory ledger (audit trail for every stock movement)
create table public.inventory_movements (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid not null references public.product_variants(id) on delete cascade,
  delta       integer not null,                       -- + restock, - sale
  reason      inventory_reason not null,
  reference   text,                                   -- order_id, manual note, etc.
  created_at  timestamptz not null default now()
);
create index idx_inventory_variant on public.inventory_movements(variant_id, created_at desc);

-- =====================================================================
-- ORDERS
-- =====================================================================

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,           -- e.g. KS-100001 (generated)
  customer_id         uuid references public.customers(id) on delete set null,
  -- Snapshot of contact info (immutable after placement)
  contact_email       text,
  contact_phone       text not null,
  -- Snapshot of shipping address
  ship_full_name      text not null,
  ship_phone          text not null,
  ship_address_line1  text not null,
  ship_address_line2  text,
  ship_city           text not null,
  ship_state          text not null,
  ship_postal_code    text not null,
  ship_country        text not null default 'India',
  -- Money
  subtotal            numeric(10,2) not null,
  shipping_amount     numeric(10,2) not null default 0,
  cod_surcharge       numeric(10,2) not null default 0, -- ₹200 if COD
  discount_amount     numeric(10,2) not null default 0,
  total               numeric(10,2) not null,
  currency            text not null default 'INR',
  -- Payment
  payment_method      payment_method not null,
  payment_status      payment_status not null default 'pending',
  razorpay_order_id   text,
  razorpay_payment_id text,
  razorpay_signature  text,
  -- Fulfilment
  status              order_status not null default 'pending_payment',
  tracking_number     text,
  tracking_url        text,
  carrier             text,
  notes               text,                            -- internal admin notes
  -- Timestamps
  placed_at           timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_status   on public.orders(status);
create index idx_orders_created  on public.orders(created_at desc);

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  variant_id        uuid references public.product_variants(id) on delete set null,
  -- Snapshot at time of purchase
  product_title     text not null,
  variant_title     text,
  sku               text,
  image_url         text,
  unit_price        numeric(10,2) not null,
  quantity          integer not null,
  line_total        numeric(10,2) not null,
  created_at        timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);

-- Sequence-backed order number generator: KS-100001, KS-100002, ...
create sequence if not exists public.order_number_seq start with 100001;

create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'KS-' || nextval('public.order_number_seq')::text;
$$;

-- =====================================================================
-- REVIEWS (preserved from existing schema)
-- =====================================================================
create table public.reviews (
  id                    uuid primary key default gen_random_uuid(),
  product_id            text not null,
  product_handle        text not null,
  customer_id           uuid references public.customers(id) on delete set null,
  order_item_id         uuid references public.order_items(id) on delete set null,
  customer_name         text not null,
  customer_email        text,
  rating                integer not null check (rating between 1 and 5),
  title                 text,
  content               text not null,
  is_verified_purchase  boolean not null default false,
  is_approved           boolean not null default true,
  helpful_count         integer not null default 0,
  admin_reply           text check (admin_reply is null or length(admin_reply) <= 2000),
  admin_reply_author    text,
  admin_replied_at      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index idx_reviews_handle on public.reviews(product_handle);
create index idx_reviews_customer_product on public.reviews(customer_id, product_id);
create index idx_reviews_order_item on public.reviews(order_item_id);

-- =====================================================================
-- TRIGGERS — updated_at auto-touch
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_touch_customers          before update on public.customers          for each row execute function public.touch_updated_at();
create trigger trg_touch_customer_addresses before update on public.customer_addresses for each row execute function public.touch_updated_at();
create trigger trg_touch_products           before update on public.products           for each row execute function public.touch_updated_at();
create trigger trg_touch_variants           before update on public.product_variants   for each row execute function public.touch_updated_at();
create trigger trg_touch_orders             before update on public.orders             for each row execute function public.touch_updated_at();
create trigger trg_touch_reviews            before update on public.reviews            for each row execute function public.touch_updated_at();

-- =====================================================================
-- SECURITY DEFINER HELPERS
-- =====================================================================

-- Resolve current customer from x-session-token header
create or replace function public.get_current_customer_id()
returns uuid
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_token text;
  v_customer_id uuid;
begin
  begin
    v_token := current_setting('request.headers', true)::json->>'x-session-token';
  exception when others then
    return null;
  end;
  if v_token is null or v_token = '' then return null; end if;

  select customer_id into v_customer_id
  from public.customer_sessions
  where token = v_token and expires_at > now();

  return v_customer_id;
end;
$$;

-- Resolve current admin from x-admin-token header
create or replace function public.get_current_admin_id()
returns uuid
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_token text;
  v_admin_id uuid;
begin
  begin
    v_token := current_setting('request.headers', true)::json->>'x-admin-token';
  exception when others then
    return null;
  end;
  if v_token is null or v_token = '' then return null; end if;

  select admin_id into v_admin_id
  from public.admin_sessions
  where token = v_token and expires_at > now();

  return v_admin_id;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.get_current_admin_id() is not null;
$$;

-- Approved-reviews RPC (read path bypassing direct SELECT)
create or replace function public.get_approved_reviews(p_product_handle text default null)
returns table (
  id uuid, product_id text, product_handle text, customer_name text,
  rating integer, title text, content text,
  is_verified_purchase boolean, is_approved boolean, helpful_count integer,
  admin_reply text, admin_reply_author text, admin_replied_at timestamptz,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select r.id, r.product_id, r.product_handle, r.customer_name,
         r.rating, r.title, r.content,
         r.is_verified_purchase, r.is_approved, r.helpful_count,
         r.admin_reply, r.admin_reply_author, r.admin_replied_at,
         r.created_at, r.updated_at
  from public.reviews r
  where r.is_approved = true
    and (p_product_handle is null or r.product_handle = p_product_handle)
  order by r.created_at desc;
end;
$$;

create or replace function public.get_product_review_stats(p_handle text)
returns table (
  average_rating numeric, total_reviews bigint,
  rating_1 bigint, rating_2 bigint, rating_3 bigint, rating_4 bigint, rating_5 bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select coalesce(round(avg(rating)::numeric, 1), 0),
         count(*),
         count(*) filter (where rating = 1),
         count(*) filter (where rating = 2),
         count(*) filter (where rating = 3),
         count(*) filter (where rating = 4),
         count(*) filter (where rating = 5)
  from public.reviews
  where product_handle = p_handle and is_approved = true;
end;
$$;

create or replace function public.increment_review_helpful(p_review_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reviews set helpful_count = helpful_count + 1
  where id = p_review_id and is_approved = true;
end;
$$;

create or replace function public.cleanup_expired_sessions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.customer_sessions where expires_at < now();
  delete from public.admin_sessions    where expires_at < now();
  delete from public.otp_verifications where created_at < now() - interval '1 day';
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.admin_users         enable row level security;
alter table public.admin_sessions      enable row level security;
alter table public.user_roles          enable row level security;
alter table public.customers           enable row level security;
alter table public.customer_sessions   enable row level security;
alter table public.customer_addresses  enable row level security;
alter table public.otp_verifications   enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.product_variants    enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.reviews             enable row level security;

-- Admin tables: locked down (server-side edge functions only)
create policy "deny all" on public.admin_users    for all using (false);
create policy "deny all" on public.admin_sessions for all using (false);
create policy "deny all" on public.user_roles     for all using (false);
create policy "deny all" on public.customer_sessions for all using (false);
create policy "deny all" on public.otp_verifications for all using (false);

-- Public catalog: anyone can read active products
create policy "Public can read active products" on public.products
  for select using (status = 'active');
create policy "Admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read images of active products" on public.product_images
  for select using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
create policy "Admins manage images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read variants of active products" on public.product_variants
  for select using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
create policy "Admins manage variants" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read categories" on public.categories
  for select using (true);
create policy "Admins manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- Inventory: admin only
create policy "Admins manage inventory" on public.inventory_movements
  for all using (public.is_admin()) with check (public.is_admin());

-- Customers: own row only (admins via edge functions w/ service role)
create policy "Customers view own profile" on public.customers
  for select using (id = public.get_current_customer_id());
create policy "Customers update own profile" on public.customers
  for update using (id = public.get_current_customer_id());

-- Customer addresses: own only
create policy "Customers view own addresses" on public.customer_addresses
  for select using (customer_id = public.get_current_customer_id());
create policy "Customers create own addresses" on public.customer_addresses
  for insert with check (customer_id = public.get_current_customer_id());
create policy "Customers update own addresses" on public.customer_addresses
  for update using (customer_id = public.get_current_customer_id());
create policy "Customers delete own addresses" on public.customer_addresses
  for delete using (customer_id = public.get_current_customer_id());

-- Orders: customer sees own; admins see all
create policy "Customers view own orders" on public.orders
  for select using (customer_id = public.get_current_customer_id());
create policy "Admins view all orders" on public.orders
  for select using (public.is_admin());
create policy "Admins update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
-- INSERT goes through edge functions w/ service role

create policy "Customers view own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and o.customer_id = public.get_current_customer_id())
  );
create policy "Admins view all order items" on public.order_items
  for select using (public.is_admin());

-- Reviews: existing pattern (RPC for reads, validated INSERT)
create policy "Block direct SELECT - use get_approved_reviews RPC" on public.reviews
  for select using (false);
create policy "Block direct INSERT - use product-review function" on public.reviews
  for insert with check (false);

-- =====================================================================
-- REALTIME — orders & order_items for live admin dashboard
-- =====================================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.product_variants;

-- =====================================================================
-- SEED — categories + default admin
-- =====================================================================
insert into public.categories (slug, name, sort_order) values
  ('sarees',  'Sarees',  1),
  ('blouses', 'Blouses', 2)
on conflict (slug) do nothing;

-- Default admin is seeded by the Supabase migrations and can be changed from /admin Settings.

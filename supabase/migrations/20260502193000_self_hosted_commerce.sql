-- Korasutra self-hosted commerce foundation.
-- Additive migration for catalog, checkout, orders, inventory, admin reads.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('admin', 'staff');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.product_status as enum ('active', 'draft', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum (
    'pending_payment', 'confirmed', 'processing', 'shipped',
    'delivered', 'cancelled', 'refunded'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_method as enum ('razorpay', 'cod');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.inventory_reason as enum ('purchase', 'restock', 'adjustment', 'return', 'cancellation');
exception when duplicate_object then null;
end $$;

alter table public.customers add column if not exists marketing_opt_in boolean not null default false;
alter table public.customer_addresses add column if not exists full_name text;
alter table public.customer_addresses add column if not exists phone text;
update public.customer_addresses set full_name = coalesce(full_name, 'Customer') where full_name is null;
update public.customer_addresses set phone = coalesce(phone, '') where phone is null;
alter table public.customer_addresses alter column full_name set not null;
alter table public.customer_addresses alter column phone set not null;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (admin_id, role)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  title text not null,
  description text,
  short_description text,
  category_id uuid references public.categories(id) on delete set null,
  fabric text,
  technique text,
  color text,
  has_blouse_piece boolean not null default false,
  status product_status not null default 'active',
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  seo_title text,
  seo_description text,
  tags text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  title text not null default 'Default',
  option1_name text,
  option1_value text,
  option2_name text,
  option2_value text,
  price numeric(10,2),
  compare_at_price numeric(10,2),
  inventory_qty integer not null default 0,
  track_inventory boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  delta integer not null,
  reason inventory_reason not null,
  reference text,
  created_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start with 100001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  contact_email text,
  contact_phone text not null,
  ship_full_name text not null,
  ship_phone text not null,
  ship_address_line1 text not null,
  ship_address_line2 text,
  ship_city text not null,
  ship_state text not null,
  ship_postal_code text not null,
  ship_country text not null default 'India',
  subtotal numeric(10,2) not null,
  shipping_amount numeric(10,2) not null default 0,
  cod_surcharge numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  currency text not null default 'INR',
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status order_status not null default 'pending_payment',
  tracking_number text,
  tracking_url text,
  carrier text,
  notes text,
  placed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_title text not null,
  variant_title text,
  sku text,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity integer not null,
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_product_images_product on public.product_images(product_id, position);
create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_inventory_variant on public.inventory_movements(variant_id, created_at desc);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_products on public.products;
create trigger trg_touch_products before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_variants on public.product_variants;
create trigger trg_touch_variants before update on public.product_variants
for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_orders on public.orders;
create trigger trg_touch_orders before update on public.orders
for each row execute function public.touch_updated_at();

create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'KS-' || nextval('public.order_number_seq')::text;
$$;

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

alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select using (status = 'active');
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read images of active products" on public.product_images;
create policy "Public can read images of active products" on public.product_images
for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
drop policy if exists "Admins manage images" on public.product_images;
create policy "Admins manage images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read variants of active products" on public.product_variants;
create policy "Public can read variants of active products" on public.product_variants
for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
drop policy if exists "Admins manage variants" on public.product_variants;
create policy "Admins manage variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage inventory" on public.inventory_movements;
create policy "Admins manage inventory" on public.inventory_movements for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Customers view own orders" on public.orders;
create policy "Customers view own orders" on public.orders for select using (customer_id = public.get_current_customer_id());
drop policy if exists "Public can track by order number" on public.orders;
create policy "Public can track by order number" on public.orders for select using (true);
drop policy if exists "Admins view all orders" on public.orders;
create policy "Admins view all orders" on public.orders for select using (public.is_admin());
drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Customers view own order items" on public.order_items;
create policy "Customers view own order items" on public.order_items
for select using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = public.get_current_customer_id()));
drop policy if exists "Public can read tracked order items" on public.order_items;
create policy "Public can read tracked order items" on public.order_items for select using (true);
drop policy if exists "Admins view all order items" on public.order_items;
create policy "Admins view all order items" on public.order_items for select using (public.is_admin());

insert into public.categories (slug, name, sort_order) values
  ('sarees', 'Sarees', 1),
  ('blouses', 'Blouses', 2)
on conflict (slug) do nothing;

alter table public.admin_users add column if not exists email text;

insert into public.admin_users (username, password_hash, email)
values ('korasutra.official@gmail.com', '9d3bfeceeeab8f06130d094b83f2bd5f574dc495ab1c6927ad5f77ed8d0d3061', 'korasutra.official@gmail.com')
on conflict (username) do update set password_hash = excluded.password_hash, email = excluded.email;

do $$
begin
  alter publication supabase_realtime add table public.products;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.product_images;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.order_items;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.product_variants;
exception when others then null;
end $$;

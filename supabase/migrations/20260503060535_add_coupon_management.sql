begin;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y')),
  discount_value numeric(10,2) not null default 0,
  min_order_value numeric(10,2),
  max_discount_cap numeric(10,2),
  usage_limit_total integer,
  usage_limit_per_customer integer,
  first_order_only boolean not null default false,
  start_at timestamptz,
  end_at timestamptz,
  never_expires boolean not null default false,
  applies_to text not null default 'all' check (applies_to in ('all', 'specific_products', 'specific_categories', 'specific_fabrics', 'specific_patterns', 'specific_occasions')),
  included_product_ids uuid[] not null default '{}',
  included_category_slugs text[] not null default '{}',
  included_tags text[] not null default '{}',
  excluded_product_ids uuid[] not null default '{}',
  excluded_category_slugs text[] not null default '{}',
  exclude_sale_items boolean not null default false,
  can_combine_with_coupons boolean not null default false,
  can_combine_with_sale_prices boolean not null default true,
  auto_apply boolean not null default false,
  display_on_website boolean not null default false,
  priority integer not null default 0,
  buy_quantity integer,
  get_quantity integer,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_format check (code = upper(code) and code ~ '^[A-Z0-9][A-Z0-9_-]{2,39}$'),
  constraint coupons_positive_discount check (
    (discount_type in ('percentage', 'fixed_amount') and discount_value > 0)
    or (discount_type = 'free_shipping')
    or (discount_type = 'buy_x_get_y' and coalesce(buy_quantity, 0) > 0 and coalesce(get_quantity, 0) > 0)
  ),
  constraint coupons_percentage_bounds check (discount_type <> 'percentage' or discount_value <= 100),
  constraint coupons_valid_dates check (never_expires = true or end_at is null or start_at is null or end_at > start_at)
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  discount_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

alter table public.orders add column if not exists coupon_id uuid references public.coupons(id) on delete set null;
alter table public.orders add column if not exists coupon_code text;

create index if not exists idx_coupons_status_dates on public.coupons(status, start_at, end_at);
create index if not exists idx_coupons_priority on public.coupons(priority desc, created_at desc);
create index if not exists idx_coupon_redemptions_coupon on public.coupon_redemptions(coupon_id, created_at desc);
create index if not exists idx_coupon_redemptions_customer on public.coupon_redemptions(customer_id, coupon_id);

create or replace function public.increment_coupon_usage(coupon_id_input uuid)
returns void
language sql
set search_path = public
as $$
  update public.coupons
  set usage_count = usage_count + 1
  where id = coupon_id_input;
$$;

drop trigger if exists trg_touch_coupons on public.coupons;
create trigger trg_touch_coupons before update on public.coupons
for each row execute function public.touch_updated_at();

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

drop policy if exists "Public can read active display coupons" on public.coupons;
create policy "Public can read active display coupons" on public.coupons
for select using (
  status = 'active'
  and display_on_website = true
  and (start_at is null or start_at <= now())
  and (never_expires = true or end_at is null or end_at >= now())
);

drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons" on public.coupons
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins view coupon redemptions" on public.coupon_redemptions;
create policy "Admins view coupon redemptions" on public.coupon_redemptions
for select using (public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.coupons;
exception when others then null;
end $$;

commit;

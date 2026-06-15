begin;

alter table public.product_variants
  add column if not exists option3_name text,
  add column if not exists option3_value text,
  add column if not exists option4_name text,
  add column if not exists option4_value text;

create table if not exists public.product_handle_redirects (
  old_handle text primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_handle_redirects_product_id
  on public.product_handle_redirects(product_id);

alter table public.product_handle_redirects enable row level security;

grant select on table public.product_handle_redirects to anon, authenticated, service_role;
grant insert, update, delete on table public.product_handle_redirects to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_handle_redirects'
      and policyname = 'Public product handle redirects are readable'
  ) then
    create policy "Public product handle redirects are readable"
      on public.product_handle_redirects
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

insert into public.product_variants (
  product_id,
  sku,
  title,
  price,
  compare_at_price,
  inventory_qty,
  track_inventory,
  position
)
select
  product.id,
  'KS-' || upper(trim(both '-' from regexp_replace(product.handle, '[^a-zA-Z0-9]+', '-', 'g')))
    || '-' || substring(replace(product.id::text, '-', '') from 1 for 8),
  'Default',
  product.price,
  product.compare_at_price,
  0,
  true,
  0
from public.products product
where not exists (
  select 1
  from public.product_variants variant
  where variant.product_id = product.id
);

update public.product_variants
set sku = 'KS-' || upper(trim(both '-' from regexp_replace(product.handle, '[^a-zA-Z0-9]+', '-', 'g')))
  || '-' || substring(replace(public.product_variants.id::text, '-', '') from 1 for 8)
from public.products product
where public.product_variants.product_id = product.id
  and btrim(coalesce(public.product_variants.sku, '')) = '';

create temporary table product_handle_updates on commit drop as
with first_variants as (
  select distinct on (variant.product_id)
    variant.product_id,
    variant.sku
  from public.product_variants variant
  order by variant.product_id, variant.position, variant.created_at, variant.id
),
candidates as (
  select
    product.id as product_id,
    product.handle as old_handle,
    trim(both '-' from regexp_replace(
      lower(first_variant.sku || '-' || product.title),
      '[^a-z0-9]+',
      '-',
      'g'
    )) as desired_handle
  from public.products product
  join first_variants first_variant on first_variant.product_id = product.id
),
ranked as (
  select
    candidates.*,
    row_number() over (
      partition by desired_handle
      order by product_id
    ) as collision_position
  from candidates
)
select
  product_id,
  old_handle,
  desired_handle,
  case
    when collision_position = 1 then desired_handle
    else desired_handle || '-' || substring(replace(product_id::text, '-', '') from 1 for 8)
  end as final_handle
from ranked;

insert into public.product_handle_redirects(old_handle, product_id)
select old_handle, product_id
from product_handle_updates
where old_handle is distinct from final_handle
on conflict (old_handle) do update
set product_id = excluded.product_id;

update public.products product
set handle = '__migrating__-' || replace(product.id::text, '-', '')
from product_handle_updates handle_update
where product.id = handle_update.product_id
  and handle_update.old_handle is distinct from handle_update.final_handle;

update public.products product
set handle = handle_update.final_handle
from product_handle_updates handle_update
where product.id = handle_update.product_id
  and product.handle is distinct from handle_update.final_handle;

update public.reviews review
set product_handle = handle_update.final_handle,
    updated_at = now()
from product_handle_updates handle_update
where review.product_id = handle_update.product_id::text
  and review.product_handle is distinct from handle_update.final_handle;

update public.site_settings
set navbar = jsonb_set(
  coalesce(navbar, '{}'::jsonb),
  '{commerceSchemaVersion}',
  '2'::jsonb,
  true
)
where id = 'global';

commit;

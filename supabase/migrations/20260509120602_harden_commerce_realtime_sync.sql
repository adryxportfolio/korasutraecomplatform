-- Keep every admin/storefront/customer account surface eligible for
-- Postgres-change realtime. App-level broadcast remains the primary path.
do $$
declare
  v_table_name text;
begin
  foreach v_table_name in array array[
    'categories',
    'products',
    'product_images',
    'product_videos',
    'product_variants',
    'coupons',
    'coupon_redemptions',
    'orders',
    'order_items',
    'customers',
    'customer_addresses',
    'inventory_movements',
    'site_settings'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = v_table_name
    )
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table_name);
    end if;
  end loop;
end $$;

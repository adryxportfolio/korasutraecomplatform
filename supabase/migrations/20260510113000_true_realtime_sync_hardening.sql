-- Harden commerce realtime coverage for the Vite storefront/admin app.
--
-- Public catalog/journal/site tables can emit postgres_changes directly to
-- browser clients through RLS. Private admin data such as orders and customers
-- stays protected; Edge Functions emit the commerce-sync broadcast after
-- mutations, and authenticated admin fetches still go through admin-commerce.

begin;

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
    'customer_activities',
    'customer_addresses',
    'inventory_movements',
    'site_settings',
    'journal_articles'
  ]
  loop
    if to_regclass(format('public.%I', v_table_name)) is not null then
      begin
        execute format('alter publication supabase_realtime add table public.%I', v_table_name);
      exception
        when duplicate_object then null;
        when undefined_object then null;
      end;

      execute format('alter table public.%I replica identity full', v_table_name);
    end if;
  end loop;
end $$;

grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.product_videos to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.coupons to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.journal_articles to anon, authenticated;

commit;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customer_sessions_customer_id_fkey'
      and conrelid = 'public.customer_sessions'::regclass
  ) then
    alter table public.customer_sessions
      add constraint customer_sessions_customer_id_fkey
      foreign key (customer_id)
      references public.customers(id)
      on delete cascade;
  end if;
end $$;

grant usage on schema public to anon, authenticated;

grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.product_videos to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.coupons to anon, authenticated;
grant select on public.coupon_redemptions to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'products',
    'product_images',
    'product_videos',
    'product_variants',
    'coupons',
    'coupon_redemptions',
    'orders',
    'order_items',
    'customers',
    'inventory_movements'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      begin
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      exception
        when duplicate_object then null;
        when undefined_object then null;
      end;
    end if;
  end loop;
end $$;

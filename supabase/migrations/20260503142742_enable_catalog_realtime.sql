do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'products',
    'product_images',
    'product_videos',
    'product_variants',
    'orders',
    'order_items',
    'coupons',
    'coupon_redemptions',
    'customers',
    'inventory_movements'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      begin
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      exception
        when duplicate_object then
          null;
      end;
    end if;
  end loop;
end $$;

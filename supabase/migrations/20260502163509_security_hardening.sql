drop policy if exists "Public can track by order number" on public.orders;
drop policy if exists "Public can read tracked order items" on public.order_items;
drop policy if exists "Public can read product images" on storage.objects;

alter function public.generate_order_number() set search_path = public;
alter function public.touch_updated_at() set search_path = public;

-- Order tracking is served through the track-order Edge Function, which requires
-- either a valid customer session or the matching verified phone number.
drop policy if exists "Public can track by order number" on public.orders;
drop policy if exists "Public can read tracked order items" on public.order_items;

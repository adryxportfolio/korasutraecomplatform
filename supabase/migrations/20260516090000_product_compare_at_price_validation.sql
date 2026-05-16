alter table public.products
  drop constraint if exists products_compare_at_price_above_price;

alter table public.products
  add constraint products_compare_at_price_above_price
  check (compare_at_price is null or compare_at_price > price)
  not valid;

alter table public.product_variants
  drop constraint if exists product_variants_compare_at_price_above_price;

alter table public.product_variants
  add constraint product_variants_compare_at_price_above_price
  check (compare_at_price is null or price is null or compare_at_price > price)
  not valid;

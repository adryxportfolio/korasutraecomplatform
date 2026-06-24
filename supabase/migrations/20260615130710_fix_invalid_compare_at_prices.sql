-- Some legacy rows carry an invalid compare_at_price (e.g. -1.00) that predates
-- the products_compare_at_price_above_price / product_variants_compare_at_price_above_price
-- check constraints, which were added NOT VALID and therefore never rejected them.
-- The product-variant/handle migration that follows UPDATEs these rows, which
-- re-validates the constraint and fails. Null out the invalid sale prices first
-- (a compare_at_price must be greater than the price to be meaningful).

update public.products
set compare_at_price = null
where compare_at_price is not null
  and compare_at_price <= price;

update public.product_variants
set compare_at_price = null
where compare_at_price is not null
  and price is not null
  and compare_at_price <= price;

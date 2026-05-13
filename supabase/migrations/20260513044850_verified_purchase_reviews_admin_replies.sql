begin;

alter table public.reviews
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists order_item_id uuid references public.order_items(id) on delete set null,
  add column if not exists admin_reply text,
  add column if not exists admin_reply_author text,
  add column if not exists admin_replied_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_admin_reply_length'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_admin_reply_length
      check (admin_reply is null or length(admin_reply) <= 2000);
  end if;
end $$;

create index if not exists idx_reviews_customer_product
  on public.reviews(customer_id, product_id);

create index if not exists idx_reviews_order_item
  on public.reviews(order_item_id);

drop policy if exists "Anyone can submit reviews" on public.reviews;
drop policy if exists "Anyone can submit valid reviews" on public.reviews;
drop policy if exists "Block direct INSERT - use product-review function" on public.reviews;

create policy "Block direct INSERT - use product-review function"
on public.reviews
for insert
with check (false);

revoke insert, update, delete on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;

drop function if exists public.get_approved_reviews(text);

create function public.get_approved_reviews(p_product_handle text default null)
returns table (
  id uuid,
  product_id text,
  product_handle text,
  customer_name text,
  rating integer,
  title text,
  content text,
  is_verified_purchase boolean,
  is_approved boolean,
  helpful_count integer,
  admin_reply text,
  admin_reply_author text,
  admin_replied_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select r.id,
         r.product_id,
         r.product_handle,
         r.customer_name,
         r.rating,
         r.title,
         r.content,
         r.is_verified_purchase,
         r.is_approved,
         r.helpful_count,
         r.admin_reply,
         r.admin_reply_author,
         r.admin_replied_at,
         r.created_at,
         r.updated_at
  from public.reviews r
  where r.is_approved = true
    and (p_product_handle is null or r.product_handle = p_product_handle)
  order by r.created_at desc;
end;
$$;

grant execute on function public.get_approved_reviews(text) to anon, authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.reviews;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

commit;

begin;

create table if not exists public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  position integer not null default 0,
  content_type text,
  storage_key text,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_videos_product on public.product_videos(product_id, position);

alter table public.product_videos enable row level security;

drop policy if exists "Public can read videos of active products" on public.product_videos;
create policy "Public can read videos of active products" on public.product_videos
for select using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
);

drop policy if exists "Admins manage videos" on public.product_videos;
create policy "Admins manage videos" on public.product_videos
for all using (public.is_admin()) with check (public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.product_videos;
exception when others then null;
end $$;

commit;

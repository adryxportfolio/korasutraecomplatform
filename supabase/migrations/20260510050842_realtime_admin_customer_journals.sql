begin;

create table if not exists public.customer_activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  activity_type text not null check (activity_type in ('just_visit', 'product_added_to_cart', 'checkout')),
  sku text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_activities_customer_created
  on public.customer_activities(customer_id, created_at desc);

create index if not exists idx_customer_activities_type_created
  on public.customer_activities(activity_type, created_at desc);

create table if not exists public.journal_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  image_url text,
  category text not null default 'Journal',
  author text not null default 'Kora Sutra',
  read_time text not null default '3 min read',
  keywords text[] not null default '{}',
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_articles_status_published
  on public.journal_articles(status, published_at desc, created_at desc);

drop trigger if exists trg_touch_journal_articles on public.journal_articles;
create trigger trg_touch_journal_articles before update on public.journal_articles
for each row execute function public.touch_updated_at();

alter table public.customer_activities enable row level security;
alter table public.journal_articles enable row level security;

drop policy if exists "Admins view customer activities" on public.customer_activities;
create policy "Admins view customer activities" on public.customer_activities
for select using (public.is_admin());

drop policy if exists "Customers view own customer activities" on public.customer_activities;
create policy "Customers view own customer activities" on public.customer_activities
for select using (customer_id = public.get_current_customer_id());

drop policy if exists "Public can read published journal articles" on public.journal_articles;
create policy "Public can read published journal articles" on public.journal_articles
for select using (status = 'published');

drop policy if exists "Admins manage journal articles" on public.journal_articles;
create policy "Admins manage journal articles" on public.journal_articles
for all using (public.is_admin()) with check (public.is_admin());

grant select on public.journal_articles to anon, authenticated;
grant select on public.customer_activities to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'customer_activities',
    'journal_articles'
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

commit;

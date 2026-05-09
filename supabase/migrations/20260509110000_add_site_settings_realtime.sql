begin;

create table if not exists public.site_settings (
  id text primary key default 'global',
  hero jsonb not null default '{}'::jsonb,
  navbar jsonb not null default '{}'::jsonb,
  promo_popup jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 'global')
);

insert into public.site_settings (id, hero, navbar, promo_popup)
values (
  'global',
  jsonb_build_object(
    'desktopImageUrl', '',
    'mobileImageUrl', '',
    'altText', 'Kora Sutra Sarees - Explore Our Collection of Handcrafted Tussar, Muslin & Silk Sarees',
    'ctaText', 'Explore Our Collection',
    'ctaHref', '/collections/all'
  ),
  jsonb_build_object(
    'announcementEnabled', true,
    'announcementText', 'FREE Shipping All Over India',
    'announcementHref', '/collections/all',
    'navLinks', jsonb_build_array(
      jsonb_build_object('label', 'Home', 'href', '/', 'enabled', true),
      jsonb_build_object('label', 'Products', 'href', '/collections/all', 'enabled', true)
    )
  ),
  jsonb_build_object(
    'enabled', false,
    'title', '',
    'body', '',
    'discountLabel', '',
    'code', '',
    'ctaText', 'Shop Now',
    'ctaHref', '/collections/all',
    'finePrint', '',
    'delayMs', 1500
  )
)
on conflict (id) do nothing;

drop trigger if exists trg_touch_site_settings on public.site_settings;
create trigger trg_touch_site_settings before update on public.site_settings
for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
for select using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
for all using (public.is_admin()) with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.site_settings;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

commit;

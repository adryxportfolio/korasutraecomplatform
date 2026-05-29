create table if not exists public.whatsapp_message_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  activity_id uuid references public.customer_activities(id) on delete set null,
  message_type text not null check (message_type in ('order_cancelled', 'abandoned_cart')),
  destination text not null,
  template_name text not null,
  status text not null default 'pending' check (status in ('sent', 'failed', 'pending', 'skipped')),
  reason text,
  response_body text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_whatsapp_message_log_activity_type
  on public.whatsapp_message_log(activity_id, message_type)
  where activity_id is not null;

create index if not exists idx_whatsapp_message_log_customer
  on public.whatsapp_message_log(customer_id, created_at desc);

alter table public.whatsapp_message_log enable row level security;

drop policy if exists "Admins view whatsapp log" on public.whatsapp_message_log;
create policy "Admins view whatsapp log" on public.whatsapp_message_log
for select using (public.is_admin());

drop policy if exists "Service role manages whatsapp log" on public.whatsapp_message_log;
create policy "Service role manages whatsapp log" on public.whatsapp_message_log
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

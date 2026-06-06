-- TruckGuard: tabela de alertas com realtime
create extension if not exists "uuid-ossp";

create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text not null default 'fuel',
  latitude double precision not null,
  longitude double precision not null,
  time text not null,
  confirmations integer not null default 0,
  resolved boolean not null default false,
  location_name text,
  created_at timestamptz not null default now()
);

create index if not exists alerts_resolved_idx on public.alerts (resolved);
create index if not exists alerts_created_at_idx on public.alerts (created_at desc);

alter table public.alerts replica identity full;

alter publication supabase_realtime add table public.alerts;

alter table public.alerts enable row level security;

create policy "alerts_select_anon"
  on public.alerts
  for select
  to anon, authenticated
  using (true);

create policy "alerts_insert_anon"
  on public.alerts
  for insert
  to anon, authenticated
  with check (true);

create policy "alerts_update_anon"
  on public.alerts
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "alerts_delete_anon"
  on public.alerts
  for delete
  to anon, authenticated
  using (true);

-- TruckGuard: voto único por dispositivo e alerta
create table if not exists public.alert_votes (
  id uuid primary key default uuid_generate_v4(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  device_id text not null,
  positive boolean not null,
  created_at timestamptz not null default now(),
  constraint alert_votes_alert_device_unique unique (alert_id, device_id)
);

create index if not exists alert_votes_alert_id_idx
  on public.alert_votes (alert_id);

create index if not exists alert_votes_device_id_idx
  on public.alert_votes (device_id);

alter table public.alert_votes enable row level security;

create policy "alert_votes_select_anon"
  on public.alert_votes
  for select
  to anon, authenticated
  using (true);

create policy "alert_votes_insert_anon"
  on public.alert_votes
  for insert
  to anon, authenticated
  with check (true);

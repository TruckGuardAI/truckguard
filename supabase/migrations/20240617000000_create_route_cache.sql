-- TruckGuard: cache de rotas OpenRoute

create table if not exists public.route_cache (
  id uuid primary key default uuid_generate_v4(),
  origin_key text not null,
  destination_key text not null,
  distance_km numeric not null,
  route_geometry jsonb not null,
  source text not null default 'openroute',
  created_at timestamptz not null default now()
);

create index if not exists idx_route_cache_origin_destination
  on public.route_cache (origin_key, destination_key);

alter table public.route_cache enable row level security;

create policy "route_cache_select_anon"
  on public.route_cache
  for select
  to anon, authenticated
  using (true);

create policy "route_cache_insert_anon"
  on public.route_cache
  for insert
  to anon, authenticated
  with check (true);

create policy "route_cache_update_anon"
  on public.route_cache
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "route_cache_delete_anon"
  on public.route_cache
  for delete
  to anon, authenticated
  using (true);

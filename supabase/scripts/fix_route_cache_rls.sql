-- Corrige RLS em route_cache para permitir insert/update com anon/authenticated.
-- Causa de route_cache vazia: código 42501 (row-level security).

alter table public.route_cache enable row level security;

drop policy if exists "route_cache_select_anon" on public.route_cache;
drop policy if exists "route_cache_insert_anon" on public.route_cache;
drop policy if exists "route_cache_update_anon" on public.route_cache;
drop policy if exists "route_cache_delete_anon" on public.route_cache;

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

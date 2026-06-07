-- Beta fechado: schema alerts, RLS alerts/route_cache, perfis públicos mínimos

-- ---------------------------------------------------------------------------
-- FASE 1: Schema alerts (description, severity, expires_at, time)
-- ---------------------------------------------------------------------------

alter table public.alerts
  add column if not exists description text;

alter table public.alerts
  add column if not exists severity text;

alter table public.alerts
  add column if not exists expires_at timestamptz;

alter table public.alerts
  alter column time drop not null;

alter table public.alerts
  alter column time set default '';

update public.alerts
set
  time = to_char(
    created_at at time zone 'UTC',
    'HH24:MI:SS'
  )
where
  time is null
  or trim(time) = '';

create index if not exists alerts_expires_at_idx
  on public.alerts (expires_at)
  where expires_at is not null;

-- ---------------------------------------------------------------------------
-- FASE 2: RLS alerts
-- ---------------------------------------------------------------------------

alter table public.alerts enable row level security;

drop policy if exists "alerts_select_anon"
  on public.alerts;

drop policy if exists "alerts_insert_anon"
  on public.alerts;

drop policy if exists "alerts_update_anon"
  on public.alerts;

drop policy if exists "alerts_delete_anon"
  on public.alerts;

drop policy if exists "alerts_select_public"
  on public.alerts;

drop policy if exists "alerts_insert_authenticated"
  on public.alerts;

drop policy if exists "alerts_update_creator"
  on public.alerts;

drop policy if exists "alerts_delete_creator"
  on public.alerts;

revoke all on public.alerts
  from anon, authenticated;

grant select on public.alerts
  to anon, authenticated;

grant insert, update, delete on public.alerts
  to authenticated;

create policy "alerts_select_public"
  on public.alerts
  for select
  to anon, authenticated
  using (true);

create policy "alerts_insert_authenticated"
  on public.alerts
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

create policy "alerts_update_creator"
  on public.alerts
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "alerts_delete_creator"
  on public.alerts
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- FASE 3: RLS route_cache
-- ---------------------------------------------------------------------------

alter table public.route_cache enable row level security;

drop policy if exists "route_cache_select_anon"
  on public.route_cache;

drop policy if exists "route_cache_insert_anon"
  on public.route_cache;

drop policy if exists "route_cache_update_anon"
  on public.route_cache;

drop policy if exists "route_cache_delete_anon"
  on public.route_cache;

drop policy if exists "route_cache_select_public"
  on public.route_cache;

drop policy if exists "route_cache_insert_authenticated"
  on public.route_cache;

drop policy if exists "route_cache_update_authenticated"
  on public.route_cache;

drop policy if exists "route_cache_delete_authenticated"
  on public.route_cache;

revoke all on public.route_cache
  from anon, authenticated;

grant select on public.route_cache
  to anon, authenticated;

grant insert, update, delete on public.route_cache
  to authenticated;

create policy "route_cache_select_public"
  on public.route_cache
  for select
  to anon, authenticated
  using (true);

create policy "route_cache_insert_authenticated"
  on public.route_cache
  for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "route_cache_update_authenticated"
  on public.route_cache
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "route_cache_delete_authenticated"
  on public.route_cache
  for delete
  to authenticated
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- FASE 5: Perfis públicos mínimos (id, full_name, avatar_url)
-- ---------------------------------------------------------------------------

create or replace function public.get_public_profile_snippets(
  p_user_ids uuid[]
)
returns table (
  id uuid,
  full_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.full_name,
    p.avatar_url
  from public.profiles p
  where
    p.id = any(p_user_ids);
$$;

revoke all on function public.get_public_profile_snippets(uuid[])
  from public;

grant execute on function public.get_public_profile_snippets(uuid[])
  to anon, authenticated;

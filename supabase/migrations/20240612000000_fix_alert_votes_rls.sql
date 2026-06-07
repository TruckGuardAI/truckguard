-- Corrigir RLS de alert_votes para votos por utilizador autenticado.
-- Idempotente: remove políticas antigas e recria as corretas.

alter table public.alert_votes
  enable row level security;

-- Políticas legadas (device_id / anon)
drop policy if exists "alert_votes_select_anon"
  on public.alert_votes;

drop policy if exists "alert_votes_insert_anon"
  on public.alert_votes;

-- Políticas anteriores (user_id)
drop policy if exists "alert_votes_select_authenticated"
  on public.alert_votes;

drop policy if exists "alert_votes_insert_own"
  on public.alert_votes;

drop policy if exists "alert_votes_update_own"
  on public.alert_votes;

drop policy if exists "alert_votes_delete_own"
  on public.alert_votes;

-- Políticas alvo (nomes explícitos)
drop policy if exists "Users can read votes"
  on public.alert_votes;

drop policy if exists "Users can insert own votes"
  on public.alert_votes;

drop policy if exists "Users can update own votes"
  on public.alert_votes;

drop policy if exists "Users can delete own votes"
  on public.alert_votes;

grant select, insert, update, delete
  on public.alert_votes
  to authenticated;

create policy "Users can read votes"
  on public.alert_votes
  for select
  to authenticated
  using (true);

create policy "Users can insert own votes"
  on public.alert_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own votes"
  on public.alert_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own votes"
  on public.alert_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

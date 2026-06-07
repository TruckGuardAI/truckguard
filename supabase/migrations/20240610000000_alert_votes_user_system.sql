-- TruckGuard: votos por utilizador autenticado
drop policy if exists "alert_votes_select_anon"
  on public.alert_votes;

drop policy if exists "alert_votes_insert_anon"
  on public.alert_votes;

drop table if exists public.alert_votes;

create table public.alert_votes (
  id uuid primary key default uuid_generate_v4(),
  alert_id uuid not null
    references public.alerts (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  vote_type text not null
    check (vote_type in ('confirm', 'reject')),
  created_at timestamptz not null default now(),
  constraint alert_votes_alert_user_unique
    unique (alert_id, user_id)
);

create index alert_votes_alert_id_idx
  on public.alert_votes (alert_id);

create index alert_votes_user_id_idx
  on public.alert_votes (user_id);

alter table public.alerts
  add column if not exists total_confirmations
    integer not null default 0;

alter table public.alerts
  add column if not exists total_rejections
    integer not null default 0;

update public.alerts
set
  total_confirmations = confirmations
where
  total_confirmations = 0
  and confirmations > 0;

create or replace function public.sync_alert_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_alert_id uuid;
begin
  target_alert_id := coalesce(
    new.alert_id,
    old.alert_id
  );

  update public.alerts
  set
    total_confirmations = (
      select count(*)
      from public.alert_votes
      where alert_id = target_alert_id
        and vote_type = 'confirm'
    ),
    total_rejections = (
      select count(*)
      from public.alert_votes
      where alert_id = target_alert_id
        and vote_type = 'reject'
    ),
    confirmations = (
      select count(*)
      from public.alert_votes
      where alert_id = target_alert_id
        and vote_type = 'confirm'
    )
  where id = target_alert_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists alert_votes_sync_counts
  on public.alert_votes;

create trigger alert_votes_sync_counts
after insert or update or delete
on public.alert_votes
for each row
execute function public.sync_alert_vote_counts();

alter table public.alert_votes
  enable row level security;

create policy "alert_votes_select_authenticated"
  on public.alert_votes
  for select
  to authenticated
  using (true);

create policy "alert_votes_insert_own"
  on public.alert_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "alert_votes_update_own"
  on public.alert_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "alert_votes_delete_own"
  on public.alert_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Sincronizar contagens de votos em alerts quando alert_votes muda.

alter table public.alerts
  add column if not exists total_confirmations
    integer not null default 0;

alter table public.alerts
  add column if not exists total_rejections
    integer not null default 0;

create or replace function public.update_alert_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_alert_id uuid;
  confirm_count integer;
  reject_count integer;
begin
  target_alert_id := coalesce(
    new.alert_id,
    old.alert_id
  );

  select
    count(*) filter (
      where vote_type = 'confirm'
    ),
    count(*) filter (
      where vote_type = 'reject'
    )
  into
    confirm_count,
    reject_count
  from public.alert_votes
  where alert_id = target_alert_id;

  update public.alerts
  set
    total_confirmations = confirm_count,
    total_rejections = reject_count,
    confirmations = confirm_count
  where id = target_alert_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists alert_votes_sync_counts
  on public.alert_votes;

drop trigger if exists alert_votes_update_counts
  on public.alert_votes;

create trigger alert_votes_update_counts
after insert or update or delete
on public.alert_votes
for each row
execute function public.update_alert_vote_counts();

-- Recalcular contagens para alertas com votos existentes.
update public.alerts as alerts
set
  total_confirmations = counts.confirm_count,
  total_rejections = counts.reject_count,
  confirmations = counts.confirm_count
from (
  select
    alert_id,
    count(*) filter (
      where vote_type = 'confirm'
    ) as confirm_count,
    count(*) filter (
      where vote_type = 'reject'
    ) as reject_count
  from public.alert_votes
  group by alert_id
) as counts
where alerts.id = counts.alert_id;

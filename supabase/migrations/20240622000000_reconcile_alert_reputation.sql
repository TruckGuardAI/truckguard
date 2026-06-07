-- Reputação idempotente derivada de votos (reconcile por alerta)

-- ---------------------------------------------------------------------------
-- Ledger: contribuição aplicada por alerta/utilizador
-- ---------------------------------------------------------------------------

create table if not exists public.alert_reputation_applied (
  alert_id uuid not null
    references public.alerts (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  reputation_score integer not null default 0,
  alerts_confirmed integer not null default 0,
  alerts_rejected integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (alert_id, user_id),
  constraint alert_reputation_applied_confirmed_nonneg
    check (alerts_confirmed >= 0),
  constraint alert_reputation_applied_rejected_nonneg
    check (alerts_rejected >= 0)
);

create index if not exists alert_reputation_applied_user_id_idx
  on public.alert_reputation_applied (user_id);

-- ---------------------------------------------------------------------------
-- Calcular contribuições esperadas a partir do estado atual de alert_votes
-- ---------------------------------------------------------------------------

create or replace function public.compute_alert_vote_contributions(
  p_alert_id uuid
)
returns table (
  user_id uuid,
  reputation_score integer,
  alerts_confirmed integer,
  alerts_rejected integer
)
language sql
stable
set search_path = public
as $$
  with alert_ctx as (
    select
      a.id,
      a.user_id as creator_id
    from public.alerts a
    where a.id = p_alert_id
  ),
  vote_totals as (
    select
      count(*) filter (
        where av.vote_type = 'confirm'
      ) as total_confirm,
      count(*) filter (
        where av.vote_type = 'reject'
      ) as total_reject,
      count(*) filter (
        where
          av.vote_type = 'confirm'
          and av.user_id is distinct from ac.creator_id
      ) as confirm_non_creator
    from public.alert_votes av
    cross join alert_ctx ac
    where av.alert_id = p_alert_id
  ),
  ctx as (
    select
      ac.creator_id,
      vt.total_confirm,
      vt.total_reject,
      vt.confirm_non_creator,
      (vt.total_reject > vt.total_confirm) as majority_reject
    from alert_ctx ac
    cross join vote_totals vt
  )
  select
    ctx.creator_id as user_id,
    (
      ctx.confirm_non_creator * 10
      - case
        when ctx.majority_reject then 5
        else 0
      end
    )::integer as reputation_score,
    ctx.confirm_non_creator::integer as alerts_confirmed,
    (
      case
        when ctx.majority_reject then 1
        else 0
      end
    )::integer as alerts_rejected
  from ctx
  where ctx.creator_id is not null

  union all

  select
    av.user_id,
    (
      case
        when av.vote_type = 'confirm' then 2
        when
          av.vote_type = 'reject'
          and ctx.majority_reject
        then 2
        else 0
      end
    )::integer as reputation_score,
    0 as alerts_confirmed,
    0 as alerts_rejected
  from public.alert_votes av
  cross join ctx
  where
    av.alert_id = p_alert_id
    and (
      ctx.creator_id is null
      or av.user_id is distinct from ctx.creator_id
    );
$$;

-- ---------------------------------------------------------------------------
-- Recalcular user_reputation (parte votos) a partir do ledger
-- ---------------------------------------------------------------------------

create or replace function public.refresh_user_vote_reputation(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmed integer;
  v_rejected integer;
  v_score integer;
  v_created integer;
begin
  if p_user_id is null then
    return;
  end if;

  select
    coalesce(
      sum(ara.alerts_confirmed),
      0
    ),
    coalesce(
      sum(ara.alerts_rejected),
      0
    ),
    coalesce(
      sum(ara.reputation_score),
      0
    )
  into
    v_confirmed,
    v_rejected,
    v_score
  from public.alert_reputation_applied ara
  where ara.user_id = p_user_id;

  select
    count(*)::integer
  into v_created
  from public.alerts a
  where a.user_id = p_user_id;

  v_confirmed := greatest(0, v_confirmed);
  v_rejected := greatest(0, v_rejected);
  v_score := greatest(0, v_score);
  v_created := greatest(0, v_created);

  insert into public.user_reputation (
    user_id,
    alerts_created,
    alerts_confirmed,
    alerts_rejected,
    reputation_score
  )
  values (
    p_user_id,
    v_created,
    v_confirmed,
    v_rejected,
    v_score
  )
  on conflict (user_id) do update
  set
    alerts_created = v_created,
    alerts_confirmed = v_confirmed,
    alerts_rejected = v_rejected,
    reputation_score = v_score,
    updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Reconciliar reputação de um alerta (idempotente)
-- ---------------------------------------------------------------------------

create or replace function public.reconcile_alert_reputation(
  p_alert_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_user uuid;
  affected_users uuid[];
  v_confirm_count integer;
  v_reject_count integer;
  v_majority_reject boolean;
  v_row_count integer;
begin
  if p_alert_id is null then
    return;
  end if;

  select
    count(*) filter (
      where vote_type = 'confirm'
    ),
    count(*) filter (
      where vote_type = 'reject'
    )
  into
    v_confirm_count,
    v_reject_count
  from public.alert_votes
  where alert_id = p_alert_id;

  v_majority_reject :=
    v_reject_count > v_confirm_count;

  select
    array_agg(distinct sources.user_id)
  into affected_users
  from (
    select ara.user_id
    from public.alert_reputation_applied ara
    where ara.alert_id = p_alert_id

    union

    select c.user_id
    from public.compute_alert_vote_contributions(
      p_alert_id
    ) as c
  ) as sources;

  delete from public.alert_reputation_applied
  where alert_id = p_alert_id;

  insert into public.alert_reputation_applied (
    alert_id,
    user_id,
    reputation_score,
    alerts_confirmed,
    alerts_rejected
  )
  select
    p_alert_id,
    c.user_id,
    c.reputation_score,
    greatest(0, c.alerts_confirmed),
    greatest(0, c.alerts_rejected)
  from public.compute_alert_vote_contributions(
    p_alert_id
  ) as c
  where
    c.reputation_score <> 0
    or c.alerts_confirmed <> 0
    or c.alerts_rejected <> 0;

  get diagnostics v_row_count = row_count;

  if affected_users is not null then
    foreach affected_user in
      array affected_users
    loop
      perform public.refresh_user_vote_reputation(
        affected_user
      );
    end loop;
  end if;

  raise log
    'LOG_REPUTATION_RECALCULATED alert_id=% confirms=% rejects=% majority_reject=% ledger_rows=%',
    p_alert_id,
    v_confirm_count,
    v_reject_count,
    v_majority_reject,
    v_row_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: INSERT / UPDATE / DELETE em alert_votes
-- ---------------------------------------------------------------------------

create or replace function public.reputation_on_alert_vote_change()
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

  if tg_op = 'INSERT' then
    raise log
      'LOG_REPUTATION_VOTE_INSERT alert_id=% user_id=% vote_type=%',
      new.alert_id,
      new.user_id,
      new.vote_type;

    perform public.reconcile_alert_reputation(
      new.alert_id
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    raise log
      'LOG_REPUTATION_VOTE_UPDATE alert_id=% user_id=% old_vote_type=% new_vote_type=%',
      new.alert_id,
      new.user_id,
      old.vote_type,
      new.vote_type;

    perform public.reconcile_alert_reputation(
      new.alert_id
    );

    return new;
  end if;

  raise log
    'LOG_REPUTATION_VOTE_DELETE alert_id=% user_id=% vote_type=%',
    old.alert_id,
    old.user_id,
    old.vote_type;

  perform public.reconcile_alert_reputation(
    old.alert_id
  );

  return old;
end;
$$;

drop trigger if exists alert_votes_reputation
  on public.alert_votes;

create trigger alert_votes_reputation
  after insert or update or delete
  on public.alert_votes
  for each row
  execute function public.reputation_on_alert_vote_change();

-- ---------------------------------------------------------------------------
-- Backfill global a partir do estado atual
-- ---------------------------------------------------------------------------

create or replace function public.rebuild_all_reputations()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  alert_row record;
  user_row record;
begin
  truncate table public.alert_reputation_applied;

  update public.user_reputation
  set
    alerts_confirmed = 0,
    alerts_rejected = 0,
    reputation_score = 0,
    updated_at = now();

  for alert_row in
    select distinct av.alert_id
    from public.alert_votes av
  loop
    perform public.reconcile_alert_reputation(
      alert_row.alert_id
    );
  end loop;

  for user_row in
    select distinct sources.user_id
    from (
      select ur.user_id
      from public.user_reputation ur

      union

      select a.user_id
      from public.alerts a
      where a.user_id is not null

      union

      select av.user_id
      from public.alert_votes av
    ) as sources
    where sources.user_id is not null
  loop
    perform public.refresh_user_vote_reputation(
      user_row.user_id
    );
  end loop;

  raise log
    'LOG_REPUTATION_RECALCULATED scope=rebuild_all_reputations';
end;
$$;

drop function if exists public.reputation_on_alert_vote();

revoke all on function public.rebuild_all_reputations()
  from public;

grant execute on function public.rebuild_all_reputations()
  to service_role;

-- Corrigir dados existentes na instalação da migration
select public.rebuild_all_reputations();

-- Sistema de reputação do utilizador (TruXafe)
-- Tabela, índices, RLS, triggers e backfill de dados históricos.

-- ---------------------------------------------------------------------------
-- Colunas auxiliares em alerts
-- ---------------------------------------------------------------------------

alter table public.alerts
  add column if not exists user_id uuid
    references auth.users (id) on delete set null;

alter table public.alerts
  add column if not exists reputation_rejected_penalized
    boolean not null default false;

create index if not exists alerts_user_id_idx
  on public.alerts (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Tabela user_reputation
-- ---------------------------------------------------------------------------

create table if not exists public.user_reputation (
  user_id uuid primary key
    references auth.users (id) on delete cascade,
  alerts_created integer not null default 0,
  alerts_confirmed integer not null default 0,
  alerts_rejected integer not null default 0,
  reputation_score integer not null default 0,
  trust_level text not null default 'novo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reputation_alerts_created_nonneg
    check (alerts_created >= 0),
  constraint user_reputation_alerts_confirmed_nonneg
    check (alerts_confirmed >= 0),
  constraint user_reputation_alerts_rejected_nonneg
    check (alerts_rejected >= 0),
  constraint user_reputation_score_nonneg
    check (reputation_score >= 0),
  constraint user_reputation_trust_level_valid
    check (
      trust_level in (
        'novo',
        'confiavel',
        'experiente',
        'elite'
      )
    )
);

create index if not exists user_reputation_trust_level_idx
  on public.user_reputation (trust_level);

create index if not exists user_reputation_score_idx
  on public.user_reputation (reputation_score desc);

create index if not exists user_reputation_updated_at_idx
  on public.user_reputation (updated_at desc);

-- ---------------------------------------------------------------------------
-- Funções
-- ---------------------------------------------------------------------------

create or replace function public.resolve_trust_level(
  score integer
)
returns text
language sql
immutable
as $$
  select case
    when score >= 700 then 'elite'
    when score >= 300 then 'experiente'
    when score >= 100 then 'confiavel'
    else 'novo'
  end;
$$;

create or replace function public.user_reputation_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.trust_level = public.resolve_trust_level(
    new.reputation_score
  );
  return new;
end;
$$;

drop trigger if exists user_reputation_set_updated_at
  on public.user_reputation;

create trigger user_reputation_set_updated_at
  before insert or update on public.user_reputation
  for each row
  execute function public.user_reputation_set_updated_at();

create or replace function public.apply_reputation_delta(
  target_user_id uuid,
  score_delta integer default 0,
  alerts_created_delta integer default 0,
  alerts_confirmed_delta integer default 0,
  alerts_rejected_delta integer default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    return;
  end if;

  insert into public.user_reputation (
    user_id,
    alerts_created,
    alerts_confirmed,
    alerts_rejected,
    reputation_score
  )
  values (
    target_user_id,
    greatest(0, alerts_created_delta),
    greatest(0, alerts_confirmed_delta),
    greatest(0, alerts_rejected_delta),
    greatest(0, score_delta)
  )
  on conflict (user_id) do update
  set
    alerts_created =
      public.user_reputation.alerts_created
      + alerts_created_delta,
    alerts_confirmed =
      public.user_reputation.alerts_confirmed
      + alerts_confirmed_delta,
    alerts_rejected =
      public.user_reputation.alerts_rejected
      + alerts_rejected_delta,
    reputation_score = greatest(
      0,
      public.user_reputation.reputation_score
      + score_delta
    ),
    updated_at = now();
end;
$$;

create or replace function public.reputation_on_alert_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    perform public.apply_reputation_delta(
      new.user_id,
      alerts_created_delta => 1
    );
  end if;

  return new;
end;
$$;

drop trigger if exists alerts_reputation_on_create
  on public.alerts;

create trigger alerts_reputation_on_create
  after insert on public.alerts
  for each row
  execute function public.reputation_on_alert_created();

create or replace function public.reputation_on_alert_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_id uuid;
  confirm_count integer;
  reject_count integer;
  penalized boolean;
begin
  if tg_op <> 'INSERT' then
    return coalesce(new, old);
  end if;

  select
    user_id,
    reputation_rejected_penalized
  into
    creator_id,
    penalized
  from public.alerts
  where id = new.alert_id;

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
  where alert_id = new.alert_id;

  if new.vote_type = 'confirm' then
    if
      creator_id is not null
      and new.user_id <> creator_id
    then
      perform public.apply_reputation_delta(
        creator_id,
        score_delta => 10,
        alerts_confirmed_delta => 1
      );

      perform public.apply_reputation_delta(
        new.user_id,
        score_delta => 2
      );
    end if;
  elsif new.vote_type = 'reject' then
    if reject_count > confirm_count then
      perform public.apply_reputation_delta(
        new.user_id,
        score_delta => 2
      );

      if
        creator_id is not null
        and not coalesce(penalized, false)
      then
        perform public.apply_reputation_delta(
          creator_id,
          score_delta => -5,
          alerts_rejected_delta => 1
        );

        update public.alerts
        set reputation_rejected_penalized = true
        where id = new.alert_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists alert_votes_reputation
  on public.alert_votes;

create trigger alert_votes_reputation
  after insert on public.alert_votes
  for each row
  execute function public.reputation_on_alert_vote();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.user_reputation enable row level security;

drop policy if exists "user_reputation_select_own"
  on public.user_reputation;

drop policy if exists "user_reputation_select_authenticated"
  on public.user_reputation;

create policy "user_reputation_select_authenticated"
  on public.user_reputation
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Backfill de reputação a partir de dados existentes
-- ---------------------------------------------------------------------------

update public.alerts
set reputation_rejected_penalized = true
where
  user_id is not null
  and total_rejections > total_confirmations
  and not reputation_rejected_penalized;

insert into public.user_reputation (
  user_id,
  alerts_created,
  alerts_confirmed,
  alerts_rejected,
  reputation_score
)
select
  stats.user_id,
  stats.alerts_created,
  stats.alerts_confirmed,
  stats.alerts_rejected,
  greatest(
    0,
    (stats.alerts_confirmed * 10)
    + (stats.voter_confirm_points * 2)
    + (stats.voter_reject_points * 2)
    - (stats.alerts_rejected * 5)
  ) as reputation_score
from (
  select
    users.user_id,
    coalesce(created.alerts_created, 0) as alerts_created,
    coalesce(confirmed.alerts_confirmed, 0) as alerts_confirmed,
    coalesce(rejected.alerts_rejected, 0) as alerts_rejected,
    coalesce(voter_confirm.voter_confirm_points, 0) as voter_confirm_points,
    coalesce(voter_reject.voter_reject_points, 0) as voter_reject_points
  from (
    select user_id
    from public.alerts
    where user_id is not null

    union

    select user_id
    from public.alert_votes
  ) as users
  left join (
    select
      user_id,
      count(*)::integer as alerts_created
    from public.alerts
    where user_id is not null
    group by user_id
  ) as created
    on created.user_id = users.user_id
  left join (
    select
      a.user_id,
      count(*)::integer as alerts_confirmed
    from public.alert_votes av
    inner join public.alerts a
      on a.id = av.alert_id
    where
      av.vote_type = 'confirm'
      and a.user_id is not null
      and av.user_id <> a.user_id
    group by a.user_id
  ) as confirmed
    on confirmed.user_id = users.user_id
  left join (
    select
      a.user_id,
      count(*)::integer as alerts_rejected
    from public.alerts a
    where
      a.user_id is not null
      and a.total_rejections > a.total_confirmations
    group by a.user_id
  ) as rejected
    on rejected.user_id = users.user_id
  left join (
    select
      av.user_id,
      count(*)::integer as voter_confirm_points
    from public.alert_votes av
    inner join public.alerts a
      on a.id = av.alert_id
    where
      av.vote_type = 'confirm'
      and a.user_id is not null
      and av.user_id <> a.user_id
    group by av.user_id
  ) as voter_confirm
    on voter_confirm.user_id = users.user_id
  left join (
    select
      av.user_id,
      count(*)::integer as voter_reject_points
    from public.alert_votes av
    inner join public.alerts a
      on a.id = av.alert_id
    where
      av.vote_type = 'reject'
      and a.total_rejections > a.total_confirmations
    group by av.user_id
  ) as voter_reject
    on voter_reject.user_id = users.user_id
) as stats
where stats.user_id is not null
on conflict (user_id) do update
set
  alerts_created = excluded.alerts_created,
  alerts_confirmed = excluded.alerts_confirmed,
  alerts_rejected = excluded.alerts_rejected,
  reputation_score = excluded.reputation_score,
  updated_at = now();

-- trust_level é recalculado pelo trigger before update

-- Testes SQL: reconcile_alert_reputation (cenários 1–5)
-- Executar com service_role / SQL Editor (requer auth.users reais ou substituir UUIDs).
--
-- Uso:
--   1. Substituir :creator_id, :voter_a, :voter_b pelos UUIDs de teste.
--   2. Executar bloco a bloco ou o ficheiro completo.
--   3. Verificar mensagens NOTICE e resultados finais em user_reputation.

-- ---------------------------------------------------------------------------
-- Helpers de teste
-- ---------------------------------------------------------------------------

create or replace function public._test_reputation_snapshot(
  p_user_id uuid
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
  select
    ur.user_id,
    ur.reputation_score,
    ur.alerts_confirmed,
    ur.alerts_rejected
  from public.user_reputation ur
  where ur.user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Cenário 1: confirm
-- Esperado: criador +10 / +1 confirmed; votante +2
-- ---------------------------------------------------------------------------

/*
-- Setup (ajustar UUIDs)
insert into public.alerts (title, type, latitude, longitude, time, user_id)
values ('Test rep 1', 'fuel', 38.7, -9.1, '12:00', :creator_id)
returning id; -- guardar como :alert_id

insert into public.alert_votes (alert_id, user_id, vote_type)
values (:alert_id, :voter_a, 'confirm');

select * from public._test_reputation_snapshot(:creator_id);
-- reputation_score = 10, alerts_confirmed = 1

select * from public._test_reputation_snapshot(:voter_a);
-- reputation_score = 2, alerts_confirmed = 0
*/

-- ---------------------------------------------------------------------------
-- Cenário 2: confirm → reject (UPDATE)
-- Esperado após reject com maioria: criador score 0 se só 1 votante;
--   alerts_confirmed 0, alerts_rejected 1; votante +2
-- ---------------------------------------------------------------------------

/*
insert into public.alert_votes (alert_id, user_id, vote_type)
values (:alert_id, :voter_a, 'confirm');

update public.alert_votes
set vote_type = 'reject'
where alert_id = :alert_id
  and user_id = :voter_a;

select * from public._test_reputation_snapshot(:creator_id);
-- reputation_score = 0 (10 - 5 penalização maioria), alerts_confirmed = 0, alerts_rejected = 1

select * from public._test_reputation_snapshot(:voter_a);
-- reputation_score = 2
*/

-- ---------------------------------------------------------------------------
-- Cenário 3: confirm → reject → confirm (UPDATE × 2)
-- Esperado: igual ao cenário 1 (criador 10/1, votante 2)
-- ---------------------------------------------------------------------------

/*
update public.alert_votes
set vote_type = 'confirm'
where alert_id = :alert_id
  and user_id = :voter_a;

select * from public._test_reputation_snapshot(:creator_id);
-- reputation_score = 10, alerts_confirmed = 1, alerts_rejected = 0

select * from public._test_reputation_snapshot(:voter_a);
-- reputation_score = 2
*/

-- ---------------------------------------------------------------------------
-- Cenário 4: delete voto
-- Esperado: criador e votante voltam a 0 nos campos derivados de votos
-- ---------------------------------------------------------------------------

/*
delete from public.alert_votes
where alert_id = :alert_id
  and user_id = :voter_a;

select * from public._test_reputation_snapshot(:creator_id);
-- reputation_score = 0, alerts_confirmed = 0, alerts_rejected = 0

select * from public._test_reputation_snapshot(:voter_a);
-- reputation_score = 0
*/

-- ---------------------------------------------------------------------------
-- Cenário 5: vários votantes
-- 2 confirms (B,C) + 1 reject (D) → maioria confirm
-- Esperado criador: 20 score, 2 confirmed, 0 rejected
-- Votantes B,C: +2 cada; D: 0 (reject sem maioria)
-- ---------------------------------------------------------------------------

/*
insert into public.alerts (title, type, latitude, longitude, time, user_id)
values ('Test rep 5', 'fuel', 38.8, -9.2, '12:00', :creator_id)
returning id; -- :alert_id_5

insert into public.alert_votes (alert_id, user_id, vote_type) values
  (:alert_id_5, :voter_a, 'confirm'),
  (:alert_id_5, :voter_b, 'confirm'),
  (:alert_id_5, :voter_c, 'reject');

select * from public._test_reputation_snapshot(:creator_id);
-- reputation_score = 20, alerts_confirmed = 2, alerts_rejected = 0

select * from public._test_reputation_snapshot(:voter_a);
-- reputation_score = 2

select * from public._test_reputation_snapshot(:voter_b);
-- reputation_score = 2

select * from public._test_reputation_snapshot(:voter_c);
-- reputation_score = 0

-- Maioria reject: adicionar mais 1 reject
insert into public.alert_votes (alert_id, user_id, vote_type)
values (:alert_id_5, :voter_d, 'reject');

select * from public._test_reputation_snapshot(:creator_id);
-- reputation_score = 15 (20 - 5), alerts_confirmed = 2, alerts_rejected = 1

select * from public._test_reputation_snapshot(:voter_c);
-- reputation_score = 2

select * from public._test_reputation_snapshot(:voter_d);
-- reputation_score = 2
*/

-- ---------------------------------------------------------------------------
-- Verificação idempotente: chamar reconcile 2× deve manter valores
-- ---------------------------------------------------------------------------

/*
select public.reconcile_alert_reputation(:alert_id_5);
select public.reconcile_alert_reputation(:alert_id_5);

select * from public.alert_reputation_applied
where alert_id = :alert_id_5
order by user_id;

select * from public._test_reputation_snapshot(:creator_id);
*/

-- ---------------------------------------------------------------------------
-- Rebuild global
-- ---------------------------------------------------------------------------

-- select public.rebuild_all_reputations();

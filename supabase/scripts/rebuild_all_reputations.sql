-- Recalcula user_reputation a partir do estado atual de alert_votes.
-- Executar no SQL Editor com permissões elevadas (service_role).

select public.rebuild_all_reputations();

-- Verificação rápida
select
  user_id,
  alerts_created,
  alerts_confirmed,
  alerts_rejected,
  reputation_score,
  trust_level
from public.user_reputation
order by reputation_score desc
limit 50;

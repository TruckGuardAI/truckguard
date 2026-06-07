-- Alertas críticos: prioridade, som, localização de utilizadores, nearby RPC

alter table public.alerts
  add column if not exists notification_priority text;

alter table public.alerts
  add column if not exists notification_sound text;

alter table public.profiles
  add column if not exists last_latitude double precision;

alter table public.profiles
  add column if not exists last_longitude double precision;

alter table public.profiles
  add column if not exists last_location_at timestamptz;

create index if not exists profiles_last_location_idx
  on public.profiles (last_location_at)
  where last_latitude is not null
    and last_longitude is not null;

create or replace function public.get_nearby_users(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision,
  p_exclude_user_id uuid default null
)
returns table (
  user_id uuid,
  distance_km double precision
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as user_id,
    (
      6371 * acos(
        least(
          1.0,
          greatest(
            -1.0,
            cos(radians(p_latitude))
              * cos(radians(p.last_latitude))
              * cos(
                radians(p.last_longitude)
                - radians(p_longitude)
              )
              + sin(radians(p_latitude))
              * sin(radians(p.last_latitude))
          )
        )
      )
    ) as distance_km
  from public.profiles p
  left join public.profile_settings ps
    on ps.user_id = p.id
  where p.last_latitude is not null
    and p.last_longitude is not null
    and p.last_location_at is not null
    and p.last_location_at >= now() - interval '24 hours'
    and p.push_token is not null
    and coalesce(ps.notifications_enabled, true) = true
    and coalesce(ps.community_alerts_enabled, true) = true
    and (
      p_exclude_user_id is null
      or p.id <> p_exclude_user_id
    )
    and (
      6371 * acos(
        least(
          1.0,
          greatest(
            -1.0,
            cos(radians(p_latitude))
              * cos(radians(p.last_latitude))
              * cos(
                radians(p.last_longitude)
                - radians(p_longitude)
              )
              + sin(radians(p_latitude))
              * sin(radians(p.last_latitude))
          )
        )
      )
    ) <= p_radius_km
  order by distance_km asc;
$$;

revoke all on function public.get_nearby_users(
  double precision,
  double precision,
  double precision,
  uuid
) from public;

grant execute on function public.get_nearby_users(
  double precision,
  double precision,
  double precision,
  uuid
) to authenticated;

grant execute on function public.get_nearby_users(
  double precision,
  double precision,
  double precision,
  uuid
) to service_role;

create or replace function public.get_nearby_users_with_tokens(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision,
  p_exclude_user_id uuid default null
)
returns table (
  user_id uuid,
  push_token text,
  distance_km double precision
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as user_id,
    p.push_token,
    (
      6371 * acos(
        least(
          1.0,
          greatest(
            -1.0,
            cos(radians(p_latitude))
              * cos(radians(p.last_latitude))
              * cos(
                radians(p.last_longitude)
                - radians(p_longitude)
              )
              + sin(radians(p_latitude))
              * sin(radians(p.last_latitude))
          )
        )
      )
    ) as distance_km
  from public.profiles p
  left join public.profile_settings ps
    on ps.user_id = p.id
  where p.last_latitude is not null
    and p.last_longitude is not null
    and p.last_location_at is not null
    and p.last_location_at >= now() - interval '24 hours'
    and p.push_token is not null
    and coalesce(ps.notifications_enabled, true) = true
    and coalesce(ps.community_alerts_enabled, true) = true
    and (
      p_exclude_user_id is null
      or p.id <> p_exclude_user_id
    )
    and (
      6371 * acos(
        least(
          1.0,
          greatest(
            -1.0,
            cos(radians(p_latitude))
              * cos(radians(p.last_latitude))
              * cos(
                radians(p.last_longitude)
                - radians(p_longitude)
              )
              + sin(radians(p_latitude))
              * sin(radians(p.last_latitude))
          )
        )
      )
    ) <= p_radius_km
  order by distance_km asc;
$$;

revoke all on function public.get_nearby_users_with_tokens(
  double precision,
  double precision,
  double precision,
  uuid
) from public;

grant execute on function public.get_nearby_users_with_tokens(
  double precision,
  double precision,
  double precision,
  uuid
) to service_role;

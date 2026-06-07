alter table public.profile_settings
  add column if not exists community_alerts_enabled boolean not null default true;

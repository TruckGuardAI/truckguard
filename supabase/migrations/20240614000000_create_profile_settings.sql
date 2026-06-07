-- Preferências por utilizador (notificações, etc.)

create table if not exists public.profile_settings (
  user_id uuid primary key
    references auth.users (id) on delete cascade,
  notifications_enabled boolean not null default true,
  community_alerts_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.profile_settings_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profile_settings_set_updated_at
  on public.profile_settings;

create trigger profile_settings_set_updated_at
  before update on public.profile_settings
  for each row
  execute function public.profile_settings_set_updated_at();

alter table public.profile_settings enable row level security;

drop policy if exists "profile_settings_select_own"
  on public.profile_settings;

drop policy if exists "profile_settings_insert_own"
  on public.profile_settings;

drop policy if exists "profile_settings_update_own"
  on public.profile_settings;

create policy "profile_settings_select_own"
  on public.profile_settings
  for select
  using (auth.uid() = user_id);

create policy "profile_settings_insert_own"
  on public.profile_settings
  for insert
  with check (auth.uid() = user_id);

create policy "profile_settings_update_own"
  on public.profile_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- TruckGuard: comentários em alertas

create table if not exists public.alert_comments (
  id uuid primary key default uuid_generate_v4(),
  alert_id uuid not null
    references public.alerts (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now(),
  constraint alert_comments_comment_not_empty
    check (char_length(trim(comment)) > 0),
  constraint alert_comments_comment_max_length
    check (char_length(comment) <= 500)
);

create index if not exists alert_comments_alert_id_idx
  on public.alert_comments (alert_id);

create index if not exists alert_comments_user_id_idx
  on public.alert_comments (user_id);

create index if not exists alert_comments_alert_created_idx
  on public.alert_comments (alert_id, created_at asc);

alter table public.alert_comments
  enable row level security;

drop policy if exists "alert_comments_select_public"
  on public.alert_comments;

drop policy if exists "alert_comments_insert_own"
  on public.alert_comments;

drop policy if exists "alert_comments_update_own"
  on public.alert_comments;

drop policy if exists "alert_comments_delete_own"
  on public.alert_comments;

create policy "alert_comments_select_public"
  on public.alert_comments
  for select
  to anon, authenticated
  using (true);

create policy "alert_comments_insert_own"
  on public.alert_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "alert_comments_update_own"
  on public.alert_comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "alert_comments_delete_own"
  on public.alert_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select
  on public.alert_comments
  to anon, authenticated;

grant insert, update, delete
  on public.alert_comments
  to authenticated;

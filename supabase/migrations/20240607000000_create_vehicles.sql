-- TruckGuard: veículos do utilizador
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  marca text not null,
  modelo text not null,
  matricula text not null,
  tipo_veiculo text not null,
  tipo_carga text,
  comprimento numeric(10, 2),
  altura numeric(10, 2),
  peso_maximo numeric(10, 2),
  created_at timestamptz not null default now(),
  constraint vehicles_user_id_unique unique (user_id)
);

create index if not exists vehicles_user_id_idx
  on public.vehicles (user_id);

create index if not exists vehicles_matricula_idx
  on public.vehicles (matricula);

alter table public.vehicles enable row level security;

create policy "vehicles_select_own"
  on public.vehicles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "vehicles_insert_own"
  on public.vehicles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "vehicles_update_own"
  on public.vehicles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "vehicles_delete_own"
  on public.vehicles
  for delete
  to authenticated
  using (auth.uid() = user_id);

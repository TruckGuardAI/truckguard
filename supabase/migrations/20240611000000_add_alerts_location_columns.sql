-- Normalização de localização dos alertas
alter table public.alerts
add column if not exists location_text text;

alter table public.alerts
add column if not exists city text;

alter table public.alerts
add column if not exists region text;

alter table public.alerts
add column if not exists country text;

create index if not exists alerts_country_idx
  on public.alerts (country);

create index if not exists alerts_city_idx
  on public.alerts (city);

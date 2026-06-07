-- Script opcional: preencher city/country/location_text/region
-- a partir de description em alertas antigos.
-- Executar APÓS 20240611000000_add_alerts_location_columns.sql
--
-- Heurística:
--   4+ segmentos → location_text, city, region, country
--   3 segmentos  → location_text, city, country
--   2 segmentos  → location_text/city, country
--   1 segmento   → location_text/city, country desconhecido
-- Ignora descriptions que parecem coordenadas (ex: "41.1579, -8.6291").

with parsed as (
  select
    id,
    description,
    cardinality(
      regexp_split_to_array(
        btrim(description),
        '\s*,\s*'
      )
    ) as part_count,
    regexp_split_to_array(
      btrim(description),
      '\s*,\s*'
    ) as parts
  from public.alerts
  where description is not null
    and btrim(description) <> ''
    and description !~ '^-?[0-9]+(\.[0-9]+)?\s*,\s*-?[0-9]+(\.[0-9]+)?$'
    and (
      city is null
      or country is null
      or location_text is null
    )
)
update public.alerts as alerts
set
  location_text = coalesce(
    alerts.location_text,
    case
      when parsed.part_count >= 1
        then parsed.parts[1]
      else null
    end
  ),
  city = coalesce(
    alerts.city,
    case
      when parsed.part_count >= 4
        then parsed.parts[2]
      when parsed.part_count = 3
        then parsed.parts[2]
      when parsed.part_count = 2
        then parsed.parts[1]
      when parsed.part_count = 1
        then parsed.parts[1]
      else null
    end
  ),
  region = coalesce(
    alerts.region,
    case
      when parsed.part_count >= 4
        then parsed.parts[3]
      else null
    end
  ),
  country = coalesce(
    alerts.country,
    case
      when parsed.part_count >= 2
        then parsed.parts[parsed.part_count]
      else 'Desconhecido'
    end
  )
from parsed
where alerts.id = parsed.id;

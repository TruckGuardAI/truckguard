/**
 * Diagnóstico: validar se seed_route_risk_test.sql foi aplicado.
 *
 * Uso:
 *   node scripts/diagnose-seed-applied.mjs
 *
 * Windows (se TLS falhar):
 *   $env:NODE_OPTIONS="--use-system-ca"; node scripts/diagnose-seed-applied.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SEED_TITLE_PREFIX = '[SEED_ROUTE_RISK]';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const env = {};

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');

    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const fileEnv = loadEnvFile(join(ROOT, '.env'));
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  fileEnv.EXPO_PUBLIC_SUPABASE_URL ??
  null;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

function isSeedAlert(title) {
  return (
    typeof title === 'string' &&
    title.includes(SEED_TITLE_PREFIX)
  );
}

async function fetchSeedAlerts(supabase) {
  const pageSize = 1000;
  let from = 0;
  const all = [];

  while (true) {
    const { data, error } = await supabase
      .from('alerts')
      .select('id, title, city, type')
      .like('title', `${SEED_TITLE_PREFIX}%`)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const batch = data ?? [];
    all.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return all.filter((row) =>
    isSeedAlert(row.title),
  );
}

function groupByCity(alerts) {
  const map = new Map();

  for (const alert of alerts) {
    const city = alert.city ?? '(null)';
    map.set(city, (map.get(city) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => a.city.localeCompare(b.city));
}

function groupByType(alerts) {
  const map = new Map();

  for (const alert of alerts) {
    const type = alert.type ?? '(null)';
    map.set(type, (map.get(type) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.type.localeCompare(b.type));
}

async function main() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase não configurado (.env).',
    );
    process.exit(1);
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
  );

  const alerts = await fetchSeedAlerts(supabase);
  const cities = groupByCity(alerts);
  const types = groupByType(alerts);

  console.log('LOG_SEED_TOTAL', {
    count: alerts.length,
    expected: 60,
    applied: alerts.length >= 60,
    supabaseUrl,
  });

  console.log('LOG_SEED_CITIES', {
    cities,
    cityCount: cities.length,
    expectedCityCount: 15,
  });

  console.log('LOG_SEED_TYPES', {
    types,
    typeCount: types.length,
    expectedTypeCount: 4,
  });

  if (alerts.length < 60) {
    console.log(
      '\nSeed incompleto ou não aplicado. Executar supabase/scripts/seed_route_risk_test.sql no SQL Editor.',
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('LOG_SEED_ERROR', {
    message:
      error instanceof Error
        ? error.message
        : String(error),
  });
  process.exit(1);
});

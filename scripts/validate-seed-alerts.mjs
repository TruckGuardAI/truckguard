/**
 * Valida seed de risco no Supabase ligado ao .env
 * Uso: node scripts/validate-seed-alerts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
  fileEnv.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function fetchAllAlerts(supabase) {
  const pageSize = 1000;
  let from = 0;
  const all = [];

  while (true) {
    const { data, error } = await supabase
      .from('alerts')
      .select(
        'id, title, city, type, latitude, longitude, created_at',
      )
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

  return all;
}

function groupByCityType(alerts) {
  const map = new Map();

  for (const alert of alerts) {
    const city = alert.city ?? '(null)';
    const key = `${city}\0${alert.type}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([key, count]) => {
      const [city, type] = key.split('\0');
      return { city, type, count };
    })
    .sort((a, b) =>
      a.city.localeCompare(b.city) ||
      a.type.localeCompare(b.type),
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

function countSeedAlerts(alerts) {
  return alerts.filter((alert) =>
    alert.title?.includes('[SEED_ROUTE_RISK]'),
  ).length;
}

async function main() {
  console.log('=== VALIDAÇÃO SEED ROUTE RISK ===\n');
  console.log('LOG_SUPABASE_PROJECT', {
    url: supabaseUrl,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase não configurado.');
    process.exit(1);
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
  );

  const alerts = await fetchAllAlerts(supabase);
  const total = alerts.length;
  const seedCount = countSeedAlerts(alerts);
  const byCityType = groupByCityType(alerts);
  const byCity = groupByCity(alerts);

  console.log('\n-- select count(*) from alerts;');
  console.log(`total = ${total}`);
  console.log(`seed_[SEED_ROUTE_RISK] = ${seedCount}`);

  console.log(
    '\n-- select city, type, count(*) from alerts group by city, type order by city;',
  );

  for (const row of byCityType) {
    console.log(
      `  ${row.city.padEnd(22)} | ${row.type.padEnd(14)} | ${row.count}`,
    );
  }

  console.log(
    '\n-- select city, count(*) from alerts group by city order by city;',
  );

  for (const row of byCity) {
    console.log(
      `  ${row.city.padEnd(22)} | ${row.count}`,
    );
  }

  const cities = new Set(
    alerts.map((a) => a.city ?? '(null)'),
  );
  const onlyLisboaOrNull =
    cities.size <= 2 &&
    [...cities].every(
      (c) =>
        c === '(null)' ||
        c === 'Lisboa' ||
        c === 'lisboa',
    );

  console.log('\n=== DIAGNÓSTICO ===');

  if (seedCount >= 60) {
    console.log(
      'OK: Seed [SEED_ROUTE_RISK] aplicado (' +
        seedCount +
        ' alertas).',
    );
  } else if (onlyLisboaOrNull && seedCount === 0) {
    console.log(
      'FALHA: Apenas Lisboa/city=null — seed_route_risk_test.sql NÃO aplicado.',
    );
    console.log('\nAção necessária:');
    console.log(
      '1. Abrir supabase/scripts/seed_route_risk_test.sql',
    );
    console.log(
      '2. Executar no SQL Editor: ' + supabaseUrl,
    );
    console.log(
      '3. Repetir: node scripts/validate-seed-alerts.mjs',
    );
  } else {
    console.log(
      'PARCIAL: ' +
        total +
        ' alertas, ' +
        seedCount +
        ' do seed. Esperado 60+ do seed.',
    );
  }

  if (total < 60) {
    console.log('\nEsperado após seed: 60+ alertas totais (inclui seed).');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

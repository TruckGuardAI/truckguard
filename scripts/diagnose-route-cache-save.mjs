/**
 * Diagnóstico: save em route_cache (Porto → Madrid)
 *
 * Uso:
 *   node scripts/diagnose-route-cache-save.mjs
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

function classifySupabaseError(error) {
  const code = error?.code ?? null;
  const message = error?.message ?? String(error);

  return {
    code,
    message,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    isRls: code === '42501' || /row-level security/i.test(message),
    isConstraint:
      code?.startsWith('23') ||
      /constraint|duplicate key|violates/i.test(message),
    isJsonb: /jsonb|invalid input syntax for type json/i.test(message),
  };
}

const fileEnv = loadEnvFile(join(ROOT, '.env'));
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  fileEnv.EXPO_PUBLIC_SUPABASE_URL ??
  '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const originKey = '41.1579,-8.6291';
const destinationKey = '40.4168,-3.7038';
const source = 'openroute';
const distanceKm = 557.12;
const routeGeometry = [
  { latitude: 41.1579, longitude: -8.6291 },
  { latitude: 40.4168, longitude: -3.7038 },
];

async function countRows() {
  const { count, error } = await supabase
    .from('route_cache')
    .select('*', { count: 'exact', head: true });

  return { count: count ?? null, error };
}

const columns = [
  'id',
  'origin_key',
  'destination_key',
  'distance_km',
  'route_geometry',
  'source',
  'created_at',
];

const existingColumns = [];

for (const col of columns) {
  const { error } = await supabase
    .from('route_cache')
    .select(col)
    .limit(0);

  if (!error) {
    existingColumns.push(col);
  }
}

console.log('LOG_ROUTE_CACHE_SCHEMA_PROBE', {
  existingColumns,
});

const beforeCount = await countRows();

console.log('LOG_ROUTE_CACHE_COUNT_BEFORE', beforeCount);

console.log('LOG_ROUTE_CACHE_BEFORE_SAVE', {
  origin_key: originKey,
  destination_key: destinationKey,
  distance_km: distanceKm,
  source,
  geometryPoints: routeGeometry.length,
});

const insertResult = await supabase
  .from('route_cache')
  .insert({
    origin_key: originKey,
    destination_key: destinationKey,
    distance_km: distanceKm,
    route_geometry: routeGeometry,
    source,
  })
  .select('id')
  .maybeSingle();

if (insertResult.error) {
  console.log('LOG_ROUTE_CACHE_SUPABASE_ERROR', {
    action: 'insert',
    ...classifySupabaseError(insertResult.error),
  });
} else {
  console.log('LOG_ROUTE_CACHE_AFTER_SAVE', {
    mode: 'insert',
    id: insertResult.data?.id ?? null,
  });

  if (insertResult.data?.id) {
    await supabase
      .from('route_cache')
      .delete()
      .eq('id', insertResult.data.id);
  }
}

const afterCount = await countRows();

console.log('LOG_ROUTE_CACHE_COUNT_AFTER', afterCount);

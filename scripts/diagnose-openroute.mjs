/**
 * Diagnóstico OpenRoute directions (Porto → Madrid)
 *
 * Uso:
 *   node scripts/diagnose-openroute.mjs
 *
 * Windows / Node 24 (recomendado):
 *   $env:NODE_OPTIONS="--use-system-ca"; node scripts/diagnose-openroute.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  formatTlsError,
  getTlsEnvironmentDiagnostics,
  httpsJsonPost,
  isTlsCertificateError,
} from './lib/nodeTls.mjs';

const OPENROUTE_URL =
  'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

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
const apiKey =
  process.env.EXPO_PUBLIC_OPENROUTE_API_KEY?.trim() ??
  fileEnv.EXPO_PUBLIC_OPENROUTE_API_KEY?.trim() ??
  '';

const keyPrefix = apiKey
  ? apiKey.slice(0, 8)
  : null;

const body = {
  coordinates: [
    [-8.6291, 41.1579],
    [-3.7038, 40.4168],
  ],
};

console.log('LOG_OPENROUTE_CONFIG', {
  url: OPENROUTE_URL,
  envVar: 'EXPO_PUBLIC_OPENROUTE_API_KEY',
  hasApiKey: apiKey.length > 0,
  keyPrefix,
  runtimeLoaded:
    typeof (
      process.env.EXPO_PUBLIC_OPENROUTE_API_KEY ??
      fileEnv.EXPO_PUBLIC_OPENROUTE_API_KEY
    ) === 'string',
  runtimeKeyLength: apiKey.length,
  tlsEnv: getTlsEnvironmentDiagnostics(),
});

if (!apiKey) {
  console.log('LOG_OPENROUTE_ERROR', {
    url: OPENROUTE_URL,
    keyPrefix: null,
    status: null,
    body: null,
    reason: 'missing_api_key',
  });
  process.exit(1);
}

console.log('LOG_OPENROUTE_REQUEST', {
  url: OPENROUTE_URL,
  keyPrefix,
  method: 'POST',
  coordinates: body.coordinates,
  transport: 'node:https',
});

const postResult = await httpsJsonPost(
  OPENROUTE_URL,
  {
    Accept:
      'application/json, application/geo+json;charset=utf-8',
    'Content-Type':
      'application/json; charset=utf-8',
    Authorization: apiKey,
    'User-Agent':
      'TruckGuard-OpenRoute-Diagnostic/1.0',
  },
  body,
);

if (!postResult.ok) {
  const tlsFormatted = postResult.tlsError;

  console.log('LOG_OPENROUTE_ERROR', {
    url: OPENROUTE_URL,
    keyPrefix,
    status: null,
    body: null,
    reason: postResult.isTlsCertificateError
      ? 'TLS_CERTIFICATE_ERROR'
      : 'network_error',
    tls: tlsFormatted,
    tlsEnv: getTlsEnvironmentDiagnostics(),
  });

  if (postResult.isTlsCertificateError) {
    console.log(
      '\nTLS_CERTIFICATE_ERROR — tentar:',
    );
    console.log(
      '  $env:NODE_OPTIONS="--use-system-ca"; node scripts/diagnose-openroute.mjs',
    );
    console.log(
      '  node scripts/diagnose-tls.mjs',
    );
    console.log(
      '  Verificar VPN/proxy/antivirus com inspeção SSL.',
    );
  }

  process.exit(1);
}

const { result } = postResult;

console.log('LOG_OPENROUTE_RESPONSE', {
  url: OPENROUTE_URL,
  keyPrefix,
  status: result.status,
  ok: result.ok,
  body: result.body.slice(0, 500),
  bodyLength: result.body.length,
  tls: result.tls,
});

if (!result.ok) {
  console.log('LOG_OPENROUTE_ERROR', {
    url: OPENROUTE_URL,
    keyPrefix,
    status: result.status,
    body: result.body,
  });
  process.exit(1);
}

const data = JSON.parse(result.body);
const points =
  data.features?.[0]?.geometry?.coordinates?.length ??
  0;

console.log('LOG_OPENROUTE_OK', {
  routePoints: points,
  tlsVersion: result.tls?.protocol ?? null,
  certIssuer: result.tls?.issuer ?? null,
});

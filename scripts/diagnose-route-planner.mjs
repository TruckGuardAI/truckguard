/**
 * Diagnóstico offline do pipeline Porto → Madrid.
 * Replica fetch → mapper → corredor → score (sem alterar lógica da app).
 *
 * Uso: node scripts/diagnose-route-planner.mjs
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

  const content = readFileSync(path, 'utf8');
  const env = {};

  for (const line of content.split('\n')) {
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

const LOOKBACK_DAYS = 30;
const INFLUENCE_KM = 5;
const R = 6371;

const TYPE_WEIGHTS = {
  full_attack: 40,
  cabin_attack: 35,
  cargo_theft: 32,
  fuel: 28,
  sos: 22,
  obstacle: 18,
  pallet: 14,
  mechanic: 8,
  rest: 5,
};

const VALID_TYPES = new Set(Object.keys(TYPE_WEIGHTS));

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function distKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolate(start, end, fraction) {
  return {
    latitude:
      start.latitude +
      (end.latitude - start.latitude) * fraction,
    longitude:
      start.longitude +
      (end.longitude - start.longitude) * fraction,
  };
}

function segmentLengthKm(start, end) {
  return distKm(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude,
  );
}

function totalRouteLengthKm(coordinates) {
  let total = 0;

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    total += segmentLengthKm(
      coordinates[i],
      coordinates[i + 1],
    );
  }

  return total;
}

function distancePointToSegmentKm(point, segmentStart, segmentEnd) {
  const segLen = segmentLengthKm(segmentStart, segmentEnd);

  if (segLen === 0) {
    return {
      distanceKm: distKm(
        point.latitude,
        point.longitude,
        segmentStart.latitude,
        segmentStart.longitude,
      ),
      fraction: 0,
    };
  }

  const latMid =
    (segmentStart.latitude + segmentEnd.latitude) / 2;
  const latRad = toRad(latMid);
  const x1 = toRad(segmentStart.longitude) * Math.cos(latRad);
  const y1 = toRad(segmentStart.latitude);
  const x2 = toRad(segmentEnd.longitude) * Math.cos(latRad);
  const y2 = toRad(segmentEnd.latitude);
  const xp = toRad(point.longitude) * Math.cos(latRad);
  const yp = toRad(point.latitude);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let fraction =
    lenSq === 0
      ? 0
      : ((xp - x1) * dx + (yp - y1) * dy) / lenSq;

  fraction = Math.max(0, Math.min(1, fraction));

  const projected = interpolate(
    segmentStart,
    segmentEnd,
    fraction,
  );

  return {
    distanceKm: distKm(
      point.latitude,
      point.longitude,
      projected.latitude,
      projected.longitude,
    ),
    fraction,
  };
}

function locatePointOnRoute(point, route) {
  let bestDistanceToRoute = Infinity;
  let bestAlong = 0;
  let cumulative = 0;

  for (let i = 0; i < route.length - 1; i += 1) {
    const start = route[i];
    const end = route[i + 1];
    const segLen = segmentLengthKm(start, end);
    const projection = distancePointToSegmentKm(
      point,
      start,
      end,
    );
    const along = cumulative + segLen * projection.fraction;

    if (projection.distanceKm < bestDistanceToRoute) {
      bestDistanceToRoute = projection.distanceKm;
      bestAlong = along;
    }

    cumulative += segLen;
  }

  return {
    distanceAlongRouteKm: bestAlong,
    distanceToRouteKm: bestDistanceToRoute,
  };
}

function buildStraightLineRoute(
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  steps = 64,
) {
  const coordinates = [];

  for (let i = 0; i <= steps; i += 1) {
    const fraction = i / steps;
    coordinates.push({
      latitude:
        originLat +
        (destinationLat - originLat) * fraction,
      longitude:
        originLng +
        (destinationLng - originLng) * fraction,
    });
  }

  return coordinates;
}

function isValidCoordinates(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function mapRow(row) {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);

  if (!isValidCoordinates(lat, lng)) {
    return null;
  }

  const mappedType = VALID_TYPES.has(row.type)
    ? row.type
    : 'fuel';

  return {
    id: row.id,
    title: row.title,
    type: mappedType,
    severity: row.severity,
    latitude: lat,
    longitude: lng,
    createdAt: row.created_at,
    confirmations: Math.max(
      0,
      Number(row.total_confirmations) || 0,
    ),
    negativeVotes: Math.max(
      0,
      Number(row.total_rejections) || 0,
    ),
    resolved: Boolean(row.resolved),
  };
}

function parseAlertTimestamp(alert) {
  if (alert.createdAt) {
    const parsed = Date.parse(alert.createdAt);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getRecencyFactor(ageDays, lookbackDays) {
  if (lookbackDays <= 0) {
    return 1;
  }

  const normalized = ageDays / lookbackDays;

  return Math.max(0.2, 1 - normalized * 0.8);
}

function getDistanceFactor(distanceToRouteKm, influenceKm) {
  if (distanceToRouteKm >= influenceKm) {
    return 0;
  }

  if (influenceKm <= 0) {
    return 1;
  }

  return Math.max(
    0.15,
    1 - (distanceToRouteKm / influenceKm) * 0.85,
  );
}

function getSeverityFactor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 1.3;
    case 'urgent':
      return 1.2;
    case 'watch':
      return 1.05;
    case 'info':
      return 0.9;
    default:
      return 1;
  }
}

function computeAlertContribution(
  alert,
  distanceToRouteKm,
  now,
  influenceKm,
  lookbackDays,
) {
  const typeWeight = TYPE_WEIGHTS[alert.type] ?? 10;
  const distanceFactor = getDistanceFactor(
    distanceToRouteKm,
    influenceKm,
  );
  const timestamp = parseAlertTimestamp(alert);
  let ageDays = 0;

  if (timestamp !== null) {
    const ageMs = now.getTime() - timestamp;
    ageDays = Math.min(
      lookbackDays,
      Math.max(0, ageMs / (24 * 60 * 60 * 1000)),
    );
  }

  const recencyFactor = getRecencyFactor(
    ageDays,
    lookbackDays,
  );
  const severityFactor = getSeverityFactor(alert.severity);
  const confirmationBoost =
    1 + Math.min(alert.confirmations, 10) * 0.05;
  const rejectionPenalty =
    1 - Math.min(alert.negativeVotes, 10) * 0.02;

  return (
    typeWeight *
    distanceFactor *
    recencyFactor *
    severityFactor *
    confirmationBoost *
    Math.max(0.7, rejectionPenalty)
  );
}

function resolveRiskLevel(riskScore) {
  if (riskScore >= 70) {
    return 'high';
  }

  if (riskScore >= 30) {
    return 'medium';
  }

  return 'low';
}

function getLookbackIso() {
  const date = new Date();
  date.setDate(date.getDate() - LOOKBACK_DAYS);

  return date.toISOString();
}

async function main() {
  console.log('=== DIAGNÓSTICO PLANEADOR: Porto → Madrid ===\n');

  console.log('LOG_SUPABASE_PROJECT', {
    url: supabaseUrl,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase não configurado no .env');
    process.exit(1);
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
  );

  const sinceIso = getLookbackIso();
  const columns =
    'id, title, type, severity, latitude, longitude, created_at, resolved, total_confirmations, total_rejections, city';

  const { data, error } = await supabase
    .from('alerts')
    .select(columns)
    .gte('created_at', sinceIso);

  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  const rows = data ?? [];

  console.log('LOG_ALERTS_FETCHED_FULL', {
    total: rows.length,
    sample: rows.slice(0, 10),
  });

  console.log('LOG_ALERT_SAMPLE', {
    count: Math.min(10, rows.length),
    samples: rows.slice(0, 10).map((row) => ({
      city: row.city ?? null,
      latitude: row.latitude,
      longitude: row.longitude,
      type: row.type,
      created_at: row.created_at,
    })),
  });

  const mappedAlerts = rows
    .map(mapRow)
    .filter((item) => item !== null);

  console.log('LOG_ALERTS_MAPPED_FULL', {
    total: mappedAlerts.length,
    sample: mappedAlerts.slice(0, 10).map((alert) => ({
      id: alert.id,
      type: alert.type,
      latitude: alert.latitude,
      longitude: alert.longitude,
      createdAt: alert.createdAt,
    })),
  });

  const routeCoordinates = buildStraightLineRoute(
    41.1579,
    -8.6291,
    40.4168,
    -3.7038,
    64,
  );

  const routeLengthKm = totalRouteLengthKm(
    routeCoordinates,
  );

  console.log('LOG_ROUTE_GEOMETRY', {
    points: routeCoordinates.length,
    distanceKm: Number(routeLengthKm.toFixed(2)),
  });

  const now = new Date();
  const lookbackMs = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const recentAlerts = mappedAlerts.filter((alert) => {
    const timestamp = parseAlertTimestamp(alert);

    if (timestamp === null) {
      return true;
    }

    return now.getTime() - timestamp <= lookbackMs;
  });

  console.log('LOG_ALERTS_AFTER_LOOKBACK', {
    total: recentAlerts.length,
    droppedByLookback:
      mappedAlerts.length - recentAlerts.length,
    lookbackDays: LOOKBACK_DAYS,
  });

  const enriched = [];
  let within5km = 0;
  let within50km = 0;
  let minDistanceOverall = Infinity;
  let maxDistanceOverall = 0;

  for (const alert of recentAlerts) {
    const { distanceToRouteKm, distanceAlongRouteKm } =
      locatePointOnRoute(
        {
          latitude: alert.latitude,
          longitude: alert.longitude,
        },
        routeCoordinates,
      );

    minDistanceOverall = Math.min(
      minDistanceOverall,
      distanceToRouteKm,
    );
    maxDistanceOverall = Math.max(
      maxDistanceOverall,
      distanceToRouteKm,
    );

    if (distanceToRouteKm <= 5) {
      within5km += 1;
    }

    if (distanceToRouteKm <= 50) {
      within50km += 1;
    }

    console.log('LOG_ALERT_DISTANCE', {
      alertId: alert.id,
      type: alert.type,
      latitude: alert.latitude,
      longitude: alert.longitude,
      minDistanceKm: Number(
        distanceToRouteKm.toFixed(3),
      ),
    });

    if (distanceToRouteKm > INFLUENCE_KM) {
      continue;
    }

    enriched.push({
      ...alert,
      distanceToRouteKm,
      distanceAlongRouteKm,
      riskContribution: computeAlertContribution(
        alert,
        distanceToRouteKm,
        now,
        INFLUENCE_KM,
        LOOKBACK_DAYS,
      ),
    });
  }

  console.log('LOG_ALERTS_CORRIDOR_DIAGNOSTIC', {
    analyzed: recentAlerts.length,
    within5km,
    within50km,
    activeCorridorKm: INFLUENCE_KM,
    minDistanceKm: Number.isFinite(minDistanceOverall)
      ? Number(minDistanceOverall.toFixed(3))
      : null,
    maxDistanceKm: Number(
      maxDistanceOverall.toFixed(3),
    ),
  });

  console.log('LOG_ALERTS_IN_CORRIDOR', {
    total: enriched.length,
    ids: enriched.map((alert) => alert.id),
  });

  console.log('LOG_SCORE_INPUT', {
    alertsCount: enriched.length,
    alerts: enriched.map((alert) => ({
      id: alert.id,
      type: alert.type,
      minDistanceKm: Number(
        alert.distanceToRouteKm.toFixed(3),
      ),
      alongRouteKm: Number(
        alert.distanceAlongRouteKm.toFixed(1),
      ),
      riskContribution: Number(
        alert.riskContribution.toFixed(2),
      ),
    })),
  });

  const rawScore = enriched.reduce(
    (sum, alert) => sum + alert.riskContribution,
    0,
  );
  const riskScore = Math.min(
    100,
    Math.max(0, Math.round(rawScore)),
  );
  const riskLevel = resolveRiskLevel(riskScore);

  console.log('LOG_SCORE_OUTPUT', {
    score: riskScore,
    level: riskLevel,
    criticalSegments: [],
  });

  console.log('\n=== RESUMO ===');
  console.log(
    `FETCHED=${rows.length} MAPPED=${mappedAlerts.length} LOOKBACK=${recentAlerts.length} CORRIDOR=${enriched.length} SCORE=${riskScore}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

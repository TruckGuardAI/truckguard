import type { Alert, AlertType } from '../types/alert.types';

import type {
  RouteCriticalSegment,
  RouteRiskAlert,
  RouteRiskAnalysis,
  RouteRiskEngineInput,
} from '../types/routeRisk.types';

import type { RiskLevel } from '../types/risk.types';

import type { RouteCoordinate } from '../types/route.types';

import {
  locatePointOnRoute,
  totalRouteLengthKm,
} from '../utils/routeGeometry.utils';

export const ROUTE_RISK_V2 = {
  lookbackDays: 30,
  influenceKm: 5,
  segmentLengthKm: 10,
  criticalSegmentMinScore: 22,
  maxScore: 100,
} as const;

const TYPE_WEIGHTS: Record<AlertType, number> = {
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

const INSUFFICIENT_ANALYSIS: RouteRiskAnalysis = {
  hasSufficientData: false,
  riskScore: null,
  riskLevel: null,
  criticalSegments: [],
  alertsOnRoute: [],
};

function clampScore(value: number): number {
  return Math.min(
    ROUTE_RISK_V2.maxScore,
    Math.max(0, Math.round(value)),
  );
}

function parseAlertTimestamp(alert: Alert): number | null {
  if (alert.createdAt) {
    const parsed = Date.parse(alert.createdAt);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const numericId = Number(alert.id);

  if (
    Number.isFinite(numericId) &&
    numericId > 1_000_000_000_000
  ) {
    return numericId;
  }

  return null;
}

function getAlertAgeDays(
  alert: Alert,
  now: Date,
  lookbackDays: number,
): number {
  const timestamp = parseAlertTimestamp(alert);

  if (timestamp === null) {
    return 0;
  }

  const ageMs = now.getTime() - timestamp;

  if (ageMs < 0) {
    return 0;
  }

  const ageDays = ageMs / (24 * 60 * 60 * 1000);

  return Math.min(lookbackDays, ageDays);
}

export function getRecencyFactor(
  ageDays: number,
  lookbackDays: number,
): number {
  if (lookbackDays <= 0) {
    return 1;
  }

  const normalized = ageDays / lookbackDays;

  return Math.max(
    0.2,
    1 - normalized * 0.8,
  );
}

export function getDistanceFactor(
  distanceToRouteKm: number,
  influenceKm: number,
): number {
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

export function getIncidentTypeWeight(
  type: AlertType,
): number {
  return TYPE_WEIGHTS[type] ?? 10;
}

export function getSeverityFactor(
  severity?: string | null,
): number {
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

export function computeAlertContribution(
  alert: Alert,
  distanceToRouteKm: number,
  now: Date,
  influenceKm: number,
  lookbackDays: number,
): number {
  const typeWeight = getIncidentTypeWeight(
    alert.type,
  );

  const distanceFactor = getDistanceFactor(
    distanceToRouteKm,
    influenceKm,
  );

  const ageDays = getAlertAgeDays(
    alert,
    now,
    lookbackDays,
  );

  const recencyFactor = getRecencyFactor(
    ageDays,
    lookbackDays,
  );

  const severityFactor = getSeverityFactor(
    alert.severity,
  );

  const confirmationBoost =
    1 +
    Math.min(alert.confirmations, 10) * 0.05;

  const rejectionPenalty =
    1 -
    Math.min(alert.negativeVotes, 10) *
      0.02;

  return (
    typeWeight *
    distanceFactor *
    recencyFactor *
    severityFactor *
    confirmationBoost *
    Math.max(0.7, rejectionPenalty)
  );
}

function resolveRiskLevel(
  riskScore: number,
): RiskLevel {
  if (riskScore >= 70) {
    return 'high';
  }

  if (riskScore >= 30) {
    return 'medium';
  }

  return 'low';
}

function resolveSegmentRiskLevel(
  segmentScore: number,
): RiskLevel {
  if (segmentScore >= 50) {
    return 'high';
  }

  if (segmentScore >= 25) {
    return 'medium';
  }

  return 'low';
}

function getDominantAlertType(
  alerts: RouteRiskAlert[],
): AlertType | null {
  if (alerts.length === 0) {
    return null;
  }

  const totals = new Map<AlertType, number>();

  for (const alert of alerts) {
    totals.set(
      alert.type,
      (totals.get(alert.type) ?? 0) +
        alert.riskContribution,
    );
  }

  let dominant: AlertType | null = null;
  let bestScore = -1;

  for (const [type, score] of totals.entries()) {
    if (score > bestScore) {
      bestScore = score;
      dominant = type;
    }
  }

  return dominant;
}

function buildAlertsOnRoute(
  routeCoordinates: RouteCoordinate[],
  alerts: Alert[],
  now: Date,
  influenceKm: number,
  lookbackDays: number,
): RouteRiskAlert[] {
  const enriched: RouteRiskAlert[] = [];
  let within5km = 0;
  let within50km = 0;
  let minDistanceOverall = Infinity;
  let maxDistanceOverall = 0;

  for (const alert of alerts) {
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

    if (distanceToRouteKm > influenceKm) {
      continue;
    }

    const riskContribution =
      computeAlertContribution(
        alert,
        distanceToRouteKm,
        now,
        influenceKm,
        lookbackDays,
      );

    enriched.push({
      ...alert,
      distanceToRouteKm,
      distanceAlongRouteKm,
      riskContribution,
    });
  }

  console.log('LOG_ALERTS_CORRIDOR_DIAGNOSTIC', {
    analyzed: alerts.length,
    within5km,
    within50km,
    activeCorridorKm: influenceKm,
    minDistanceKm: Number.isFinite(
      minDistanceOverall,
    )
      ? Number(
          minDistanceOverall.toFixed(3),
        )
      : null,
    maxDistanceKm: Number(
      maxDistanceOverall.toFixed(3),
    ),
  });

  console.log('LOG_ALERTS_IN_CORRIDOR', {
    total: enriched.length,
    ids: enriched.map((alert) => alert.id),
  });

  return enriched.sort(
    (a, b) =>
      a.distanceAlongRouteKm -
      b.distanceAlongRouteKm,
  );
}

function buildCriticalSegments(
  alertsOnRoute: RouteRiskAlert[],
  routeLengthKm: number,
): RouteCriticalSegment[] {
  if (
    alertsOnRoute.length === 0 ||
    routeLengthKm <= 0
  ) {
    return [];
  }

  const segmentLengthKm =
    ROUTE_RISK_V2.segmentLengthKm;

  const segmentCount = Math.max(
    1,
    Math.ceil(routeLengthKm / segmentLengthKm),
  );

  const buckets = new Map<
    number,
    RouteRiskAlert[]
  >();

  for (const alert of alertsOnRoute) {
    const index = Math.min(
      segmentCount - 1,
      Math.floor(
        alert.distanceAlongRouteKm /
          segmentLengthKm,
      ),
    );

    const bucket = buckets.get(index) ?? [];
    bucket.push(alert);
    buckets.set(index, bucket);
  }

  const segments: RouteCriticalSegment[] = [];

  for (const [segmentIndex, bucket] of buckets.entries()) {
    const segmentScore = clampScore(
      bucket.reduce(
        (sum, alert) =>
          sum + alert.riskContribution,
        0,
      ),
    );

    if (
      segmentScore <
      ROUTE_RISK_V2.criticalSegmentMinScore
    ) {
      continue;
    }

    const startKm = segmentIndex * segmentLengthKm;
    const endKm = Math.min(
      routeLengthKm,
      startKm + segmentLengthKm,
    );

    segments.push({
      id: `segment-${segmentIndex}`,
      startKm,
      endKm,
      riskScore: segmentScore,
      riskLevel: resolveSegmentRiskLevel(
        segmentScore,
      ),
      alertCount: bucket.length,
      dominantAlertType: getDominantAlertType(
        bucket,
      ),
    });
  }

  return segments.sort(
    (a, b) => b.riskScore - a.riskScore,
  );
}

export function calculateRouteRiskV2(
  input: RouteRiskEngineInput,
): RouteRiskAnalysis {
  const {
    routeCoordinates,
    alerts,
    now = new Date(),
    influenceKm = ROUTE_RISK_V2.influenceKm,
    lookbackDays = ROUTE_RISK_V2.lookbackDays,
  } = input;

  if (routeCoordinates.length < 2) {
    return INSUFFICIENT_ANALYSIS;
  }

  const lookbackMs =
    lookbackDays * 24 * 60 * 60 * 1000;

  const recentAlerts = alerts.filter((alert) => {
    const timestamp = parseAlertTimestamp(alert);

    if (timestamp === null) {
      return true;
    }

    return (
      now.getTime() - timestamp <= lookbackMs
    );
  });

  const routeLengthKm = totalRouteLengthKm(
    routeCoordinates,
  );

  console.log('LOG_ROUTE_GEOMETRY', {
    points: routeCoordinates.length,
    distanceKm: Number(
      routeLengthKm.toFixed(2),
    ),
  });

  console.log('LOG_ALERTS_AFTER_LOOKBACK', {
    total: recentAlerts.length,
    droppedByLookback:
      alerts.length - recentAlerts.length,
    lookbackDays,
  });

  const alertsOnRoute = buildAlertsOnRoute(
    routeCoordinates,
    recentAlerts,
    now,
    influenceKm,
    lookbackDays,
  );

  console.log('LOG_SCORE_INPUT', {
    alertsCount: alertsOnRoute.length,
    alerts: alertsOnRoute.map((alert) => ({
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

  const rawScore = alertsOnRoute.reduce(
    (sum, alert) =>
      sum + alert.riskContribution,
    0,
  );

  const riskScore = clampScore(rawScore);
  const riskLevel = resolveRiskLevel(riskScore);

  const criticalSegments = buildCriticalSegments(
    alertsOnRoute,
    routeLengthKm,
  );

  console.log('LOG_SCORE_OUTPUT', {
    score: riskScore,
    level: riskLevel,
    criticalSegments,
  });

  return {
    hasSufficientData: true,
    riskScore,
    riskLevel,
    criticalSegments,
    alertsOnRoute,
  };
}

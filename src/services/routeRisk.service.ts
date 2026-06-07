import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import type {
  Alert,
  AlertType,
} from '../types/alert.types';

import type {
  RouteRiskAnalysis,
  RouteRiskAnalyzeOptions,
} from '../types/routeRisk.types';

import type { RouteCoordinate } from '../types/route.types';

import { totalRouteLengthKm } from '../utils/routeGeometry.utils';

import {
  calculateRouteRiskV2,
  ROUTE_RISK_V2,
} from './routeRiskEngine.v2';

const TABLE = 'alerts';

const ROUTE_RISK_ALERT_COLUMNS =
  'id, title, type, severity, latitude, longitude, created_at, resolved, total_confirmations, total_rejections, city';

const DEFAULT_TYPE: AlertType = 'fuel';

export type RouteRiskResult = RouteRiskAnalysis;

export type RouteRiskAlertRow = {
  id: string;
  title: string;
  type: string;
  severity: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  resolved: boolean;
  total_confirmations: number | null;
  total_rejections: number | null;
  city?: string | null;
};

const INSUFFICIENT_ROUTE_RISK: RouteRiskResult = {
  hasSufficientData: false,
  riskScore: null,
  riskLevel: null,
  criticalSegments: [],
  alertsOnRoute: [],
};

function getLookbackIso(): string {
  const date = new Date();
  date.setDate(
    date.getDate() -
      ROUTE_RISK_V2.lookbackDays,
  );

  return date.toISOString();
}

function isAlertType(
  value: unknown,
): value is AlertType {
  return (
    value === 'fuel' ||
    value === 'pallet' ||
    value === 'full_attack' ||
    value === 'cargo_theft' ||
    value === 'cabin_attack' ||
    value === 'obstacle' ||
    value === 'mechanic' ||
    value === 'rest' ||
    value === 'sos'
  );
}

function isValidCoordinates(
  lat: number,
  lng: number,
): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function resolveEndpointLabel(
  name: string | undefined,
  coordinate: RouteCoordinate | undefined,
): string {
  if (name?.trim()) {
    return name.trim();
  }

  if (!coordinate) {
    return '—';
  }

  return `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`;
}

function logRouteEnd(
  startedAt: number,
  extra?: Record<string, unknown>,
): void {
  console.log('LOG_ROUTE_END', {
    duracaoMs: Math.round(
      performance.now() - startedAt,
    ),
    ...extra,
  });
}

export function mapRouteRiskAlertRow(
  row: RouteRiskAlertRow,
): Alert | null {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);

  if (!isValidCoordinates(lat, lng)) {
    return null;
  }

  const confirmations = Math.max(
    0,
    Number(row.total_confirmations) || 0,
  );

  const rejections = Math.max(
    0,
    Number(row.total_rejections) || 0,
  );

  const mappedType = isAlertType(row.type)
    ? row.type
    : DEFAULT_TYPE;

  return {
    id: row.id,
    title: row.title,
    type: mappedType,
    severity: row.severity,
    latitude: lat,
    longitude: lng,
    time: row.created_at
      ? new Date(
          row.created_at,
        ).toLocaleTimeString()
      : '—',
    confirmations,
    positiveVotes: confirmations,
    negativeVotes: rejections,
    resolved: Boolean(row.resolved),
    distance: 0,
    createdAt: row.created_at,
  };
}

function mapRouteRiskAlertRows(
  rows: RouteRiskAlertRow[],
): Alert[] {
  return rows
    .map(mapRouteRiskAlertRow)
    .filter(
      (item): item is Alert =>
        item !== null,
    );
}

function logSupabaseProject(): void {
  console.log('LOG_SUPABASE_PROJECT', {
    url:
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      null,
  });
}

function logAlertSample(
  rows: RouteRiskAlertRow[],
): void {
  const samples = rows
    .slice(0, 10)
    .map((row) => ({
      city: row.city ?? null,
      latitude: row.latitude,
      longitude: row.longitude,
      type: row.type,
      created_at: row.created_at,
    }));

  console.log('LOG_ALERT_SAMPLE', {
    count: samples.length,
    samples,
  });
}

function logAlertsFetchedFull(
  rows: RouteRiskAlertRow[],
): void {
  console.log('LOG_ALERTS_FETCHED_FULL', {
    total: rows.length,
    sample: rows.slice(0, 10),
  });
}

function logAlertsMappedFull(
  alerts: Alert[],
): void {
  console.log('LOG_ALERTS_MAPPED_FULL', {
    total: alerts.length,
    sample: alerts.slice(0, 10).map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity ?? null,
      latitude: alert.latitude,
      longitude: alert.longitude,
      confirmations: alert.confirmations,
      negativeVotes: alert.negativeVotes,
      createdAt: alert.createdAt,
      resolved: alert.resolved,
    })),
  });
}

async function fetchAlertsLast30Days(): Promise<Alert[]> {
  logSupabaseProject();

  if (
    !supabase ||
    !isSupabaseConfigured()
  ) {
    console.log('LOG_ALERTS_FETCHED_FULL', {
      total: 0,
      sample: [],
      reason: 'supabase_not_configured',
    });

    console.log('LOG_ALERT_SAMPLE', {
      count: 0,
      samples: [],
      reason: 'supabase_not_configured',
    });

    return [];
  }

  const sinceIso = getLookbackIso();

  const { data, error } =
    await supabase
      .from(TABLE)
      .select(ROUTE_RISK_ALERT_COLUMNS)
      .gte(
        'created_at',
        sinceIso,
      );

  if (error) {
    throw error;
  }

  const rows = (data ??
    []) as RouteRiskAlertRow[];

  logAlertsFetchedFull(rows);

  logAlertSample(rows);

  const alerts = mapRouteRiskAlertRows(rows);

  logAlertsMappedFull(alerts);

  return alerts;
}

class RouteRiskService {
  async analyzeRouteRisk(
    routeCoordinates: RouteCoordinate[],
    options?: RouteRiskAnalyzeOptions,
  ): Promise<RouteRiskResult> {
    const startedAt = performance.now();
    const origem = resolveEndpointLabel(
      options?.origem,
      routeCoordinates[0],
    );
    const destino = resolveEndpointLabel(
      options?.destino,
      routeCoordinates[
        routeCoordinates.length - 1
      ],
    );

    console.log('LOG_RISK_ENGINE_START', {
      origem,
      destino,
      pontosRota: routeCoordinates.length,
    });

    if (routeCoordinates.length < 2) {
      logRouteEnd(startedAt, {
        sucesso: false,
        motivo: 'pontos_insuficientes',
      });

      return INSUFFICIENT_ROUTE_RISK;
    }

    try {
      const distanciaTotalKm = Number(
        totalRouteLengthKm(
          routeCoordinates,
        ).toFixed(2),
      );

      console.log('LOG_ROUTE_DISTANCE', {
        distanciaTotalKm,
      });

      const alerts =
        await fetchAlertsLast30Days();

      console.log('LOG_ALERTS_FETCHED', {
        total: alerts.length,
        lookbackDias: ROUTE_RISK_V2.lookbackDays,
      });

      const result = calculateRouteRiskV2({
        routeCoordinates,
        alerts,
      });

      console.log('LOG_ALERTS_ON_ROUTE', {
        total: result.alertsOnRoute.length,
        corredorKm: ROUTE_RISK_V2.influenceKm,
      });

      console.log('LOG_RISK_SCORE', {
        score: result.riskScore,
        nivel: result.riskLevel,
      });

      console.log('LOG_CRITICAL_SEGMENTS', {
        total: result.criticalSegments.length,
        segmentos: result.criticalSegments.map(
          (segment) => ({
            id: segment.id,
            inicioKm: Number(
              segment.startKm.toFixed(1),
            ),
            fimKm: Number(
              segment.endKm.toFixed(1),
            ),
            score: segment.riskScore,
            nivel: segment.riskLevel,
            alertas: segment.alertCount,
            tipoDominante:
              segment.dominantAlertType,
          }),
        ),
      });

      logRouteEnd(startedAt, {
        sucesso: result.hasSufficientData,
        score: result.riskScore,
        nivel: result.riskLevel,
        alertasNoCorredor:
          result.alertsOnRoute.length,
        segmentosCriticos:
          result.criticalSegments.length,
      });

      return result;
    } catch (error) {
      logRouteEnd(startedAt, {
        sucesso: false,
        erro: true,
      });

      throw error;
    }
  }
}

export const routeRiskService =
  new RouteRiskService();

export async function analyzeRouteRisk(
  routeCoordinates: RouteCoordinate[],
  options?: RouteRiskAnalyzeOptions,
): Promise<RouteRiskResult> {
  return routeRiskService.analyzeRouteRisk(
    routeCoordinates,
    options,
  );
}

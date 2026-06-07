import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import { ALERT_SELECT_COLUMNS } from '../utils/supabaseAlertsLog.utils';

import {
  resolveLocationFromRow,
  type LocationReadableRow,
} from '../utils/locationDescription.utils';

const TABLE = 'alerts';
const LOOKBACK_DAYS = 30;
const GRID_PRECISION = 2;

export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high';

export type RiskZone = {
  latitude: number;
  longitude: number;
  alertCount: number;
  riskScore: number;
  riskLevel: RiskLevel;
};

type AlertZoneRow =
  LocationReadableRow & {
    latitude: number;
    longitude: number;
    confirmations: number;
    total_confirmations?: number;
    created_at: string;
  };

type ZoneAccumulator = {
  latitudeSum: number;
  longitudeSum: number;
  alertCount: number;
  confirmationsSum: number;
};

function getLookbackIso(): string {
  const date = new Date();
  date.setDate(
    date.getDate() - LOOKBACK_DAYS,
  );

  return date.toISOString();
}

function gridKey(
  latitude: number,
  longitude: number,
): string {
  return `${latitude.toFixed(GRID_PRECISION)},${longitude.toFixed(GRID_PRECISION)}`;
}

function resolveRiskLevel(
  riskScore: number,
): RiskLevel {
  if (riskScore >= 20) {
    return 'high';
  }

  if (riskScore >= 10) {
    return 'medium';
  }

  return 'low';
}

function calculateRiskScore(
  alertCount: number,
  confirmations: number,
): number {
  return (
    alertCount +
    confirmations * 0.5
  );
}

function buildRiskZone(
  accumulator: ZoneAccumulator,
): RiskZone {
  const alertCount =
    accumulator.alertCount;

  const riskScore = calculateRiskScore(
    alertCount,
    accumulator.confirmationsSum,
  );

  const zone: RiskZone = {
    latitude:
      accumulator.latitudeSum /
      alertCount,
    longitude:
      accumulator.longitudeSum /
      alertCount,
    alertCount,
    riskScore,
    riskLevel: resolveRiskLevel(
      riskScore,
    ),
  };

  return zone;
}

function clusterAlertsIntoZones(
  rows: AlertZoneRow[],
): RiskZone[] {
  const buckets = new Map<
    string,
    ZoneAccumulator
  >();

  for (const row of rows) {
    const lat = Number(row.latitude);
    const lng = Number(row.longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      continue;
    }

    const key = gridKey(lat, lng);

    const confirmations = Number(
      row.total_confirmations ??
        row.confirmations ??
        0,
    );

    const existing =
      buckets.get(key);

    if (existing) {
      existing.latitudeSum += lat;
      existing.longitudeSum += lng;
      existing.alertCount += 1;
      existing.confirmationsSum +=
        confirmations;

      continue;
    }

    buckets.set(key, {
      latitudeSum: lat,
      longitudeSum: lng,
      alertCount: 1,
      confirmationsSum: confirmations,
    });
  }

  return Array.from(
    buckets.values(),
  ).map(buildRiskZone);
}

class RiskZoneService {
  async getRiskZones(): Promise<RiskZone[]> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return [];
    }

    const sinceIso = getLookbackIso();

    const { data, error } =
      await supabase
        .from(TABLE)
        .select(ALERT_SELECT_COLUMNS)
        .gte(
          'created_at',
          sinceIso,
        );

    if (error) {
      throw error;
    }

    const rows =
      (data ?? []) as AlertZoneRow[];

    const zones = clusterAlertsIntoZones(
      rows,
    );

    const normalizedFromDb = rows.filter(
      (row) =>
        resolveLocationFromRow(row)
          .source === 'database',
    ).length;

    console.log(
      'RISK_ZONE_CALCULATED',
      {
        since: sinceIso,
        rawAlerts: rows.length,
        normalizedFromDb,
        zones: zones.length,
        items: zones,
      },
    );

    return zones;
  }
}

export const riskZoneService =
  new RiskZoneService();

export async function getRiskZones(): Promise<RiskZone[]> {
  return riskZoneService.getRiskZones();
}

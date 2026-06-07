import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import type { AlertType } from '../types/alert.types';

import type {
  CityStat,
  CountryStat,
  IncidentStat,
  TimeRiskStat,
} from '../types/intelligence.types';

import { ALERT_SELECT_COLUMNS } from '../utils/supabaseAlertsLog.utils';

import {
  resolveLocationFromRow,
  type LocationReadableRow,
} from '../utils/locationDescription.utils';

const TABLE = 'alerts';
const LOOKBACK_DAYS = 30;
const TOP_COUNTRIES_LIMIT = 10;
const TOP_CITIES_LIMIT = 10;

const INCIDENT_LABELS: Record<AlertType, string> = {
  fuel: 'Furto combustível',
  pallet: 'Furto carga',
  full_attack: 'Ataque completo',
  cargo_theft: 'Roubo de carga',
  cabin_attack: 'Ataque à cabine',
  obstacle: 'Obstáculo',
  mechanic: 'Mecânica',
  rest: 'Descanso',
  sos: 'SOS',
};

type IntelligenceRow =
  LocationReadableRow & {
    type: string;
    confirmations: number;
    total_confirmations?: number;
    created_at: string;
  };

function getLookbackIso(): string {
  const date = new Date();
  date.setDate(
    date.getDate() - LOOKBACK_DAYS,
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

function rowRiskScore(
  row: IntelligenceRow,
): number {
  const confirmations = Number(
    row.total_confirmations ??
      row.confirmations ??
      0,
  );

  return 1 + confirmations * 0.5;
}

function formatHourLabel(
  hour: number,
): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

class IntelligenceService {
  private cachedRows:
    | IntelligenceRow[]
    | null = null;

  private cacheFetchedAt = 0;

  private readonly cacheTtlMs = 30_000;

  private async loadRows(): Promise<IntelligenceRow[]> {
    const now = Date.now();

    if (
      this.cachedRows &&
      now - this.cacheFetchedAt <
        this.cacheTtlMs
    ) {
      return this.cachedRows;
    }

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      this.cachedRows = [];
      this.cacheFetchedAt = now;

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

    this.cachedRows =
      (data ?? []) as IntelligenceRow[];

    this.cacheFetchedAt = now;

    return this.cachedRows;
  }

  async getCountryStats(): Promise<CountryStat[]> {
    const rows = await this.loadRows();

    const buckets = new Map<
      string,
      CountryStat
    >();

    for (const row of rows) {
      const { country } =
        resolveLocationFromRow(row);

      const score = rowRiskScore(row);

      const existing =
        buckets.get(country);

      if (existing) {
        existing.alertCount += 1;
        existing.riskScore += score;
        continue;
      }

      buckets.set(country, {
        country,
        alertCount: 1,
        riskScore: score,
      });
    }

    const stats = Array.from(
      buckets.values(),
    )
      .sort(
        (a, b) =>
          b.riskScore - a.riskScore ||
          b.alertCount - a.alertCount,
      )
      .slice(0, TOP_COUNTRIES_LIMIT);

    console.log(
      'INTELLIGENCE_COUNTRY_STATS',
      {
        since: getLookbackIso(),
        total: stats.length,
        items: stats,
      },
    );

    return stats;
  }

  async getCityStats(): Promise<CityStat[]> {
    const rows = await this.loadRows();

    const buckets = new Map<
      string,
      CityStat
    >();

    for (const row of rows) {
      const { city, country } =
        resolveLocationFromRow(row);

      const key = `${city}|${country}`;
      const score = rowRiskScore(row);

      const existing =
        buckets.get(key);

      if (existing) {
        existing.alertCount += 1;
        existing.riskScore += score;
        continue;
      }

      buckets.set(key, {
        city,
        country,
        alertCount: 1,
        riskScore: score,
      });
    }

    const stats = Array.from(
      buckets.values(),
    )
      .sort(
        (a, b) =>
          b.riskScore - a.riskScore ||
          b.alertCount - a.alertCount,
      )
      .slice(0, TOP_CITIES_LIMIT);

    console.log(
      'INTELLIGENCE_CITY_STATS',
      {
        since: getLookbackIso(),
        total: stats.length,
        items: stats,
      },
    );

    return stats;
  }

  async getIncidentStats(): Promise<IncidentStat[]> {
    const rows = await this.loadRows();

    const buckets = new Map<
      AlertType,
      number
    >();

    for (const row of rows) {
      const type = isAlertType(row.type)
        ? row.type
        : 'fuel';

      buckets.set(
        type,
        (buckets.get(type) ?? 0) + 1,
      );
    }

    const total = rows.length;

    const stats = Array.from(
      buckets.entries(),
    )
      .map(([type, count]) => ({
        type,
        label: INCIDENT_LABELS[type],
        count,
        percentage:
          total > 0
            ? Math.round(
                (count / total) *
                  1000,
              ) / 10
            : 0,
      }))
      .sort(
        (a, b) =>
          b.count - a.count,
      );

    console.log(
      'INTELLIGENCE_INCIDENT_STATS',
      {
        since: getLookbackIso(),
        total,
        items: stats,
      },
    );

    return stats;
  }

  async getTimeRiskStats(): Promise<TimeRiskStat[]> {
    const rows = await this.loadRows();

    const buckets = new Map<
      number,
      TimeRiskStat
    >();

    for (const row of rows) {
      const hour = new Date(
        row.created_at,
      ).getHours();

      const score = rowRiskScore(row);

      const existing =
        buckets.get(hour);

      if (existing) {
        existing.alertCount += 1;
        existing.riskScore += score;
        continue;
      }

      buckets.set(hour, {
        hour,
        label: formatHourLabel(hour),
        alertCount: 1,
        riskScore: score,
      });
    }

    const stats = Array.from(
      buckets.values(),
    ).sort(
      (a, b) =>
        b.riskScore - a.riskScore ||
        b.alertCount - a.alertCount,
    );

    console.log(
      'INTELLIGENCE_TIME_STATS',
      {
        since: getLookbackIso(),
        total: stats.length,
        items: stats,
      },
    );

    return stats;
  }
}

export const intelligenceService =
  new IntelligenceService();

export async function getCountryStats(): Promise<CountryStat[]> {
  return intelligenceService.getCountryStats();
}

export async function getCityStats(): Promise<CityStat[]> {
  return intelligenceService.getCityStats();
}

export async function getIncidentStats(): Promise<IncidentStat[]> {
  return intelligenceService.getIncidentStats();
}

export async function getTimeRiskStats(): Promise<TimeRiskStat[]> {
  return intelligenceService.getTimeRiskStats();
}

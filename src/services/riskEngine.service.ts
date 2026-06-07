import type { Alert, AlertType } from '../types/alert.types';

import type {
  AreaRiskResult,
  RiskEngineContext,
  RiskLevel,
  RiskLevelDisplay,
  RiskReason,
  RiskScoreBreakdown,
  RiskScoreResult,
} from '../types/risk.types';

import { RISK_LEVEL_DISPLAY } from '../types/risk.types';

import { locationService } from './location.service';

const SCORE_RULES = {
  fuelTheft: 25,
  fullAttack: 40,
  highConfirmations: 15,
  veryCloseKm: 2,
  veryClose: 20,
  criticalHour: 15,
  multipleAlerts: 10,
  areaRecurrence: 12,
} as const;

const NEARBY_RADIUS_KM = 10;
const AREA_CELL_KM = 3;
const HISTORY_HOURS = 24;
const CACHE_TTL_MS = 3000;
const MAX_SCORE = 100;

type CacheEntry = {
  result: AreaRiskResult;
  expiresAt: number;
};

function clampScore(value: number): number {
  return Math.min(MAX_SCORE, Math.max(0, Math.round(value)));
}

function isCriticalHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 0 && hour < 5;
}

function parseAlertTimestamp(alert: {
  id: string;
  createdAt?: string;
  time?: string;
}): number | null {
  if (alert.createdAt) {
    const parsed = Date.parse(alert.createdAt);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const numericId = Number(alert.id);

  if (Number.isFinite(numericId) && numericId > 1_000_000_000_000) {
    return numericId;
  }

  return null;
}

function isWithinLast24Hours(
  timestamp: number | null,
  now: Date,
): boolean {
  if (timestamp === null) {
    return true;
  }

  const diffMs = now.getTime() - timestamp;
  return diffMs >= 0 && diffMs <= HISTORY_HOURS * 60 * 60 * 1000;
}

function buildAreaKey(
  latitude: number,
  longitude: number,
): string {
  const latCell =
    Math.round(latitude / (AREA_CELL_KM / 111)) *
    (AREA_CELL_KM / 111);
  const lngCell =
    Math.round(
      longitude /
        (AREA_CELL_KM /
          (111 * Math.cos((latitude * Math.PI) / 180))),
    ) *
    (AREA_CELL_KM /
      (111 * Math.cos((latitude * Math.PI) / 180)));

  return `${latCell.toFixed(3)}:${lngCell.toFixed(3)}`;
}

function countByType(
  alerts: { type: AlertType }[],
  type: AlertType,
): number {
  return alerts.filter((item) => item.type === type).length;
}

class RiskEngineService {
  private readonly cache = new Map<string, CacheEntry>();

  predictRiskLevel(score: number): RiskLevel {
    if (score <= 30) {
      return 'low';
    }

    if (score <= 70) {
      return 'medium';
    }

    return 'high';
  }

  getLevelDisplay(level: RiskLevel): RiskLevelDisplay {
    return RISK_LEVEL_DISPLAY[level];
  }

  calculateRiskScore(context: RiskEngineContext): RiskScoreResult {
    const now = context.currentTime ?? new Date();
    const breakdown: RiskScoreBreakdown = {
      fuelTheft: 0,
      fullAttack: 0,
      highConfirmations: 0,
      veryClose: 0,
      criticalHour: 0,
      multipleAlerts: 0,
      areaRecurrence: 0,
      otherTypes: 0,
    };

    const reasons: RiskReason[] = [];

    const fuelCount = countByType(
      context.nearbyAlerts,
      'fuel',
    );
    const attackCount = countByType(
      context.nearbyAlerts,
      'full_attack',
    );

    if (fuelCount > 0) {
      breakdown.fuelTheft = fuelCount * SCORE_RULES.fuelTheft;
      reasons.push({
        id: 'fuel',
        text:
          fuelCount === 1
            ? '1 furto combustível'
            : `${fuelCount} furtos combustível`,
      });
    }

    if (attackCount > 0) {
      breakdown.fullAttack =
        attackCount * SCORE_RULES.fullAttack;
      reasons.push({
        id: 'attack',
        text:
          attackCount === 1
            ? 'ataque completo próximo'
            : `${attackCount} ataques completos`,
      });
    }

    const hasHighConfirmations = context.nearbyAlerts.some(
      (alert) => alert.confirmations > 5,
    );

    if (hasHighConfirmations) {
      breakdown.highConfirmations =
        SCORE_RULES.highConfirmations;
      reasons.push({
        id: 'confirmations',
        text: 'alta confirmação comunitária (>5)',
      });
    }

    const veryClose = context.nearbyAlerts.some(
      (alert) => alert.distance < SCORE_RULES.veryCloseKm,
    );

    if (veryClose) {
      breakdown.veryClose = SCORE_RULES.veryClose;
      reasons.push({
        id: 'distance',
        text: `alerta a menos de ${SCORE_RULES.veryCloseKm}km`,
      });
    }

    if (isCriticalHour(now)) {
      breakdown.criticalHour = SCORE_RULES.criticalHour;
      reasons.push({
        id: 'hour',
        text: 'horário crítico (madrugada)',
      });
    }

    if (context.nearbyAlerts.length >= 2) {
      breakdown.multipleAlerts = SCORE_RULES.multipleAlerts;
      reasons.push({
        id: 'multiple',
        text: `múltiplos alertas (${context.nearbyAlerts.length})`,
      });
    }

    const areaKey = buildAreaKey(
      context.userLatitude,
      context.userLongitude,
    );

    const recurrenceInArea = context.history24h.filter(
      (alert) =>
        buildAreaKey(
          alert.latitude,
          alert.longitude,
        ) === areaKey,
    ).length;

    if (recurrenceInArea >= 2) {
      breakdown.areaRecurrence = SCORE_RULES.areaRecurrence;
      reasons.push({
        id: 'recurrence',
        text: 'área recorrente (24h)',
      });
    }

    const sosCount = countByType(context.nearbyAlerts, 'sos');

    if (sosCount > 0) {
      breakdown.otherTypes += sosCount * 15;
      reasons.push({
        id: 'sos',
        text:
          sosCount === 1
            ? 'pedido SOS próximo'
            : `${sosCount} pedidos SOS`,
      });
    }

    const rawScore =
      breakdown.fuelTheft +
      breakdown.fullAttack +
      breakdown.highConfirmations +
      breakdown.veryClose +
      breakdown.criticalHour +
      breakdown.multipleAlerts +
      breakdown.areaRecurrence +
      breakdown.otherTypes;

    const score = clampScore(rawScore);

    return {
      score,
      breakdown,
      reasons: reasons.slice(0, 5),
    };
  }

  calculateAreaRisk(
    userLatitude: number,
    userLongitude: number,
    allAlerts: Alert[],
    nearbyAlerts?: Alert[],
    currentTime?: Date,
  ): AreaRiskResult {
    const now = currentTime ?? new Date();
    const areaKey = buildAreaKey(userLatitude, userLongitude);

    const nearby =
      nearbyAlerts ??
      allAlerts.filter(
        (alert) =>
          !alert.resolved &&
          alert.distance <= NEARBY_RADIUS_KM,
      );

    const cacheKey = [
      areaKey,
      nearby.map((a) => `${a.id}:${a.confirmations}`).join('|'),
      Math.floor(now.getTime() / CACHE_TTL_MS),
      nearby.length,
    ].join('#');

    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const history24h = allAlerts.filter((alert) => {
      const timestamp = parseAlertTimestamp(alert);
      return isWithinLast24Hours(timestamp, now);
    });

    const context: RiskEngineContext = {
      userLatitude,
      userLongitude,
      currentTime: now,
      nearbyAlerts: nearby.map((alert) => ({
        type: alert.type,
        distance: alert.distance,
        confirmations: alert.confirmations,
        resolved: alert.resolved,
        createdAt: alert.createdAt,
        latitude: alert.latitude,
        longitude: alert.longitude,
      })),
      history24h: history24h.map((alert) => ({
        type: alert.type,
        confirmations: alert.confirmations,
        createdAt: alert.createdAt,
        latitude: alert.latitude,
        longitude: alert.longitude,
      })),
    };

    const scoreResult = this.calculateRiskScore(context);
    const level = this.predictRiskLevel(scoreResult.score);
    const display = this.getLevelDisplay(level);

    const result: AreaRiskResult = {
      score: scoreResult.score,
      level,
      display,
      reasons: scoreResult.reasons,
      nearbyCount: nearby.length,
      history24hCount: history24h.length,
      areaKey,
      calculatedAt: now.toISOString(),
    };

    console.log('RISK_SCORE', {
      source: 'riskEngine.calculateAreaRisk',
      score: result.score,
      level: result.level,
      nearbyCount: result.nearbyCount,
      areaKey: result.areaKey,
    });

    this.cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    if (this.cache.size > 40) {
      const oldestKey = this.cache.keys().next().value;

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    return result;
  }

  enrichAlertsForRisk(
    alerts: Alert[],
    userLatitude: number,
    userLongitude: number,
  ): Alert[] {
    return alerts.map((alert) => ({
      ...alert,
      distance: locationService.calculateDistanceKm(
        userLatitude,
        userLongitude,
        alert.latitude,
        alert.longitude,
      ),
    }));
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const riskEngineService = new RiskEngineService();

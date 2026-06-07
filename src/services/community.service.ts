import { Ionicons } from '@expo/vector-icons';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

import type { Alert } from '../types/alert.types';
import type {
  AlertSeverity,
  CommunityAlertItem,
  CommunityAlertType,
} from '../types/community.types';

import type { UserTrustLevel } from '../types/reputation.types';

import {
  enrichAlertsWithDistance,
} from '../utils/alertRadar.utils';

import {
  normalizeText,
  sanitizeIonicon,
} from '../utils/alertNormalize.utils';

import {
  UNRESOLVED_ALERTS_SQL,
  unresolvedAlertsOrFilter,
} from '../utils/alertFilters.utils';

import {
  getErrorMessage,
  logQueryAfterExecute,
  logQueryBeforeExecute,
} from '../utils/supabaseAlertsLog.utils';

import {
  calculateAlertTrust,
  type AlertTrustLevel,
} from './alertTrust.service';

import { alertsApiService } from './alertsApi.service';
import {
  locationService,
  type UserCoordinates,
} from './location.service';

const TABLE = 'alerts';

export type CommunityStats = {
  openCount: number;
  positiveTotal: number;
  negativeTotal: number;
};

export type HomeSafetyStatus =
  | 'safe'
  | 'attention'
  | 'critical';

export type NearbyAlertItem = {
  id: string;
  title: string;
  locationDescription: string;
  distanceKm: number | null;
  timeAgo: string;
  positiveVotes: number;
  negativeVotes: number;
  trustScore: number;
  trustLevel: AlertTrustLevel;
  creatorUserId?: string | null;
  creatorReputationScore?: number;
  creatorTrustLevel?: UserTrustLevel;
};

type StatsRow = {
  confirmations: number;
};

let feedCache: {
  key: string;
  data: CommunityAlertItem[];
  at: number;
} | null = null;

let statsCache: {
  data: CommunityStats;
  at: number;
} | null = null;

const CACHE_TTL_MS = 15_000;

function formatTimeAgo(
  createdAt?: string,
  time?: string,
): string {
  if (createdAt) {
    const diffMs =
      Date.now() -
      new Date(createdAt).getTime();

    if (diffMs < 0) {
      return 'agora';
    }

    const diffMins = Math.floor(
      diffMs / 60_000
    );

    if (diffMins < 1) {
      return 'agora';
    }

    if (diffMins < 60) {
      return `há ${diffMins} min`;
    }

    const diffHours = Math.floor(
      diffMins / 60
    );

    if (diffHours < 24) {
      return `há ${diffHours} h`;
    }

    const diffDays = Math.floor(
      diffHours / 24
    );

    return `há ${diffDays} d`;
  }

  return time ? `há ${time}` : '—';
}

function mapAlertToCommunityItem(
  alert: Alert,
): CommunityAlertItem {
  let type: CommunityAlertType =
    'suspicious_activity';
  let severity: AlertSeverity = 'info';
  let icon: keyof typeof Ionicons.glyphMap =
    'alert-circle-outline';

  switch (alert.type) {
    case 'fuel':
      type = 'diesel_theft_attempt';
      severity = 'urgent';
      icon = 'flame-outline';
      break;
    case 'pallet':
      type = 'cargo_alert';
      severity = 'urgent';
      icon = 'cube-outline';
      break;
    case 'full_attack':
    case 'cargo_theft':
    case 'cabin_attack':
      type = 'cargo_alert';
      severity = 'critical';
      icon = 'shield-outline';
      break;
    case 'obstacle':
      type = 'suspicious_activity';
      severity = 'watch';
      icon = 'eye-outline';
      break;
    case 'mechanic':
      type = 'suspicious_activity';
      severity = 'watch';
      icon = 'build-outline';
      break;
    case 'rest':
      type = 'security_check_in';
      severity = 'info';
      icon = 'checkmark-circle-outline';
      break;
    case 'sos':
      type = 'driver_sos';
      severity = 'critical';
      icon = 'warning-outline';
      break;
  }

  const trust = calculateAlertTrust({
    confirmations:
      alert.positiveVotes ?? 0,
    rejections:
      alert.negativeVotes ?? 0,
  });

  return {
    id: alert.id,
    type,
    title: alert.title,
    distanceKm: alert.distance,
    locationLabel: normalizeText(
      alert.locationName,
    ),
    timeAgo: formatTimeAgo(
      alert.createdAt,
      alert.time,
    ),
    severity,
    icon: sanitizeIonicon(icon),
    positiveVotes:
      alert.confirmations ?? 0,
    negativeVotes:
      alert.negativeVotes ?? 0,
    trustScore: trust.trustScore,
    trustLevel: trust.trustLevel,
    creatorUserId: alert.userId ?? null,
  };
}

function sortByCreatedAtDesc(
  alerts: Alert[],
): Alert[] {
  return [...alerts].sort((a, b) => {
    const aTime = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;
    const bTime = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    return bTime - aTime;
  });
}

async function fetchUnresolvedAlerts(): Promise<Alert[]> {
  return alertsApiService.getAlerts();
}

async function enrichWithUserDistance(
  alerts: Alert[],
  latitude?: number,
  longitude?: number,
): Promise<Alert[]> {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return alerts.map((alert) => ({
      ...alert,
      distance: 0,
    }));
  }

  return enrichAlertsWithDistance(
    alerts,
    latitude,
    longitude,
  );
}

class CommunityService {
  async getCommunityStats(): Promise<CommunityStats> {
    const now = Date.now();

    if (
      statsCache &&
      now - statsCache.at < CACHE_TTL_MS
    ) {
      logQueryAfterExecute(
        [{ openCount: statsCache.data.openCount }],
        null,
        `CACHE stats WHERE ${UNRESOLVED_ALERTS_SQL}`,
      );

      return statsCache.data;
    }

    const emptyStats: CommunityStats = {
      openCount: 0,
      positiveTotal: 0,
      negativeTotal: 0,
    };

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      const alerts =
        await fetchUnresolvedAlerts();

      const data: CommunityStats = {
        openCount: alerts.length,
        positiveTotal: alerts.reduce(
          (sum, item) =>
            sum + (item.confirmations ?? 0),
          0,
        ),
        negativeTotal: 0,
      };

      statsCache = { data, at: now };
      return data;
    }

    try {
      const nowIso = new Date().toISOString();
      const sql =
        `SELECT confirmations FROM ${TABLE} ` +
        `WHERE ${UNRESOLVED_ALERTS_SQL}`;

      logQueryBeforeExecute(sql);

      const { data, error } = await supabase
        .from(TABLE)
        .select('confirmations')
        .eq('resolved', false)
        .or(unresolvedAlertsOrFilter(nowIso));

      logQueryAfterExecute(data, error, sql);

      if (error || !data) {
        throw error;
      }

      const rows = data as StatsRow[];
      const result: CommunityStats = {
        openCount: rows.length,
        positiveTotal: rows.reduce(
          (sum, row) =>
            sum + (row.confirmations ?? 0),
          0,
        ),
        negativeTotal: 0,
      };

      statsCache = {
        data: result,
        at: now,
      };

      return result;
    } catch (error) {
      console.error(
        'QUERY_ERROR',
        getErrorMessage(error),
      );

      return emptyStats;
    }
  }

  async getCommunityFeed(
    latitude?: number,
    longitude?: number,
  ): Promise<CommunityAlertItem[]> {
    const cacheKey = `${latitude ?? 'na'}:${longitude ?? 'na'}`;
    const now = Date.now();

    if (
      feedCache &&
      feedCache.key === cacheKey &&
      now - feedCache.at < CACHE_TTL_MS
    ) {
      logQueryAfterExecute(
        feedCache.data,
        null,
        `CACHE feed WHERE ${UNRESOLVED_ALERTS_SQL}`,
      );

      return feedCache.data;
    }

    const alerts = sortByCreatedAtDesc(
      await fetchUnresolvedAlerts(),
    );

    const withDistance =
      await enrichWithUserDistance(
        alerts,
        latitude,
        longitude,
      );

    const feed = withDistance.map(
      mapAlertToCommunityItem,
    );

    feedCache = {
      key: cacheKey,
      data: feed,
      at: now,
    };

    return feed;
  }

  async getNearbyAlerts(
    latitude?: number,
    longitude?: number,
    limit = 3,
  ): Promise<NearbyAlertItem[]> {
    const alerts = sortByCreatedAtDesc(
      await fetchUnresolvedAlerts(),
    );

    const hasLocation =
      typeof latitude === 'number' &&
      typeof longitude === 'number';

    if (!hasLocation) {
      return alerts
        .slice(0, limit)
        .map((alert) => {
          const trust =
            calculateAlertTrust({
              confirmations:
                alert.positiveVotes ?? 0,
              rejections:
                alert.negativeVotes ?? 0,
            });

          return {
            id: alert.id,
            title: alert.title,
            locationDescription:
              alert.locationName ?? '',
            positiveVotes:
              alert.positiveVotes ?? 0,
            negativeVotes:
              alert.negativeVotes ?? 0,
            trustScore:
              trust.trustScore,
            trustLevel:
              trust.trustLevel,
            distanceKm: null,
            timeAgo: formatTimeAgo(
              alert.createdAt,
              alert.time,
            ),
          };
        });
    }

    const withDistance =
      await enrichWithUserDistance(
        alerts,
        latitude,
        longitude,
      );

    return withDistance
      .sort(
        (a, b) =>
          a.distance - b.distance,
      )
      .slice(0, limit)
      .map((alert) => {
        const trust = calculateAlertTrust({
          confirmations:
            alert.positiveVotes ?? 0,
          rejections:
            alert.negativeVotes ?? 0,
        });

        return {
          id: alert.id,
          title: alert.title,
          locationDescription:
            alert.locationName ?? '',
          positiveVotes:
            alert.positiveVotes ?? 0,
          negativeVotes:
            alert.negativeVotes ?? 0,
          trustScore: trust.trustScore,
          trustLevel: trust.trustLevel,
          distanceKm: alert.distance,
          timeAgo: formatTimeAgo(
            alert.createdAt,
            alert.time,
          ),
        };
      });
  }

  async getHomeSafetyStatus(
    latitude?: number,
    longitude?: number,
  ): Promise<HomeSafetyStatus> {
    const hasLocation =
      typeof latitude === 'number' &&
      typeof longitude === 'number';

    if (!hasLocation) {
      return 'safe';
    }

    const alerts = await enrichWithUserDistance(
      await fetchUnresolvedAlerts(),
      latitude,
      longitude,
    );

    const within5km = alerts.filter(
      (alert) => alert.distance <= 5,
    );

    if (
      within5km.some(
        (alert) => alert.distance < 1,
      )
    ) {
      return 'critical';
    }

    if (
      within5km.some(
        (alert) =>
          alert.distance >= 1 &&
          alert.distance <= 5,
      )
    ) {
      return 'attention';
    }

    return 'safe';
  }

  async resolveUserLocation(): Promise<
    UserCoordinates | null
  > {
    try {
      return await locationService.getCurrentLocation();
    } catch (error) {
      console.error(
        'QUERY_ERROR',
        getErrorMessage(error),
      );

      return null;
    }
  }
}

export const communityService =
  new CommunityService();

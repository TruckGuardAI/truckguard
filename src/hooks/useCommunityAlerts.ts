import { Ionicons } from '@expo/vector-icons';

import {
  useCallback,
  useState,
} from 'react';

import { useNotificationPreferences } from '../context/NotificationPreferencesContext';

import {
  useFocusEffect,
} from 'expo-router';

import {
  calculateAlertRelevance,
} from '../services/alertRelevance.service';
import {
  calculateAlertTrust,
  sortByAlertRanking,
} from '../services/alertTrust.service';
import { alertsApiService } from '../services/alertsApi.service';
import { profileService } from '../services/profile.service';
import { reputationService } from '../services/reputation.service';
import { startAlertsRealtime } from '../services/realtime.service';
import {
  communityService,
  type CommunityStats,
} from '../services/community.service';

import type { UserCoordinates } from '../services/location.service';
import type { Alert } from '../types/alert.types';
import type { UserProfile } from '../types/profile.types';

import type {
  AlertSeverity,
  CommunityAlertItem,
  CommunityAlertType,
} from '../types/community.types';

import { enrichAlertsWithDistance } from '../utils/alertRadar.utils';
import {
  normalizeText,
  sanitizeIonicon,
} from '../utils/alertNormalize.utils';
import { getErrorMessage } from '../utils/supabaseAlertsLog.utils';
import { withTimeout } from '../utils/withTimeout';

const REFRESH_INTERVAL_MS = 30_000;

const EMPTY_STATS: CommunityStats = {
  openCount: 0,
  positiveTotal: 0,
  negativeTotal: 0,
};

const LOCATION_TIMEOUT_MS = 5_000;

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
      diffMs / 60_000,
    );

    if (diffMins < 1) {
      return 'agora';
    }

    if (diffMins < 60) {
      return `há ${diffMins} min`;
    }

    const diffHours = Math.floor(
      diffMins / 60,
    );

    if (diffHours < 24) {
      return `há ${diffHours} h`;
    }

    const diffDays = Math.floor(
      diffHours / 24,
    );

    return `há ${diffDays} d`;
  }

  return time ? `há ${time}` : '—';
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

async function enrichFeedWithCreatorReputations(
  feed: CommunityAlertItem[],
  rawAlerts: Alert[],
): Promise<CommunityAlertItem[]> {
  const creatorIds = rawAlerts
    .map((alert) => alert.userId)
    .filter(
      (id): id is string =>
        typeof id === 'string' &&
        id.length > 0,
    );

  if (creatorIds.length === 0) {
    return feed;
  }

  const reputationMap =
    await reputationService.getReputationsForUserIds(
      creatorIds,
    );

  return feed.map((item) => {
    const rawAlert = rawAlerts.find(
      (alert) => alert.id === item.id,
    );
    const userId = rawAlert?.userId;

    if (!userId) {
      return item;
    }

    const reputation =
      reputationMap.get(userId);

    if (!reputation) {
      return {
        ...item,
        creatorUserId: userId,
      };
    }

    return {
      ...item,
      creatorUserId: userId,
      creatorReputationScore:
        reputation.reputationScore,
      creatorTrustLevel:
        reputation.trustLevel,
    };
  });
}

function buildCommunityStats(
  alerts: Alert[],
): CommunityStats {
  return {
    openCount: alerts.length,
    positiveTotal: alerts.reduce(
      (sum, item) =>
        sum + (item.confirmations ?? 0),
      0,
    ),
    negativeTotal: 0,
  };
}

function buildCommunityFeed(
  alerts: Alert[],
  latitude?: number,
  longitude?: number,
  profile?: UserProfile | null,
): CommunityAlertItem[] {
  const sorted = sortByCreatedAtDesc(alerts);

  const relevanceProfile = {
    tipoVeiculo: profile?.tipoVeiculo,
    tipoCarga: profile?.tipoCarga,
  };

  const hasLocation =
    typeof latitude === 'number' &&
    typeof longitude === 'number';

  const withDistance = hasLocation
    ? enrichAlertsWithDistance(
        sorted,
        latitude,
        longitude,
      )
    : sorted.map((alert) => ({
        ...alert,
        distance: 0,
      }));

  return sortByAlertRanking(
    withDistance.map((alert) => {
      const trust = calculateAlertTrust({
        confirmations:
          alert.positiveVotes ?? 0,
        rejections:
          alert.negativeVotes ?? 0,
      });

      return {
        alert,
        distance: alert.distance,
        relevanceScore:
          calculateAlertRelevance(
            {
              id: alert.id,
              type: alert.type,
              title: alert.title,
            },
            relevanceProfile,
          ).score,
        trustScore: trust.trustScore,
      };
    }),
  ).map(({ alert }) =>
    mapAlertToCommunityItem(alert),
  );
}

async function resolveLocationWithTimeout(): Promise<{
  location: UserCoordinates | null;
  timedOut: boolean;
}> {
  try {
    const location = await withTimeout(
      communityService.resolveUserLocation(),
      LOCATION_TIMEOUT_MS,
    );

    return {
      location,
      timedOut: false,
    };
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      error.message === 'timeout';

    return {
      location: null,
      timedOut,
    };
  }
}

export function useCommunityAlerts() {
  const {
    communityAlertsEnabled,
  } = useNotificationPreferences();

  const [
    alerts,
    setAlerts,
  ] = useState<CommunityAlertItem[]>([]);

  const [
    stats,
    setStats,
  ] = useState<CommunityStats>(EMPTY_STATS);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const load = useCallback(async () => {
    console.log('COMMUNITY_FETCH_START');
    setLoading(true);

    if (!communityAlertsEnabled) {
      setAlerts([]);
      setStats(EMPTY_STATS);
      setLoading(false);
      console.log('COMMUNITY_FETCH_SKIPPED_DISABLED');
      return;
    }

    try {
      const [
        locationResult,
        rawAlerts,
        profile,
      ] = await Promise.all([
        resolveLocationWithTimeout(),
        alertsApiService.getAlerts(),
        profileService.loadAuthenticatedProfile(),
      ]);

      const location =
        locationResult.location;

      console.log('MAPPED_ALERTS', rawAlerts);

      const feed = await enrichFeedWithCreatorReputations(
        buildCommunityFeed(
          rawAlerts,
          location?.latitude,
          location?.longitude,
          profile,
        ),
        rawAlerts,
      );

      console.log('COMMUNITY_HOOK_RESULT', {
        alertsCount: rawAlerts.length,
        feedCount: feed.length,
      });

      const communityStats =
        buildCommunityStats(rawAlerts);

      const alertCount = rawAlerts.length;
      const activeCount =
        communityStats.openCount;

      console.log('COMMUNITY_FETCH_SUCCESS', {
        alertCount,
        activeCount,
        feedCount: feed.length,
        stats: communityStats,
        hasLocation: Boolean(location),
      });

      setAlerts(feed);
      setStats(communityStats);
    } catch (error) {
      console.log('COMMUNITY_FETCH_ERROR', {
        error,
        message: getErrorMessage(error),
      });
      console.error(
        'COMMUNITY_FETCH_ERROR',
        getErrorMessage(error),
      );

      setAlerts([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
      console.log('COMMUNITY_LOAD_FINISH');
    }
  }, [communityAlertsEnabled]);

  useFocusEffect(
    useCallback(() => {
      void load();

      if (!communityAlertsEnabled) {
        return () => {};
      }

      const interval = setInterval(() => {
        void load();
      }, REFRESH_INTERVAL_MS);

      const stopRealtime =
        startAlertsRealtime(() => {
          console.log(
            'REALTIME_REFRESH_COMMUNITY',
          );
          void load();
        });

      return () => {
        clearInterval(interval);
        stopRealtime();
      };
    }, [load, communityAlertsEnabled]),
  );

  return {
    alerts,
    stats,
    loading,
    refresh: load,
  };
}

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
import type {
  CommunityStats,
  HomeSafetyStatus,
  NearbyAlertItem,
} from '../services/community.service';
import { communityService } from '../services/community.service';
import type { UserCoordinates } from '../services/location.service';
import type { Alert } from '../types/alert.types';
import type { UserProfile } from '../types/profile.types';
import { enrichAlertsWithDistance } from '../utils/alertRadar.utils';
import { getErrorMessage } from '../utils/supabaseAlertsLog.utils';
import { withTimeout } from '../utils/withTimeout';

type UseHomeAlertsResult = {
  nearbyAlerts: NearbyAlertItem[];
  safetyStatus: HomeSafetyStatus;
  stats: CommunityStats;
  loading: boolean;
  refresh: () => Promise<void>;
};

const EMPTY_STATS: CommunityStats = {
  openCount: 0,
  positiveTotal: 0,
  negativeTotal: 0,
};

const LOCATION_TIMEOUT_MS = 5_000;
const NEARBY_LIMIT = 3;

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

function mapNearbyAlertItem(
  alert: Alert,
  distanceKm: number | null,
): NearbyAlertItem {
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
    distanceKm,
    timeAgo: formatTimeAgo(
      alert.createdAt,
      alert.time,
    ),
  };
}

function buildNearbyAlerts(
  alerts: Alert[],
  latitude?: number,
  longitude?: number,
  profile?: UserProfile | null,
  limit = NEARBY_LIMIT,
): NearbyAlertItem[] {
  const sorted = sortByCreatedAtDesc(alerts);

  const relevanceProfile = {
    tipoVeiculo: profile?.tipoVeiculo,
    tipoCarga: profile?.tipoCarga,
  };

  const hasLocation =
    typeof latitude === 'number' &&
    typeof longitude === 'number';

  if (!hasLocation) {
    return sortByAlertRanking(
      sorted.map((alert) => {
        const trust =
          calculateAlertTrust({
            confirmations:
              alert.positiveVotes ?? 0,
            rejections:
              alert.negativeVotes ?? 0,
          });

        return {
          alert,
          distance:
            Number.MAX_SAFE_INTEGER,
          relevanceScore:
            calculateAlertRelevance(
              {
                id: alert.id,
                type: alert.type,
                title: alert.title,
              },
              relevanceProfile,
            ).score,
          trustScore:
            trust.trustScore,
        };
      }),
    )
      .slice(0, limit)
      .map(({ alert }) =>
        mapNearbyAlertItem(
          alert,
          null,
        ),
      );
  }

  return sortByAlertRanking(
    enrichAlertsWithDistance(
      sorted,
      latitude,
      longitude,
    ).map((alert) => {
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
  )
    .slice(0, limit)
    .map(({ alert }) =>
      mapNearbyAlertItem(
        alert,
        alert.distance,
      ),
    );
}

async function enrichNearbyWithCreatorReputations(
  nearby: NearbyAlertItem[],
  rawAlerts: Alert[],
): Promise<NearbyAlertItem[]> {
  const creatorIds = rawAlerts
    .map((alert) => alert.userId)
    .filter(
      (id): id is string =>
        typeof id === 'string' &&
        id.length > 0,
    );

  if (creatorIds.length === 0) {
    return nearby;
  }

  const reputationMap =
    await reputationService.getReputationsForUserIds(
      creatorIds,
    );

  return nearby.map((item) => {
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

function buildHomeSafetyStatus(
  alerts: Alert[],
  latitude?: number,
  longitude?: number,
): HomeSafetyStatus {
  const hasLocation =
    typeof latitude === 'number' &&
    typeof longitude === 'number';

  if (!hasLocation) {
    return 'safe';
  }

  const withDistance =
    enrichAlertsWithDistance(
      alerts,
      latitude,
      longitude,
    );

  const within5km = withDistance.filter(
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

export function useHomeAlerts(): UseHomeAlertsResult {
  const {
    communityAlertsEnabled,
  } = useNotificationPreferences();

  const [
    nearbyAlerts,
    setNearbyAlerts,
  ] = useState<NearbyAlertItem[]>([]);

  const [
    safetyStatus,
    setSafetyStatus,
  ] = useState<HomeSafetyStatus>('safe');

  const [
    stats,
    setStats,
  ] = useState<CommunityStats>(EMPTY_STATS);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const load = useCallback(async () => {
    console.log('HOME_FETCH_START');
    setLoading(true);

    if (!communityAlertsEnabled) {
      setNearbyAlerts([]);
      setSafetyStatus('safe');
      setStats(EMPTY_STATS);
      setLoading(false);
      console.log('HOME_FETCH_SKIPPED_DISABLED');
      return;
    }

    try {
      const [
        locationResult,
        alerts,
        profile,
      ] = await Promise.all([
        resolveLocationWithTimeout(),
        alertsApiService.getAlerts(),
        profileService.loadAuthenticatedProfile(),
      ]);

      const location =
        locationResult.location;

      console.log('MAPPED_ALERTS', alerts);

      if (location) {
        console.log('HOME_LOCATION_SUCCESS', {
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } else {
        console.log('HOME_LOCATION_ERROR', {
          reason: locationResult.timedOut
            ? 'timeout'
            : 'unavailable',
        });
      }

      const nearby =
        await enrichNearbyWithCreatorReputations(
          buildNearbyAlerts(
            alerts,
            location?.latitude,
            location?.longitude,
            profile,
            NEARBY_LIMIT,
          ),
          alerts,
        );

      console.log('HOME_HOOK_RESULT', {
        alertsCount: alerts.length,
        nearbyCount: nearby.length,
      });

      const status = buildHomeSafetyStatus(
        alerts,
        location?.latitude,
        location?.longitude,
      );

      const communityStats =
        buildCommunityStats(alerts);

      console.log('HOME_FETCH_SUCCESS', {
        alertCount: alerts.length,
        nearbyCount: nearby.length,
        status,
        stats: communityStats,
        hasLocation: Boolean(location),
      });

      setNearbyAlerts(nearby);
      setSafetyStatus(status);
      setStats(communityStats);
    } catch (error) {
      console.log('HOME_ALERTS_ERROR', {
        error,
        message: getErrorMessage(error),
      });
      console.error(
        'QUERY_ERROR',
        getErrorMessage(error),
      );
      console.error(
        'HOME_ALERTS_ERROR',
        getErrorMessage(error),
      );

      setNearbyAlerts([]);
      setSafetyStatus('safe');
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
      console.log('HOME_LOAD_FINISH');
    }
  }, [communityAlertsEnabled]);

  useFocusEffect(
    useCallback(() => {
      void load();

      if (!communityAlertsEnabled) {
        return () => {};
      }

      const stopRealtime =
        startAlertsRealtime(() => {
          console.log(
            'REALTIME_REFRESH_HOME',
          );
          void load();
        });

      return () => {
        stopRealtime();
      };
    }, [load, communityAlertsEnabled]),
  );

  return {
    nearbyAlerts,
    safetyStatus,
    stats,
    loading,
    refresh: load,
  };
}

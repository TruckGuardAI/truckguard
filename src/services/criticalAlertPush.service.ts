import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import type { Alert } from '../types/alert.types';

import type {
  AlertNotificationPriority,
  NotifyNearbyUsersResult,
} from '../types/alertNotification.types';

import {
  buildAlertNotificationConfig,
  shouldDispatchRemotePush,
} from './alertPriority.service';

import { nearbyUsersService } from './nearbyUsers.service';

type EdgeFunctionResponse = {
  nearbyCount?: number;
  sentCount?: number;
  failedCount?: number;
  error?: string;
};

class CriticalAlertPushService {
  async notifyNearbyUsersForAlert(
    alert: Alert,
    excludeUserId?: string | null,
  ): Promise<NotifyNearbyUsersResult> {
    const config =
      buildAlertNotificationConfig(
        alert.type,
      );

    if (
      config.priority === 'CRITICAL'
    ) {
      console.log(
        'LOG_CRITICAL_ALERT_CREATED',
        {
          alertId: alert.id,
          type: alert.type,
          priority: config.priority,
          sound: config.sound,
          radiusKm: config.radiusKm,
          latitude: alert.latitude,
          longitude: alert.longitude,
        },
      );
    }

    if (
      !shouldDispatchRemotePush(
        config.priority,
      )
    ) {
      return {
        nearbyCount: 0,
        sentCount: 0,
        failedCount: 0,
      };
    }

    let nearbyCount = 0;

    try {
      const nearbyUsers =
        await nearbyUsersService.getNearbyUsers(
          alert.latitude,
          alert.longitude,
          config.radiusKm,
          excludeUserId,
        );

      nearbyCount = nearbyUsers.length;
    } catch (error) {
      console.log('LOG_PUSH_FAILED', {
        alertId: alert.id,
        stage: 'nearby_lookup',
        error,
      });

      return {
        nearbyCount: 0,
        sentCount: 0,
        failedCount: 1,
      };
    }

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      console.log('LOG_PUSH_FAILED', {
        alertId: alert.id,
        stage: 'supabase_not_configured',
      });

      return {
        nearbyCount,
        sentCount: 0,
        failedCount: nearbyCount,
      };
    }

    try {
      const { data, error } =
        await supabase.functions.invoke(
          'notify-nearby-users',
          {
            body: {
              alertId: alert.id,
            },
          },
        );

      if (error) {
        throw error;
      }

      const result =
        (data ?? {}) as EdgeFunctionResponse;

      const sentCount =
        result.sentCount ?? 0;
      const failedCount =
        result.failedCount ?? 0;
      const resolvedNearby =
        result.nearbyCount ??
        nearbyCount;

      if (sentCount > 0) {
        console.log('LOG_PUSH_SENT', {
          alertId: alert.id,
          priority: config.priority,
          nearbyCount: resolvedNearby,
          sentCount,
        });
      }

      if (failedCount > 0) {
        console.log('LOG_PUSH_FAILED', {
          alertId: alert.id,
          priority: config.priority,
          nearbyCount: resolvedNearby,
          failedCount,
          error:
            result.error ?? null,
        });
      }

      return {
        nearbyCount: resolvedNearby,
        sentCount,
        failedCount,
      };
    } catch (error) {
      console.log('LOG_PUSH_FAILED', {
        alertId: alert.id,
        priority: config.priority,
        nearbyCount,
        error,
      });

      return {
        nearbyCount,
        sentCount: 0,
        failedCount: nearbyCount,
      };
    }
  }

  getPriorityForType(
    type: Alert['type'],
  ): AlertNotificationPriority {
    return buildAlertNotificationConfig(
      type,
    ).priority;
  }
}

export const criticalAlertPushService =
  new CriticalAlertPushService();

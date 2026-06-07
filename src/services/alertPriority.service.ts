import type { AlertType } from '../types/alert.types';

import {
  ALERT_TYPE_PRIORITY_MAP,
  ALERT_TYPE_RADIUS_KM,
  type AlertNotificationConfig,
  type AlertNotificationPriority,
} from '../types/alertNotification.types';

export const NOTIFICATION_SOUND_CRITICAL =
  'critical_alert';

export const NOTIFICATION_SOUND_DEFAULT =
  'default';

export function resolveAlertNotificationPriority(
  type: AlertType,
): AlertNotificationPriority {
  return (
    ALERT_TYPE_PRIORITY_MAP[type] ??
    'NORMAL'
  );
}

export function resolveNotificationRadiusKm(
  type: AlertType,
): number {
  return (
    ALERT_TYPE_RADIUS_KM[type] ?? 10
  );
}

export function resolveNotificationSound(
  priority: AlertNotificationPriority,
): string {
  if (priority === 'CRITICAL') {
    return NOTIFICATION_SOUND_CRITICAL;
  }

  return NOTIFICATION_SOUND_DEFAULT;
}

export function buildAlertNotificationConfig(
  type: AlertType,
): AlertNotificationConfig {
  const priority =
    resolveAlertNotificationPriority(
      type,
    );

  return {
    priority,
    sound:
      resolveNotificationSound(
        priority,
      ),
    radiusKm:
      resolveNotificationRadiusKm(
        type,
      ),
  };
}

export function shouldDispatchRemotePush(
  priority: AlertNotificationPriority,
): boolean {
  return (
    priority === 'CRITICAL' ||
    priority === 'HIGH' ||
    priority === 'NORMAL'
  );
}

export function getAndroidChannelId(
  priority: AlertNotificationPriority,
): string {
  if (priority === 'CRITICAL') {
    return 'truckguard-critical';
  }

  if (priority === 'HIGH') {
    return 'truckguard-high';
  }

  return 'truckguard-normal';
}

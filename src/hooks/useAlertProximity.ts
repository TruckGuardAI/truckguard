import { useEffect, useRef } from 'react';

import {
  Alert,
  Vibration,
} from 'react-native';

import type { Alert as TruckAlert } from '../types/alert.types';

import type { AlertNotificationPriority } from '../types/alertNotification.types';

import type { UserCoordinates } from '../services/location.service';

import {
  buildAlertNotificationConfig,
} from '../services/alertPriority.service';

import {
  locationService,
} from '../services/location.service';

import {
  notificationsService,
} from '../services/notifications.service';

type ProximityLevel =
  | 'visual'
  | 'sound'
  | 'siren';

function buildKey(
  alertId: string,
  level: ProximityLevel,
): string {
  return `${alertId}:${level}`;
}

function isValidLocation(
  coords: UserCoordinates,
): boolean {
  return (
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude)
  );
}

function isValidAlert(
  alert: TruckAlert,
): boolean {
  return (
    !alert.resolved &&
    Number.isFinite(alert.latitude) &&
    Number.isFinite(alert.longitude)
  );
}

function resolvePriority(
  alert: TruckAlert,
): AlertNotificationPriority {
  if (
    alert.notificationPriority ===
      'CRITICAL' ||
    alert.notificationPriority ===
      'HIGH' ||
    alert.notificationPriority ===
      'NORMAL'
  ) {
    return alert.notificationPriority;
  }

  return buildAlertNotificationConfig(
    alert.type,
  ).priority;
}

function getProximityThresholds(
  priority: AlertNotificationPriority,
): {
  visualKm: number;
  soundKm: number;
  sirenKm: number;
} {
  if (priority === 'CRITICAL') {
    return {
      visualKm: 5,
      soundKm: 2,
      sirenKm: 0.5,
    };
  }

  if (priority === 'HIGH') {
    return {
      visualKm: 4,
      soundKm: 1.5,
      sirenKm: 0.75,
    };
  }

  return {
    visualKm: 3,
    soundKm: 1,
    sirenKm: 1.5,
  };
}

export function useAlertProximity(
  alerts: TruckAlert[],
  userLocation: UserCoordinates,
  enabled: boolean,
): void {
  const triggeredRef =
    useRef<Set<string>>(new Set());

  useEffect(() => {
    if (
      !enabled ||
      !isValidLocation(userLocation)
    ) {
      return;
    }

    alerts.forEach((alert) => {
      if (!isValidAlert(alert)) {
        return;
      }

      const priority =
        resolvePriority(alert);

      const thresholds =
        getProximityThresholds(
          priority,
        );

      const distanceKm =
        locationService.calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          alert.latitude,
          alert.longitude,
        );

      if (
        distanceKm <= thresholds.sirenKm
      ) {
        if (
          triggeredRef.current.has(
            buildKey(alert.id, 'siren'),
          )
        ) {
          return;
        }

        triggeredRef.current.add(
          buildKey(alert.id, 'siren'),
        );

        console.log(
          'PROXIMITY_SIREN',
          alert.title,
          distanceKm,
          priority,
        );

        void notificationsService.showAlertNotification(
          priority === 'CRITICAL'
            ? 'Alerta CRÍTICO TruckGuard'
            : 'Sirene TruckGuard',
          `${alert.title} a ${distanceKm.toFixed(1)} km`,
          {
            priority,
          },
        );

        if (priority === 'CRITICAL') {
          Vibration.vibrate([
            0,
            500,
            200,
            500,
            200,
            500,
          ]);
        } else {
          Vibration.vibrate([
            0,
            250,
            150,
            250,
          ]);
        }
      } else if (
        distanceKm <= thresholds.soundKm
      ) {
        if (
          triggeredRef.current.has(
            buildKey(alert.id, 'sound'),
          )
        ) {
          return;
        }

        triggeredRef.current.add(
          buildKey(alert.id, 'sound'),
        );

        console.log(
          'PROXIMITY_SOUND',
          alert.title,
          distanceKm,
          priority,
        );

        void notificationsService.showAlertNotification(
          'Alerta TruckGuard',
          `${alert.title} a ${distanceKm.toFixed(1)} km`,
          { priority },
        );

        if (priority !== 'NORMAL') {
          Vibration.vibrate([
            0,
            250,
            150,
            250,
          ]);
        }
      } else if (
        distanceKm <= thresholds.visualKm
      ) {
        if (
          triggeredRef.current.has(
            buildKey(alert.id, 'visual'),
          )
        ) {
          return;
        }

        triggeredRef.current.add(
          buildKey(alert.id, 'visual'),
        );

        console.log(
          'PROXIMITY_VISUAL',
          alert.title,
          distanceKm,
          priority,
        );

        void notificationsService.showAlertNotification(
          'Alerta próximo',
          `${alert.title} a ${distanceKm.toFixed(1)} km`,
          { priority },
        );

        if (priority === 'CRITICAL') {
          Alert.alert(
            'Alerta CRÍTICO próximo',
            `${alert.title} a ${distanceKm.toFixed(1)} km`,
          );
        }
      }
    });
  }, [
    alerts,
    enabled,
    userLocation,
  ]);
}

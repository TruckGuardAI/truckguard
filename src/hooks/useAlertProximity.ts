import { useEffect, useRef } from 'react';

import {
  Alert,
  Vibration,
} from 'react-native';

import type { Alert as TruckAlert } from '../types/alert.types';
import type { UserCoordinates } from '../services/location.service';

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

const VISUAL_DISTANCE_KM = 5;
const SOUND_DISTANCE_KM = 2;
const SIREN_DISTANCE_KM = 0.5;

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

      const distanceKm =
        locationService.calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          alert.latitude,
          alert.longitude,
        );

      if (distanceKm <= SIREN_DISTANCE_KM) {
        if (triggeredRef.current.has(buildKey(alert.id, 'siren'))) {
          return;
        }

        triggeredRef.current.add(buildKey(alert.id, 'siren'));

        console.log(
          'PROXIMITY_SIREN',
          alert.title,
          distanceKm
        );

        void notificationsService.showAlertNotification(
          'Sirene TruckGuard',
          `${alert.title} a ${distanceKm.toFixed(1)} km`,
          {
            highPriority: true,
          },
        );

        Vibration.vibrate([
          0,
          700,
          200,
          700,
          200,
          1000,
        ]);
      } else if (distanceKm <= SOUND_DISTANCE_KM) {
        if (triggeredRef.current.has(buildKey(alert.id, 'sound'))) {
          return;
        }

        triggeredRef.current.add(buildKey(alert.id, 'sound'));

        console.log(
          'PROXIMITY_SOUND',
          alert.title,
          distanceKm
        );

        void notificationsService.showAlertNotification(
          'Alerta TruckGuard',
          `${alert.title} a ${distanceKm.toFixed(1)} km`,
        );

        Vibration.vibrate([
          0,
          250,
          150,
          250,
        ]);
      } else if (distanceKm <= VISUAL_DISTANCE_KM) {
        if (triggeredRef.current.has(buildKey(alert.id, 'visual'))) {
          return;
        }

        triggeredRef.current.add(buildKey(alert.id, 'visual'));

        console.log(
          'PROXIMITY_VISUAL',
          alert.title,
          distanceKm
        );

        void notificationsService.showAlertNotification(
          'Alerta próximo',
          `${alert.title} a ${distanceKm.toFixed(1)} km`,
        );

        Alert.alert(
          'Alerta próximo',
          `${alert.title} a ${distanceKm.toFixed(1)} km`,
        );
      }
    });
  }, [
    alerts,
    enabled,
    userLocation,
  ]);
}

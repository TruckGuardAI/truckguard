import { locationService } from '../services/location.service';

import type { Alert } from '../types/alert.types';

export type RadiusFilterKm = 5 | 10 | 25 | 50 | null;

export const RADIUS_FILTER_OPTIONS: {
  label: string;
  value: RadiusFilterKm;
}[] = [
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '25km', value: 25 },
  { label: '50km', value: 50 },
  { label: 'Todos', value: null },
];

export function enrichAlertsWithDistance(
  alerts: Alert[],
  userLatitude: number,
  userLongitude: number,
): Alert[] {
  return alerts
    .map((alert) => ({
      ...alert,
      distance: locationService.calculateDistanceKm(
        userLatitude,
        userLongitude,
        alert.latitude,
        alert.longitude,
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}

export function filterAlertsByRadius(
  alerts: Alert[],
  radiusKm: RadiusFilterKm,
): Alert[] {
  if (radiusKm === null) {
    return alerts;
  }

  return alerts.filter((alert) => alert.distance <= radiusKm);
}

export function findAlertById(
  alerts: Alert[],
  id: string,
): Alert | undefined {
  return alerts.find((alert) => alert.id === id);
}

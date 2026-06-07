import type { AlertType } from './alert.types';

export type AlertNotificationPriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'NORMAL';

export type NearbyUser = {
  userId: string;
  distanceKm: number;
};

export type AlertNotificationConfig = {
  priority: AlertNotificationPriority;
  sound: string;
  radiusKm: number;
};

export type NotifyNearbyUsersResult = {
  nearbyCount: number;
  sentCount: number;
  failedCount: number;
};

export const ALERT_TYPE_PRIORITY_MAP: Record<
  AlertType,
  AlertNotificationPriority
> = {
  sos: 'CRITICAL',
  full_attack: 'CRITICAL',
  cargo_theft: 'HIGH',
  fuel: 'NORMAL',
  obstacle: 'NORMAL',
  pallet: 'NORMAL',
  cabin_attack: 'HIGH',
  mechanic: 'NORMAL',
  rest: 'NORMAL',
};

export const ALERT_TYPE_RADIUS_KM: Record<
  AlertType,
  number
> = {
  sos: 50,
  full_attack: 30,
  cargo_theft: 20,
  fuel: 15,
  obstacle: 10,
  pallet: 15,
  cabin_attack: 20,
  mechanic: 10,
  rest: 10,
};

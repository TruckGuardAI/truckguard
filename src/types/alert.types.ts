export type AlertType =
  | 'fuel'
  | 'pallet'
  | 'full_attack'
  | 'cargo_theft'
  | 'cabin_attack'
  | 'obstacle'
  | 'mechanic'
  | 'rest'
  | 'sos';

export type Alert = {
  id: string;

  title: string;

  type: AlertType;

  severity?: string | null;

  notificationPriority?:
    | 'CRITICAL'
    | 'HIGH'
    | 'NORMAL'
    | null;

  notificationSound?: string | null;

  latitude: number;
  longitude: number;

  time: string;

  confirmations: number;

  positiveVotes: number;
  negativeVotes: number;

  resolved: boolean;

  distance: number;

  locationName?: string;

  createdAt?: string;

  expiresAt?: string;

  userId?: string | null;
};

export type AlertAlongRoute = Alert & {
  distanceToRouteKm: number;
  distanceAheadKm: number;
};

export type CreateAlertInput = {
  title: string;

  type?: AlertType;

  description?: string;

  location_text?: string;

  city?: string;

  region?: string;

  country?: string;

  latitude: number;
  longitude: number;

  locationName?: string;

  /** Quando true, não dispara notificações push (alertas manuais). */
  skipPush?: boolean;
};

export type AlertsConnectionStatus =
  | 'loading'
  | 'online'
  | 'offline'
  | 'reconnecting'
  | 'error';

export type RadarViewMode =
  | 'nearby'
  | 'route'
  | 'all';
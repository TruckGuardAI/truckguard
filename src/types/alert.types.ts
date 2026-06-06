export type AlertType =
  | 'fuel'
  | 'pallet'
  | 'full_attack'
  | 'obstacle'
  | 'mechanic'
  | 'rest'
  | 'sos';

export type Alert = {
  id: string;

  title: string;

  type: AlertType;

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
};

export type AlertAlongRoute = Alert & {
  distanceToRouteKm: number;
  distanceAheadKm: number;
};

export type CreateAlertInput = {
  title: string;

  type?: AlertType;

  latitude: number;
  longitude: number;

  locationName?: string;
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
import type {
  Alert,
  AlertType,
} from '../types/alert.types';

import { normalizeText } from './alertNormalize.utils';

import { resolveLocationFromRow } from './locationDescription.utils';

const DEFAULT_TYPE: AlertType = 'fuel';

export type AlertRow = {
  id: string;
  title: string;
  description: string | null;
  location_text?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  type: string;
  severity: string | null;
  notification_priority?: string | null;
  notification_sound?: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  expires_at: string | null;
  resolved: boolean;
  confirmations: number;
  total_confirmations?: number;
  total_rejections?: number;
  user_id?: string | null;
};

function resolveVoteCounts(
  row: AlertRow,
): {
  confirmations: number;
  rejections: number;
} {
  const confirmations =
    row.total_confirmations ??
    row.confirmations ??
    0;

  const rejections =
    row.total_rejections ?? 0;

  return {
    confirmations,
    rejections,
  };
}

function isAlertType(
  value: unknown,
): value is AlertType {
  return (
    value === 'fuel' ||
    value === 'pallet' ||
    value === 'full_attack' ||
    value === 'cargo_theft' ||
    value === 'cabin_attack' ||
    value === 'obstacle' ||
    value === 'mechanic' ||
    value === 'rest' ||
    value === 'sos'
  );
}

function isValidCoordinates(
  lat: number,
  lng: number,
): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function mapRowToAlert(
  row: AlertRow,
): Alert | null {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);

  if (!isValidCoordinates(lat, lng)) {
    return null;
  }

  const voteCounts =
    resolveVoteCounts(row);

  return {
    id: row.id,
    title: row.title,
    type: isAlertType(row.type)
      ? row.type
      : DEFAULT_TYPE,
    severity: row.severity,
    notificationPriority:
      row.notification_priority as
        | Alert['notificationPriority']
        | undefined,
    notificationSound:
      row.notification_sound ?? null,
    latitude: lat,
    longitude: lng,
    time: row.created_at
      ? new Date(
          row.created_at,
        ).toLocaleTimeString()
      : '—',
    confirmations:
      voteCounts.confirmations,
    positiveVotes:
      voteCounts.confirmations,
    negativeVotes:
      voteCounts.rejections,
    resolved: Boolean(row.resolved),
    locationName: normalizeText(
      resolveLocationFromRow(row)
        .displayText,
    ),
    distance: 0,
    createdAt: row.created_at,
    expiresAt:
      row.expires_at ?? undefined,
    userId: row.user_id ?? null,
  };
}

export function mapRowsToAlerts(
  rows: AlertRow[],
): Alert[] {
  return rows
    .map(mapRowToAlert)
    .filter(
      (item): item is Alert =>
        item !== null,
    );
}

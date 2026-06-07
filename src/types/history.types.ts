import type { AlertType } from './alert.types';

export type HistoryFilter =
  | 'today'
  | '7days'
  | '30days'
  | 'all';

export type HistoryStatus =
  | 'open'
  | 'expired'
  | 'resolved';

export type AlertTrustLevel =
  | 'low'
  | 'medium'
  | 'high';

export type HistoryAlert = {
  id: string;
  title: string;
  type: AlertType;
  description?: string;
  latitude: number;
  longitude: number;
  positiveVotes: number;
  negativeVotes: number;
  trustScore: number;
  trustLevel: AlertTrustLevel;
  createdAt: string;
  expiresAt?: string;
  resolved: boolean;
  distanceKm: number;
  status: HistoryStatus;
  dateLabel: string;
  timeLabel: string;
  icon: string;
};

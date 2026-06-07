import { Ionicons } from '@expo/vector-icons';

import type { UserTrustLevel } from './reputation.types';

export type AlertSeverity = 'info' | 'watch' | 'urgent' | 'critical';

export type CommunityAlertType =
  | 'diesel_theft_attempt'
  | 'suspicious_activity'
  | 'cargo_alert'
  | 'driver_sos'
  | 'security_check_in';

export type AlertTrustLevel =
  | 'low'
  | 'medium'
  | 'high';

export interface CommunityAlertItem {
  id: string;
  type: CommunityAlertType;
  title: string;
  distanceKm: number;
  locationLabel: string;
  timeAgo: string;
  severity: AlertSeverity;
  icon: keyof typeof Ionicons.glyphMap;
  positiveVotes: number;
  negativeVotes: number;
  trustScore: number;
  trustLevel: AlertTrustLevel;
  creatorUserId?: string | null;
  creatorReputationScore?: number;
  creatorTrustLevel?: UserTrustLevel;
}

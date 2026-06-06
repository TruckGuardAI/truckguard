import { Ionicons } from '@expo/vector-icons';

export type AlertSeverity = 'info' | 'watch' | 'urgent' | 'critical';

export type CommunityAlertType =
  | 'diesel_theft_attempt'
  | 'suspicious_activity'
  | 'cargo_alert'
  | 'driver_sos'
  | 'security_check_in';

export interface CommunityAlertItem {
  id: string;
  type: CommunityAlertType;
  title: string;
  distanceKm: number;
  locationLabel: string;
  timeAgo: string;
  severity: AlertSeverity;
  icon: keyof typeof Ionicons.glyphMap;
}

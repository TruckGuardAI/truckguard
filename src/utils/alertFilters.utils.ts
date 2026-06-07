import type { Alert } from '../types/alert.types';

export const UNRESOLVED_ALERTS_SQL =
  'resolved = false AND (expires_at IS NULL OR expires_at > now())';

export function isUnresolvedAlert(alert: {
  resolved: boolean;
  expiresAt?: string;
}): boolean {
  if (alert.resolved) {
    return false;
  }

  if (!alert.expiresAt) {
    return true;
  }

  return (
    new Date(alert.expiresAt).getTime() >
    Date.now()
  );
}

export function filterUnresolvedAlerts(
  alerts: Alert[],
): Alert[] {
  return alerts.filter(isUnresolvedAlert);
}

export function unresolvedAlertsOrFilter(
  nowIso: string,
): string {
  return `expires_at.is.null,expires_at.gt.${nowIso}`;
}

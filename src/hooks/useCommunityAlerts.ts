import { useState, useEffect } from 'react';
import { alertsApiService } from '../services/alertsApi.service';
import type { Alert } from '../types/alert.types';
import type { CommunityAlertItem, CommunityAlertType, AlertSeverity } from '../types/community.types';
import { Ionicons } from '@expo/vector-icons';

function mapAlertToCommunityItem(alert: Alert): CommunityAlertItem {
  let type: CommunityAlertType = 'suspicious_activity';
  let severity: AlertSeverity = 'info';
  let icon: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';

  switch (alert.type) {
    case 'fuel':
      type = 'diesel_theft_attempt';
      severity = 'urgent';
      icon = 'flame-outline';
      break;
    case 'pallet':
      type = 'cargo_alert';
      severity = 'urgent';
      icon = 'cube-outline';
      break;
    case 'full_attack':
      type = 'cargo_alert';
      severity = 'critical';
      icon = 'shield-outline';
      break;
    case 'obstacle':
      type = 'suspicious_activity';
      severity = 'watch';
      icon = 'eye-outline';
      break;
    case 'mechanic':
      type = 'suspicious_activity';
      severity = 'watch';
      icon = 'build-outline';
      break;
    case 'rest':
      type = 'security_check_in';
      severity = 'info';
      icon = 'checkmark-circle-outline';
      break;
    case 'sos':
      type = 'driver_sos';
      severity = 'critical';
      icon = 'warning-outline';
      break;
  }

  let timeAgo = alert.time;
  if (alert.createdAt) {
    const diffMs = Date.now() - new Date(alert.createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      timeAgo = `${diffMins} min ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      timeAgo = `${diffHours} h ago`;
    }
  }

  return {
    id: alert.id,
    type,
    title: alert.title,
    distanceKm: alert.distance,
    locationLabel: alert.locationName ?? 'Localização desconhecida',
    timeAgo: timeAgo,
    severity,
    icon,
  };
}

export function useCommunityAlerts(fallbackMock: CommunityAlertItem[]) {
  const [alerts, setAlerts] = useState<CommunityAlertItem[]>(fallbackMock);

  useEffect(() => {
    let disposed = false;
    
    alertsApiService.getAlerts().then((data) => {
      if (!disposed) {
        if (data && data.length > 0) {
          setAlerts(data.map(mapAlertToCommunityItem));
        } else {
          setAlerts(fallbackMock);
        }
      }
    }).catch(() => {
      if (!disposed) {
        setAlerts(fallbackMock);
      }
    });

    const unsubscribe = alertsApiService.subscribeAlerts((data) => {
      if (!disposed) {
        if (data && data.length > 0) {
          setAlerts(data.map(mapAlertToCommunityItem));
        } else {
          setAlerts(fallbackMock);
        }
      }
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [fallbackMock]);

  return { alerts };
}

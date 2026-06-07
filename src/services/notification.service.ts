import {
  Platform,
  Vibration,
} from 'react-native';

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import type { AlertType } from '../types/alert.types';

import type { AlertNotificationPriority } from '../types/alertNotification.types';

import {
  calculateAlertRelevance,
  shouldSendPushForRelevance,
} from './alertRelevance.service';

import {
  buildAlertNotificationConfig,
  getAndroidChannelId,
  resolveNotificationRadiusKm,
} from './alertPriority.service';

import { ensureAlertNotificationChannels } from './alertNotificationChannels.service';

import {
  calculateAlertTrust,
  shouldSendPushForTrust,
} from './alertTrust.service';

import { locationService } from './location.service';
import { locationSyncService } from './locationSync.service';
import { profileService } from './profile.service';

const PUSH_CHANNEL_NAME =
  'alerts-push-notifications';

const DEDUP_TTL_MS = 5 * 60 * 1000;

const NOTIFY_ALERT_TYPES = new Set<
  AlertType
>([
  'sos',
  'full_attack',
  'cargo_theft',
  'fuel',
  'obstacle',
  'pallet',
  'cabin_attack',
]);

export type LocalAlertNotificationInput =
  {
    id: string;
    title: string;
    type: AlertType;
    distanceKm: number;
    priority: AlertNotificationPriority;
    sound: string;
  };

type AlertRealtimeRow = {
  id: string;
  title: string;
  type: string;
  latitude: number;
  longitude: number;
  resolved?: boolean;
  confirmations?: number;
  total_confirmations?: number;
  total_rejections?: number;
  notification_priority?: string | null;
  notification_sound?: string | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function isNotifyAlertType(
  value: string,
): value is AlertType {
  return NOTIFY_ALERT_TYPES.has(
    value as AlertType,
  );
}

function parseAlertRow(
  payload: RealtimePostgresChangesPayload<AlertRealtimeRow>,
): AlertRealtimeRow | null {
  const row =
    payload.eventType === 'DELETE'
      ? payload.old
      : payload.new;

  if (!row?.id || !row.title) {
    return null;
  }

  const lat = Number(row.latitude);
  const lng = Number(row.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    type: row.type ?? 'fuel',
    latitude: lat,
    longitude: lng,
    resolved: Boolean(row.resolved),
    notification_priority:
      row.notification_priority,
    notification_sound:
      row.notification_sound,
  };
}

function resolveRowPriority(
  row: AlertRealtimeRow,
): AlertNotificationPriority {
  if (
    row.notification_priority ===
      'CRITICAL' ||
    row.notification_priority ===
      'HIGH' ||
    row.notification_priority ===
      'NORMAL'
  ) {
    return row.notification_priority;
  }

  return buildAlertNotificationConfig(
    isNotifyAlertType(row.type)
      ? row.type
      : 'fuel',
  ).priority;
}

class NotificationService {
  private pushChannel: RealtimeChannel | null =
    null;

  private notificationsEnabled = true;

  private communityAlertsEnabled = true;

  private readonly notifiedCache =
    new Map<string, number>();

  setNotificationsEnabled(
    enabled: boolean,
  ): void {
    this.notificationsEnabled = enabled;

    if (!enabled) {
      this.stopAlertPushNotifications();
    }
  }

  isNotificationsEnabled(): boolean {
    return this.notificationsEnabled;
  }

  setCommunityAlertsEnabled(
    enabled: boolean,
  ): void {
    this.communityAlertsEnabled = enabled;
  }

  isCommunityAlertsEnabled(): boolean {
    return this.communityAlertsEnabled;
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!this.notificationsEnabled) {
      return null;
    }

    if (
      Platform.OS === 'web' ||
      !Device.isDevice
    ) {
      return null;
    }

    try {
      await ensureAlertNotificationChannels();

      const current =
        await Notifications.getPermissionsAsync();

      let granted =
        current.granted ||
        current.status === 'granted';

      if (!granted) {
        const requested =
          await Notifications.requestPermissionsAsync();

        granted =
          requested.granted ||
          requested.status === 'granted';
      }

      if (!granted) {
        console.log(
          'PUSH_PERMISSION_DENIED',
        );

        return null;
      }

      console.log(
        'PUSH_PERMISSION_GRANTED',
      );

      const projectId =
        Constants.expoConfig?.extra?.eas
          ?.projectId ??
        Constants.easConfig?.projectId;

      const tokenResult =
        await Notifications.getExpoPushTokenAsync(
          projectId
            ? { projectId }
            : undefined,
        );

      const pushToken =
        tokenResult.data;

      console.log(
        'PUSH_TOKEN_REGISTERED',
        pushToken,
      );

      await profileService.loadAuthenticatedProfile();

      await profileService.savePushToken(
        pushToken,
      );

      await locationSyncService.syncFromCurrentLocation(
        {
          source: 'push_register',
          force: true,
        },
      );

      return pushToken;
    } catch (error) {
      console.log(
        'PUSH_TOKEN_REGISTERED',
        null,
        error,
      );

      return null;
    }
  }

  async schedulePriorityNotification(
    title: string,
    body: string,
    priority: AlertNotificationPriority,
    sound: string,
  ): Promise<string> {
    if (!this.notificationsEnabled) {
      return '';
    }

    const channelId =
      getAndroidChannelId(priority);

    const androidPriority =
      priority === 'CRITICAL'
        ? Notifications.AndroidNotificationPriority.MAX
        : priority === 'HIGH'
          ? Notifications.AndroidNotificationPriority.HIGH
          : Notifications.AndroidNotificationPriority.DEFAULT;

    return Notifications.scheduleNotificationAsync(
      {
        content: {
          title,
          body,
          sound:
            sound === 'default'
              ? true
              : sound,
          priority: androidPriority,
          ...(Platform.OS === 'android'
            ? { channelId }
            : {}),
        },
        trigger: null,
      },
    );
  }

  async sendLocalAlertNotification(
    alert: LocalAlertNotificationInput,
  ): Promise<void> {
    if (
      !this.notificationsEnabled ||
      !this.communityAlertsEnabled
    ) {
      return;
    }

    if (
      this.wasRecentlyNotified(alert.id)
    ) {
      return;
    }

    this.markNotified(alert.id);

    const title =
      alert.priority === 'CRITICAL'
        ? '🚨 Alerta CRÍTICO'
        : '🚨 Alerta próximo';

    const body = `${alert.title}\n${alert.distanceKm.toFixed(1)} km da sua localização`;

    await this.schedulePriorityNotification(
      title,
      body,
      alert.priority,
      alert.sound,
    );

    if (alert.priority === 'CRITICAL') {
      Vibration.vibrate([
        0,
        500,
        200,
        500,
        200,
        500,
      ]);
    } else if (alert.priority === 'HIGH') {
      Vibration.vibrate([
        0,
        250,
        150,
        250,
      ]);
    }

    console.log(
      'LOCAL_NOTIFICATION_SENT',
      {
        id: alert.id,
        title: alert.title,
        distanceKm: alert.distanceKm,
        priority: alert.priority,
      },
    );
  }

  startAlertPushNotifications(): void {
    if (!this.notificationsEnabled) {
      return;
    }

    if (
      this.pushChannel ||
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return;
    }

    void ensureAlertNotificationChannels();

    this.pushChannel = supabase
      .channel(PUSH_CHANNEL_NAME)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          console.log(
            'REALTIME_ALERT',
            payload,
          );

          void this.handleRealtimeAlert(
            payload as RealtimePostgresChangesPayload<AlertRealtimeRow>,
          );
        },
      )
      .subscribe();
  }

  stopAlertPushNotifications(): void {
    if (!this.pushChannel) {
      return;
    }

    this.pushChannel.unsubscribe();
    this.pushChannel = null;
  }

  private pruneNotifiedCache(): void {
    const now = Date.now();

    for (const [
      alertId,
      notifiedAt,
    ] of this.notifiedCache) {
      if (
        now - notifiedAt >=
        DEDUP_TTL_MS
      ) {
        this.notifiedCache.delete(
          alertId,
        );
      }
    }
  }

  private wasRecentlyNotified(
    alertId: string,
  ): boolean {
    this.pruneNotifiedCache();

    const notifiedAt =
      this.notifiedCache.get(alertId);

    if (!notifiedAt) {
      return false;
    }

    return (
      Date.now() - notifiedAt <
      DEDUP_TTL_MS
    );
  }

  private markNotified(
    alertId: string,
  ): void {
    this.notifiedCache.set(
      alertId,
      Date.now(),
    );
  }

  private async handleRealtimeAlert(
    payload: RealtimePostgresChangesPayload<AlertRealtimeRow>,
  ): Promise<void> {
    if (!this.communityAlertsEnabled) {
      return;
    }

    if (
      payload.eventType === 'DELETE'
    ) {
      return;
    }

    const row = parseAlertRow(payload);

    if (!row || row.resolved) {
      return;
    }

    if (
      !isNotifyAlertType(row.type)
    ) {
      return;
    }

    const alertType = row.type;
    const priority =
      resolveRowPriority(row);
    const config =
      buildAlertNotificationConfig(
        alertType,
      );
    const maxDistanceKm =
      resolveNotificationRadiusKm(
        alertType,
      );

    const profile =
      await profileService.loadAuthenticatedProfile();

    const relevance =
      calculateAlertRelevance(
        {
          id: row.id,
          type: alertType,
          title: row.title,
        },
        {
          tipoVeiculo:
            profile?.tipoVeiculo,
          tipoCarga:
            profile?.tipoCarga,
        },
      );

    if (
      !shouldSendPushForRelevance(
        relevance.priority,
      )
    ) {
      console.log(
        'PUSH_SKIPPED_LOW_PRIORITY',
        {
          alertId: row.id,
          type: alertType,
          priority:
            relevance.priority,
          reason: relevance.reason,
        },
      );

      return;
    }

    const trust = calculateAlertTrust({
      confirmations:
        row.total_confirmations ??
        row.confirmations ??
        0,
      rejections:
        row.total_rejections ?? 0,
    });

    if (
      !shouldSendPushForTrust(
        trust.trustLevel,
      )
    ) {
      console.log(
        'PUSH_SKIPPED_LOW_PRIORITY',
        {
          alertId: row.id,
          type: alertType,
          trustLevel: trust.trustLevel,
          trustScore: trust.trustScore,
          reason: 'low_trust',
        },
      );

      return;
    }

    const userLocation =
      locationService.getLastKnownLocation() ??
      (await locationService
        .getCurrentLocation()
        .catch(() => null));

    if (!userLocation) {
      return;
    }

    void locationSyncService
      .syncCoordinates(
        userLocation,
        'alert_received',
        true,
      )
      .catch(() => undefined);

    const distanceKm =
      locationService.calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        row.latitude,
        row.longitude,
      );

    console.log(
      'ALERT_DISTANCE_CALCULATED',
      {
        alertId: row.id,
        title: row.title,
        type: alertType,
        distanceKm,
        maxDistanceKm,
        priority,
      },
    );

    if (distanceKm > maxDistanceKm) {
      return;
    }

    await this.sendLocalAlertNotification({
      id: row.id,
      title: row.title,
      type: alertType,
      distanceKm,
      priority,
      sound:
        row.notification_sound ??
        config.sound,
    });
  }
}

export const notificationService =
  new NotificationService();

export async function registerForPushNotifications(): Promise<string | null> {
  return notificationService.registerForPushNotifications();
}

export async function sendLocalAlertNotification(
  alert: LocalAlertNotificationInput,
): Promise<void> {
  return notificationService.sendLocalAlertNotification(
    alert,
  );
}

export async function scheduleNotification(
  title: string,
  body: string,
  trigger?: Notifications.NotificationTriggerInput | null,
): Promise<string> {
  return notificationService.schedulePriorityNotification(
    title,
    body,
    'NORMAL',
    'default',
  );
}

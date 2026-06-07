import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

import type { AlertNotificationPriority } from '../types/alertNotification.types';

import {
  getAndroidChannelId,
} from './alertPriority.service';

import { ensureAlertNotificationChannels } from './alertNotificationChannels.service';

import { notificationService } from './notification.service';

type NotificationOptions = {
  highPriority?: boolean;
  priority?: AlertNotificationPriority;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationsService {
  private permissionsRequested = false;

  async requestPermissions(): Promise<boolean> {
    try {
      await ensureAlertNotificationChannels();

      const current =
        await Notifications.getPermissionsAsync();

      if (
        current.granted ||
        current.status === 'granted'
      ) {
        this.permissionsRequested = true;
        return true;
      }

      const requested =
        await Notifications.requestPermissionsAsync();

      this.permissionsRequested =
        requested.granted ||
        requested.status === 'granted';

      return this.permissionsRequested;
    } catch (error) {
      console.log(
        'Erro requestPermissions:',
        error,
      );

      return false;
    }
  }

  async showAlertNotification(
    title: string,
    body: string,
    options: NotificationOptions = {},
  ): Promise<void> {
    try {
      if (
        !notificationService.isNotificationsEnabled() ||
        !notificationService.isCommunityAlertsEnabled()
      ) {
        return;
      }

      if (!this.permissionsRequested) {
        const granted =
          await this.requestPermissions();

        if (!granted) {
          return;
        }
      }

      const priority =
        options.priority ??
        (options.highPriority
          ? 'CRITICAL'
          : 'HIGH');

      const channelId =
        getAndroidChannelId(priority);

      const androidPriority =
        priority === 'CRITICAL'
          ? Notifications.AndroidNotificationPriority.MAX
          : priority === 'HIGH'
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.DEFAULT;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: androidPriority,
          ...(Platform.OS === 'android'
            ? { channelId }
            : {}),
        },
        trigger: null,
      });
    } catch (error) {
      console.log(
        'Erro showAlertNotification:',
        error,
      );
    }
  }

  async initialize(): Promise<void> {
    await this.requestPermissions();
  }

  async send(
    title: string,
    body: string,
  ): Promise<void> {
    await this.showAlertNotification(
      title,
      body,
    );
  }
}

export const notificationsService =
  new NotificationsService();

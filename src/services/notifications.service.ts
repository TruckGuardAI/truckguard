import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

type NotificationOptions = {
  highPriority?: boolean;
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
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          'truckguard-alerts',
          {
            name: 'TruckGuard Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [
              0,
              250,
              250,
              250,
            ],
            sound: true,
          },
        );
      }

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
      if (!this.permissionsRequested) {
        const granted =
          await this.requestPermissions();

        if (!granted) {
          return;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: options.highPriority
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
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
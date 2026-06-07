import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

export async function ensureAlertNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    'truckguard-critical',
    {
      name: 'Alertas Críticos',
      importance:
        Notifications.AndroidImportance.MAX,
      vibrationPattern: [
        0,
        500,
        200,
        500,
        200,
        500,
      ],
      sound: 'default',
      bypassDnd: true,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    },
  );

  await Notifications.setNotificationChannelAsync(
    'truckguard-high',
    {
      name: 'Alertas Importantes',
      importance:
        Notifications.AndroidImportance.HIGH,
      vibrationPattern: [
        0,
        250,
        150,
        250,
      ],
      sound: 'default',
    },
  );

  await Notifications.setNotificationChannelAsync(
    'truckguard-normal',
    {
      name: 'Alertas',
      importance:
        Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      sound: 'default',
    },
  );

  await Notifications.setNotificationChannelAsync(
    'truckguard-alerts',
    {
      name: 'TruckGuard Alerts',
      importance:
        Notifications.AndroidImportance.MAX,
      vibrationPattern: [
        0,
        250,
        250,
        250,
      ],
      sound: 'default',
    },
  );
}

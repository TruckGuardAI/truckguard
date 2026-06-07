import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Alert } from 'react-native';

import { useTranslation } from 'react-i18next';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Notifications from 'expo-notifications';

import { useAuth } from './AuthContext';

import {
  notificationService,
} from '../services/notification.service';

import {
  notificationsService,
} from '../services/notifications.service';

import {
  profileSettingsService,
} from '../services/profileSettings.service';

const NOTIFICATIONS_STORAGE_KEY =
  'truckguard_notifications_enabled';

const COMMUNITY_ALERTS_STORAGE_KEY =
  'truckguard_community_alerts_enabled';

function parseStoredPreference(
  value: string | null,
): boolean | null {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return null;
}

type NotificationPreferencesContextValue = {
  notificationEnabled: boolean;
  communityAlertsEnabled: boolean;
  isReady: boolean;
  toggleNotifications: () => Promise<void>;
  toggleCommunityAlerts: () => Promise<void>;
};

const NotificationPreferencesContext =
  createContext<NotificationPreferencesContextValue | null>(
    null,
  );

export function NotificationPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { t } = useTranslation();

  const {
    session,
    loading: authLoading,
  } = useAuth();

  const [
    notificationEnabled,
    setNotificationEnabled,
  ] = useState(false);

  const [
    communityAlertsEnabled,
    setCommunityAlertsEnabled,
  ] = useState(true);

  const [
    isReady,
    setIsReady,
  ] = useState(false);

  const applyNotificationState = useCallback(
    async (enabled: boolean) => {
      notificationService.setNotificationsEnabled(
        enabled,
      );

      setNotificationEnabled(enabled);

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        enabled ? 'true' : 'false',
      );

      try {
        await profileSettingsService.saveNotificationsEnabled(
          enabled,
        );
      } catch (error) {
        console.log(
          'PROFILE_SETTINGS_SAVE_ERROR',
          error,
        );
      }
    },
    [],
  );

  const applyCommunityAlertsState = useCallback(
    async (enabled: boolean) => {
      notificationService.setCommunityAlertsEnabled(
        enabled,
      );

      setCommunityAlertsEnabled(enabled);

      await AsyncStorage.setItem(
        COMMUNITY_ALERTS_STORAGE_KEY,
        enabled ? 'true' : 'false',
      );

      try {
        await profileSettingsService.saveCommunityAlertsEnabled(
          enabled,
        );
      } catch (error) {
        console.log(
          'PROFILE_SETTINGS_SAVE_ERROR',
          error,
        );
      }
    },
    [],
  );

  const enableNotifications = useCallback(
    async (): Promise<boolean> => {
      const granted =
        await notificationsService.requestPermissions();

      if (!granted) {
        Alert.alert(
          t('common.attention'),
          t('notifications.permissionDenied'),
        );

        return false;
      }

      await applyNotificationState(true);

      await notificationService.registerForPushNotifications();

      notificationService.startAlertPushNotifications();

      return true;
    },
    [applyNotificationState, t],
  );

  const disableNotifications = useCallback(
    async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.dismissAllNotificationsAsync();

      notificationService.stopAlertPushNotifications();

      await applyNotificationState(false);
    },
    [applyNotificationState],
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let mounted = true;

    async function loadPreferences() {
      try {
        const [
          storedNotifications,
          storedCommunity,
        ] = await Promise.all([
          AsyncStorage.getItem(
            NOTIFICATIONS_STORAGE_KEY,
          ),
          AsyncStorage.getItem(
            COMMUNITY_ALERTS_STORAGE_KEY,
          ),
        ]);

        let notificationsOn =
          parseStoredPreference(
            storedNotifications,
          ) ?? true;

        let communityOn =
          parseStoredPreference(
            storedCommunity,
          ) ?? true;

        if (session?.user?.id) {
          try {
            const remoteSettings =
              await profileSettingsService.getProfileSettings(
                session.user.id,
              );

            if (remoteSettings) {
              notificationsOn =
                remoteSettings.notificationsEnabled;

              communityOn =
                remoteSettings.communityAlertsEnabled;
            }
          } catch (error) {
            console.log(
              'PROFILE_SETTINGS_LOAD_ERROR',
              error,
            );
          }
        }

        if (!mounted) {
          return;
        }

        notificationService.setNotificationsEnabled(
          notificationsOn,
        );

        notificationService.setCommunityAlertsEnabled(
          communityOn,
        );

        setNotificationEnabled(notificationsOn);
        setCommunityAlertsEnabled(communityOn);

        if (notificationsOn) {
          const permissions =
            await Notifications.getPermissionsAsync();

          const granted =
            permissions.granted ||
            permissions.status === 'granted';

          if (granted) {
            await notificationService.registerForPushNotifications();

            notificationService.startAlertPushNotifications();
          }
        } else {
          notificationService.stopAlertPushNotifications();
        }

        await Promise.all([
          AsyncStorage.setItem(
            NOTIFICATIONS_STORAGE_KEY,
            notificationsOn ? 'true' : 'false',
          ),
          AsyncStorage.setItem(
            COMMUNITY_ALERTS_STORAGE_KEY,
            communityOn ? 'true' : 'false',
          ),
        ]);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadPreferences();

    return () => {
      mounted = false;
    };
  }, [
    authLoading,
    session?.user?.id,
  ]);

  const toggleNotifications = useCallback(
    async () => {
      if (notificationEnabled) {
        await disableNotifications();
        return;
      }

      await enableNotifications();
    },
    [
      notificationEnabled,
      disableNotifications,
      enableNotifications,
    ],
  );

  const toggleCommunityAlerts = useCallback(
    async () => {
      await applyCommunityAlertsState(
        !communityAlertsEnabled,
      );
    },
    [
      communityAlertsEnabled,
      applyCommunityAlertsState,
    ],
  );

  const value = useMemo(
    () => ({
      notificationEnabled,
      communityAlertsEnabled,
      isReady,
      toggleNotifications,
      toggleCommunityAlerts,
    }),
    [
      notificationEnabled,
      communityAlertsEnabled,
      isReady,
      toggleNotifications,
      toggleCommunityAlerts,
    ],
  );

  return (
    <NotificationPreferencesContext.Provider
      value={value}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences(): NotificationPreferencesContextValue {
  const context = useContext(
    NotificationPreferencesContext,
  );

  if (!context) {
    throw new Error(
      'useNotificationPreferences deve ser usado dentro de NotificationPreferencesProvider',
    );
  }

  return context;
}

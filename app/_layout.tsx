import React from 'react';

import { Stack } from 'expo-router';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import '../src/i18n';

import {
  LanguageProvider,
} from '../src/context/LanguageContext';

import {
  ThemeProvider,
  useTheme,
} from '../src/context/ThemeContext';

import { ThemeRoot } from '../src/components/theme/ThemeRoot';

import {
  ToastProvider,
} from '../src/context/ToastContext';

import {
  AuthProvider,
} from '../src/context/AuthContext';

import {
  LocationSyncProvider,
} from '../src/context/LocationSyncContext';

import {
  NotificationPreferencesProvider,
} from '../src/context/NotificationPreferencesContext';

export default function RootLayout() {
  return (

    <SafeAreaProvider>

      <LanguageProvider>

      <ThemeProvider>

        <ThemeRoot>

          <AuthProvider>

            <LocationSyncProvider>

            <NotificationPreferencesProvider>

              <ToastProvider>

                <ThemedStack />

              </ToastProvider>

            </NotificationPreferencesProvider>

            </LocationSyncProvider>

          </AuthProvider>

        </ThemeRoot>

      </ThemeProvider>

      </LanguageProvider>

    </SafeAreaProvider>

  );

}

function ThemedStack() {
  const { theme } = useTheme();

  return (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor:
                  theme.navigation.background,
              },
            }}
          >

            <Stack.Screen
              name="index"
            />

            <Stack.Screen
              name="onboarding"
            />

            <Stack.Screen
              name="login"
            />

            <Stack.Screen
              name="login-callback"
            />

            <Stack.Screen
              name="register"
            />

            <Stack.Screen
              name="(tabs)"
            />

            <Stack.Screen
              name="create-alert"
            />

            <Stack.Screen
              name="report-alert"
            />

            <Stack.Screen
              name="sos"
            />

            <Stack.Screen
              name="sensors"
            />

          </Stack>
  );
}
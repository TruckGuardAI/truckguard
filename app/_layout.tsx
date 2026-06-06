import React, {
  useEffect,
} from 'react';

import { Stack } from 'expo-router';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  ToastProvider,
} from '../src/context/ToastContext';

import {
  AuthProvider,
} from '../src/context/AuthContext';

import {
  notificationsService,
} from '../src/services/notifications.service';

export default function RootLayout() {

  useEffect(() => {
    void notificationsService.initialize();
  }, []);

  return (

    <SafeAreaProvider>

      <AuthProvider>

        <ToastProvider>

          <Stack
            screenOptions={{
              headerShown: false,
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
              name="register"
            />

            <Stack.Screen
              name="(tabs)"
            />

            <Stack.Screen
              name="create-alert"
            />

            <Stack.Screen
              name="sensors"
            />

          </Stack>

        </ToastProvider>

      </AuthProvider>

    </SafeAreaProvider>

  );

}
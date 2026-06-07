import React from 'react';

import { Stack } from 'expo-router';

export default function ProfileLayout():
React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="devices" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="support" />
    </Stack>
  );
}

import React from 'react';

import { StatusBar } from 'expo-status-bar';

import {
  ActivityIndicator,
  View,
} from 'react-native';

import { useTheme } from '../../context/ThemeContext';

export function ThemeRoot({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const {
    theme,
    isReady,
  } = useTheme();

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor:
            theme.navigation.background,
        }}
      >
        <ActivityIndicator
          color={theme.navigation.primary}
          size="large"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        style={theme.statusBarStyle}
      />
      {children}
    </>
  );
}

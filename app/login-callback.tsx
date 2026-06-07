import React, {
  useEffect,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import { useTheme } from '../src/context/ThemeContext';
import { useThemedStyles } from '../src/hooks/useThemedStyles';

import { supabase } from '../src/lib/supabase';

import type { AppThemeTokens } from '../src/theme/palettes';

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });
}

export default function LoginCallbackScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    async function handleCallback() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log(
        'AUTH_SESSION_AFTER_GOOGLE',
        session,
      );

      router.replace(
        session
          ? '/(tabs)'
          : '/login',
      );
    }

    void handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator
        color={theme.colors.primary}
        size="large"
      />
    </View>
  );
}

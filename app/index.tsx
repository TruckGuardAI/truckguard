import React, {
  useEffect,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import {
  router,
} from 'expo-router';

import GradientBackground from '../components/ui/GradientBackground';

import { TruxafeLogo } from '../src/components/branding/TruxafeLogo';

import {
  useAuth,
} from '../src/context/AuthContext';

import { useTheme } from '../src/context/ThemeContext';

import { useThemedStyles } from '../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../src/theme/palettes';

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loading: {
      marginTop: 24,
      color: colors.primary,
      fontSize: 14,
    },

    spinnerWrap: {
      marginTop: 20,
      transform: [{ scale: 1.3 }],
    },
  });
}

export default function SplashScreen() {
  const { t } = useTranslation();

  const {
    session,
    loading,
  } = useAuth();

  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (session) {
      router.replace('/(tabs)');

      return;
    }

    router.replace('/login');

  }, [
    loading,
    session,
  ]);

  return (

    <GradientBackground>

      <View style={styles.container}>

        <TruxafeLogo
          size="splash"
          centered
        />

        <Text style={styles.loading}>
          {t('splash.restoringSession')}
        </Text>

        {loading ? (
          <View style={styles.spinnerWrap}>
            <ActivityIndicator
              color={theme.colors.primary}
            />
          </View>
        ) : null}

      </View>

    </GradientBackground>

  );

}

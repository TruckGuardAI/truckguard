import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {
  router,
} from 'expo-router';

import GradientBackground from '../components/ui/GradientBackground';

import { useThemedStyles } from '../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../src/theme/palettes';

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 30,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: '800',
      marginBottom: 20,
    },

    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 40,
    },

    button: {
      backgroundColor: components.buttonPrimaryBg,
      paddingVertical: 18,
      borderRadius: 14,
      alignItems: 'center',
    },

    buttonText: {
      color: components.buttonPrimaryText,
      fontWeight: '700',
      fontSize: 16,
    },
  });
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  function handleStart() {
    router.replace('/login');
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>
          {t('onboarding.title')}
        </Text>

        <Text style={styles.subtitle}>
          {t('onboarding.subtitle')}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>
            {t('onboarding.start')}
          </Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import GradientBackground from '../../../components/ui/GradientBackground';

import ProfileBackHeader from '../../components/profile/ProfileBackHeader';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 120,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
    },

    cardTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 14,
    },

    text: {
      color: colors.textSecondary,
      fontSize: 15,
      marginBottom: 10,
      lineHeight: 22,
    },
  });
}

export default function SupportScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <ProfileBackHeader title={t('support.title')} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('support.contact')}
          </Text>

          <Text style={styles.text}>
            {t('support.email')}
          </Text>

          <Text style={styles.text}>
            {t('support.hours')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('support.quickHelp')}
          </Text>

          <Text style={styles.text}>
            {t('support.helpProfile')}
          </Text>

          <Text style={styles.text}>
            {t('support.helpBluetooth')}
          </Text>

          <Text style={styles.text}>
            {t('support.helpRadar')}
          </Text>

          <Text style={styles.text}>
            {t('support.helpSos')}
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';

import GradientBackground from '../../components/ui/GradientBackground';

import { useTheme } from '../../src/context/ThemeContext';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      paddingTop: 60,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 36,
      fontWeight: '900',
      marginBottom: 10,
    },

    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      marginBottom: 34,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 28,
      padding: 24,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.border,
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    cardTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
    },

    cardText: {
      color: colors.textSecondary,
      fontSize: 15,
      maxWidth: 220,
      lineHeight: 24,
    },

    infoCard: {
      backgroundColor: colors.glass.fill,
      borderRadius: 30,
      padding: 28,
      marginTop: 10,
      marginBottom: 50,
      borderWidth: 1,
      borderColor: colors.primaryMuted,
    },

    infoTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      marginBottom: 16,
    },

    infoText: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 30,
    },
  });
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {t('settings.title')}
        </Text>

        <Text style={styles.subtitle}>
          {t('settings.subtitle')}
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                {t('settings.smartMonitoring')}
              </Text>

              <Text style={styles.cardText}>
                {t('settings.smartMonitoringDesc')}
              </Text>
            </View>

            <Switch
              value
              trackColor={{
                false:
                  theme.components.inputBackground,
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                {t('settings.realtimeAlerts')}
              </Text>

              <Text style={styles.cardText}>
                {t('settings.realtimeAlertsDesc')}
              </Text>
            </View>

            <Switch
              value
              trackColor={{
                false:
                  theme.components.inputBackground,
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                {t('settings.shareLocation')}
              </Text>

              <Text style={styles.cardText}>
                {t('settings.shareLocationDesc')}
              </Text>
            </View>

            <Switch
              value={false}
              trackColor={{
                false:
                  theme.components.inputBackground,
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                {t('settings.convoyMode')}
              </Text>

              <Text style={styles.cardText}>
                {t('settings.convoyModeDesc')}
              </Text>
            </View>

            <Switch
              value
              trackColor={{
                false:
                  theme.components.inputBackground,
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {t('settings.enterpriseTitle')}
          </Text>

          <Text style={styles.infoText}>
            {t('settings.enterpriseDesc')}
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

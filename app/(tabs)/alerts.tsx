import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
      padding: 22,
      marginBottom: 22,
      borderLeftWidth: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconWrapper: {
      width: 64,
      height: 64,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 18,
    },

    icon: {
      fontSize: 30,
    },

    content: {
      flex: 1,
    },

    cardTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 8,
    },

    location: {
      color: colors.textSecondary,
      fontSize: 17,
      marginBottom: 8,
    },

    time: {
      color: colors.textMuted,
      fontSize: 15,
    },
  });
}

export default function AlertsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const alerts = useMemo(
    () => [
      {
        id: 1,
        type: t('alertsScreen.theftReported'),
        location: 'BR-116 • Km 220',
        time: t('alertsScreen.minutesAgo', { count: 2 }),
        color: theme.colors.danger,
        icon: '🚨',
      },
      {
        id: 2,
        type: t('alertsScreen.dangerousArea'),
        location: 'Posto abandonado',
        time: t('alertsScreen.minutesAgo', { count: 12 }),
        color: theme.colors.warning,
        icon: '⚠️',
      },
      {
        id: 3,
        type: t('alertsScreen.safeArea'),
        location: 'Pátio monitorado',
        time: t('alertsScreen.minutesAgo', { count: 20 }),
        color: theme.colors.success,
        icon: '🛡️',
      },
    ],
    [t, theme.colors.danger, theme.colors.warning, theme.colors.success],
  );

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {t('alertsScreen.title')}
        </Text>

        <Text style={styles.subtitle}>
          {t('alertsScreen.subtitle')}
        </Text>

        {alerts.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.card,
              {
                borderLeftColor:
                  alert.color,
              },
            ]}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor:
                      alert.color,
                  },
                ]}
              >
                <Text style={styles.icon}>
                  {alert.icon}
                </Text>
              </View>

              <View style={styles.content}>
                <Text style={styles.cardTitle}>
                  {alert.type}
                </Text>

                <Text style={styles.location}>
                  {alert.location}
                </Text>

                <Text style={styles.time}>
                  {alert.time}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}

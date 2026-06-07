import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../../src/context/ThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type RadarCardProps = {
  title: string;
  description: string;
  distance: string;
  severity?: 'low' | 'medium' | 'high';
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
    },

    indicator: {
      width: 12,
      height: 12,
      borderRadius: 999,
      marginTop: 6,
      marginRight: 14,
    },

    content: {
      flex: 1,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
      marginRight: 12,
    },

    distance: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },

    description: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
  });
}

export default function RadarCard({
  title,
  description,
  distance,
  severity = 'low',
}: RadarCardProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  function getSeverityColor() {
    try {
      switch (severity) {
        case 'high':
          return theme.colors.danger;

        case 'medium':
          return theme.colors.warning;

        case 'low':
        default:
          return theme.colors.success;
      }
    } catch (error) {
      console.error('Erro severity:', error);
      return theme.colors.success;
    }
  }

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: getSeverityColor(),
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.distance}>
            {distance}
          </Text>
        </View>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>
    </View>
  );
}

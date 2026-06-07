import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../../src/context/ThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type StatusCardProps = {
  title: string;
  value: string;
  color?: string;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    indicator: {
      width: 12,
      height: 12,
      borderRadius: 999,
      marginBottom: 18,
    },

    value: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 6,
    },

    title: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
    },
  });
}

export default function StatusCard({
  title,
  value,
  color,
}: StatusCardProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const indicatorColor = color ?? theme.colors.primary;

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: indicatorColor,
          },
        ]}
      />

      <Text style={styles.value}>
        {value}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

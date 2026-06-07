import React from 'react';

import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type FilterButtonProps = {
  title: string;
  active?: boolean;
  onPress: () => void;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    button: {
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 14,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },

    activeButton: {
      backgroundColor: colors.primary,
    },

    text: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },

    activeText: {
      color: colors.textPrimary,
    },
  });
}

export default function FilterButton({
  title,
  active = false,
  onPress,
}: FilterButtonProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        active && styles.activeButton,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          active && styles.activeText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type { RadarViewMode } from '../../src/types/alert.types';

const VIEW_OPTIONS: {
  filterKey: 'nearby' | 'onRoute' | 'all';
  value: RadarViewMode;
}[] = [
  { filterKey: 'nearby', value: 'nearby' },
  { filterKey: 'onRoute', value: 'route' },
  { filterKey: 'all', value: 'all' },
];

type Props = {
  selected: RadarViewMode;
  onChange: (value: RadarViewMode) => void;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },

    chip: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },

    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryMuted,
    },

    chipPressed: {
      opacity: 0.88,
    },

    chipText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },

    chipTextActive: {
      color: colors.textPrimary,
    },
  });
}

export default function RadarViewFilter({
  selected,
  onChange,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {VIEW_OPTIONS.map((option) => {
        const isActive = selected === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
              ]}
            >
              {t(`radar.filters.${option.filterKey}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

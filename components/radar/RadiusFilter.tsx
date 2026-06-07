import React, { useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import {
  getRadiusFilterOptions,
  type RadiusFilterKm,
} from '../../src/utils/alertRadar.utils';

type Props = {
  selected: RadiusFilterKm;
  onChange: (value: RadiusFilterKm) => void;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },

    chip: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },

    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryMuted,
    },

    chipPressed: {
      opacity: 0.85,
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

export default function RadiusFilter({
  selected,
  onChange,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const options = useMemo(
    () => getRadiusFilterOptions(t),
    [t],
  );

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = selected === option.value;

        return (
          <Pressable
            key={option.label}
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
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

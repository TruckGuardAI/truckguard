import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type Props = {
  onPress: () => void;
};

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    container: {
      position: 'absolute',
      right: 20,
      bottom: 90,
      zIndex: 999999,
      elevation: 999,
      pointerEvents: 'box-none',
    },

    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 30,
      minWidth: 150,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },

    text: {
      color: components.buttonPrimaryText,
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
}

export default function CreateAlertButton({
  onPress,
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.button}
      >
        <Text style={styles.text}>
          {t('manualAlert.reportButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

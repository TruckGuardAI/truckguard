import React from 'react';

import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type SOSButtonProps = {
  latitude?: number;
  longitude?: number;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    button: {
      width: '100%',
      height: 88,
      backgroundColor: colors.danger,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
      shadowColor: colors.danger,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 12,
    },

    sos: {
      color: theme.components.buttonPrimaryText,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: 3,
    },

    text: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 4,
      opacity: 0.85,
    },
  });
}

export default function SOSButton({
  latitude,
  longitude,
}: SOSButtonProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  async function handleSOS() {
    try {
      Alert.alert(
        t('sos.activated'),
        t('sos.locationSent', {
          lat: latitude,
          lng: longitude,
        }),
      );

      console.log('SOS enviado');
    } catch (error) {
      console.error(error);

      Alert.alert(
        t('common.error'),
        t('sos.sendFailed'),
      );
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSOS}
      activeOpacity={0.8}
    >
      <Text style={styles.sos}>
        {t('sos.title')}
      </Text>

      <Text style={styles.text}>
        {t('sos.emergency')}
      </Text>
    </TouchableOpacity>
  );
}

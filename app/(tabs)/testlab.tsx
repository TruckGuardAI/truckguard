import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import {
  securityService,
  type SensorType,
} from '../../src/services/security.service';

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },

    title: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: 50,
    },

    status: {
      color: colors.textPrimary,
      marginTop: 20,
      fontSize: 20,
    },

    event: {
      color: colors.primary,
      marginTop: 10,
      marginBottom: 30,
    },

    button: {
      padding: 15,
      backgroundColor: colors.card,
      borderRadius: 15,
      marginBottom: 15,
    },

    buttonText: {
      color: colors.textPrimary,
    },

    alertButton: {
      padding: 15,
      backgroundColor: colors.danger,
      borderRadius: 15,
      marginBottom: 15,
      alignItems: 'center',
    },

    alertButtonText: {
      color: theme.components.buttonPrimaryText,
    },

    reset: {
      padding: 15,
      backgroundColor: colors.textMuted,
      borderRadius: 15,
      alignItems: 'center',
    },

    resetText: {
      color: colors.textPrimary,
    },
  });
}

export default function TestLab() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const [
    state,
    setState,
  ] = useState(
    securityService.getState(),
  );

  async function simulate(sensor: SensorType) {
    const data =
      await securityService.simulateEvent(
        sensor,
      );

    setState({ ...data });
  }

  function reset() {
    const data = securityService.reset();
    setState({ ...data });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('testlab.title')}
      </Text>

      <Text style={styles.status}>
        {t('testlab.siren')}
        {state.alarm ? t('testlab.on') : t('testlab.off')}
      </Text>

      <Text style={styles.event}>
        {state.lastEvent || t('testlab.noEvents')}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          void simulate('tankLeft');
        }}
      >
        <Text style={styles.buttonText}>
          {t('testlab.simulateTankLeft')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          void simulate('tankRight');
        }}
      >
        <Text style={styles.buttonText}>
          {t('testlab.simulateTankRight')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          void simulate('palletLeft');
        }}
      >
        <Text style={styles.buttonText}>
          {t('testlab.simulatePalletLeft')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          void simulate('palletRight');
        }}
      >
        <Text style={styles.buttonText}>
          {t('testlab.simulatePalletRight')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.alertButton}
        onPress={() => {
          void simulate('all');
        }}
      >
        <Text style={styles.alertButtonText}>
          {t('testlab.fullAttack')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reset}
        onPress={reset}
      >
        <Text style={styles.resetText}>
          {t('testlab.reset')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

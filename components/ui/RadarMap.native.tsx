import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type { RadarMapProps } from './RadarMap.types';

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    wrap: {
      height: 260,
      borderRadius: 24,
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },

    location: {
      color: colors.textSecondary,
      marginBottom: 4,
    },

    counter: {
      color: colors.primary,
      fontWeight: '700',
      marginTop: 8,
      marginBottom: 12,
    },

    list: {
      flex: 1,
    },

    alertCard: {
      backgroundColor: colors.surfaceSecondary,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },

    alertTitle: {
      color: colors.textPrimary,
      fontWeight: '600',
    },

    alertCoords: {
      color: colors.textMuted,
      marginTop: 4,
      fontSize: 12,
    },
  });
}

export default function RadarMap({
  latitude,
  longitude,
  alerts,
}: RadarMapProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {t('radar.communityRadar')}
      </Text>

      <Text style={styles.location}>
        {t('radar.latitude')} {latitude.toFixed(6)}
      </Text>

      <Text style={styles.location}>
        {t('radar.longitude')} {longitude.toFixed(6)}
      </Text>

      <Text style={styles.counter}>
        {t('radar.alerts')} {alerts.length}
      </Text>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {alerts.map((item) => (
          <View
            key={String(item.id)}
            style={styles.alertCard}
          >
            <Text style={styles.alertTitle}>
              {item.title}
            </Text>

            <Text style={styles.alertCoords}>
              {item.latitude.toFixed(5)} ,
              {' '}
              {item.longitude.toFixed(5)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

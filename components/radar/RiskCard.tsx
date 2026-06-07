import React, { useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type { AreaRiskResult } from '../../src/types/risk.types';

type Props = {
  areaRisk: AreaRiskResult;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 2,
      padding: 16,
      marginBottom: 12,
    },

    zoneLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 12,
    },

    riskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    riskLabel: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
      marginRight: 8,
    },

    riskValue: {
      fontSize: 18,
      fontWeight: '800',
    },

    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },

    scoreLabel: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
      marginRight: 8,
    },

    scoreValue: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '700',
    },

    reasonsTitle: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 8,
    },

    reasonItem: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 4,
    },
  });
}

export default function RiskCard({
  areaRisk,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { display, score, reasons } = areaRisk;

  const reasonLines = useMemo(
    () =>
      reasons.length > 0
        ? reasons
        : [
            {
              id: 'none',
              text: t('radar.noRiskFactors'),
            },
          ],
    [reasons, t],
  );

  return (
    <View
      style={[
        styles.card,
        { borderColor: display.color },
      ]}
    >
      <Text style={styles.zoneLabel}>
        {t('radar.currentZone')}
      </Text>

      <View style={styles.riskRow}>
        <Text style={styles.riskLabel}>
          {t('radar.risk')}
        </Text>
        <Text
          style={[
            styles.riskValue,
            { color: display.color },
          ]}
        >
          {display.emoji} {display.label}
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>
          {t('radar.scoreLabel')}
        </Text>
        <Text style={styles.scoreValue}>
          {t('radar.scoreOf100', { score })}
        </Text>
      </View>

      <Text style={styles.reasonsTitle}>
        {t('radar.mainReasons')}
      </Text>

      {reasonLines.map((reason) => (
        <Text key={reason.id} style={styles.reasonItem}>
          • {reason.text}
        </Text>
      ))}
    </View>
  );
}

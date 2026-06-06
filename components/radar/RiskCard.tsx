import React, { useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import type { AreaRiskResult } from '../../src/types/risk.types';

type Props = {
  areaRisk: AreaRiskResult;
};

export default function RiskCard({
  areaRisk,
}: Props): React.ReactElement {
  const { display, score, reasons } = areaRisk;

  const reasonLines = useMemo(
    () =>
      reasons.length > 0
        ? reasons
        : [
            {
              id: 'none',
              text: 'Sem fatores de risco relevantes',
            },
          ],
    [reasons],
  );

  return (
    <View
      style={[
        styles.card,
        { borderColor: display.color },
      ]}
    >
      <Text style={styles.zoneLabel}>⚠️ Zona atual</Text>

      <View style={styles.riskRow}>
        <Text style={styles.riskLabel}>Risco:</Text>
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
        <Text style={styles.scoreLabel}>Pontuação:</Text>
        <Text style={styles.scoreValue}>
          {score}/100
        </Text>
      </View>

      <Text style={styles.reasonsTitle}>
        Principais motivos:
      </Text>

      {reasonLines.map((reason) => (
        <Text key={reason.id} style={styles.reasonItem}>
          • {reason.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },

  zoneLabel: {
    color: '#f8fafc',
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
    color: '#94a3b8',
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
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },

  scoreValue: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },

  reasonsTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },

  reasonItem: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});

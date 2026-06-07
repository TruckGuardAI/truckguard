import React from 'react';

import {
  Text,
  StyleSheet,
} from 'react-native';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import {
  formatTrustLabel,
  type AlertTrustLevel,
} from '../../services/alertTrust.service';

type AlertTrustBadgeProps = {
  trustLevel: AlertTrustLevel;
  style?: object;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
  });
}

export default function AlertTrustBadge({
  trustLevel,
  style,
}: AlertTrustBadgeProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Text
      style={[styles.label, style]}
    >
      {formatTrustLabel(trustLevel)}
    </Text>
  );
}

import React from 'react';

import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import {
  useRouter,
} from 'expo-router';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

type Props = {
  title: string;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    backRow: {
      marginBottom: 20,
    },

    backText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
    },
  });
}

export default function ProfileBackHeader({
  title,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity
      style={styles.backRow}
      onPress={() => router.back()}
      activeOpacity={0.8}
    >
      <Text style={styles.backText}>
        {t('profile.back')}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

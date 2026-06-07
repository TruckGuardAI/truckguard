import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import type { UserReputation } from '../../types/reputation.types';

import ProfileReputationBadge from './ProfileReputationBadge';

type ProfileReputationCardProps = {
  reputation: UserReputation;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },

    badgeWrap: {
      marginBottom: 16,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    statItem: {
      flexGrow: 1,
      minWidth: '30%',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
    },

    statValue: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
    },

    statLabel: {
      color: colors.textMuted,
      fontSize: 11,
      textAlign: 'center',
    },
  });
}

export default function ProfileReputationCard({
  reputation,
}: ProfileReputationCardProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.badgeWrap}>
        <ProfileReputationBadge
          reputationScore={
            reputation.reputationScore
          }
          trustLevel={
            reputation.trustLevel
          }
          context="profile_card"
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {reputation.alertsCreated}
          </Text>
          <Text style={styles.statLabel}>
            {t('reputation.stats.created')}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {reputation.alertsConfirmed}
          </Text>
          <Text style={styles.statLabel}>
            {t('reputation.stats.confirmed')}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {reputation.alertsRejected}
          </Text>
          <Text style={styles.statLabel}>
            {t('reputation.stats.rejected')}
          </Text>
        </View>
      </View>
    </View>
  );
}

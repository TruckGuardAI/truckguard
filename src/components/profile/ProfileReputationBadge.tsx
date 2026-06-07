import React, {
  useEffect,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import type { UserTrustLevel } from '../../types/reputation.types';

import {
  getReputationBadgeVisual,
} from '../../utils/reputationVisual.utils';

export type ProfileReputationBadgeProps = {
  reputationScore: number;
  trustLevel: UserTrustLevel;
  compact?: boolean;
  context?: string;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 2,
    },

    containerCompact: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },

    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    levelText: {
      fontSize: 14,
      fontWeight: '800',
    },

    levelTextCompact: {
      fontSize: 12,
    },

    scoreText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },

    scoreTextCompact: {
      fontSize: 11,
    },
  });
}

export default function ProfileReputationBadge({
  reputationScore,
  trustLevel,
  compact = false,
  context = 'unknown',
}: ProfileReputationBadgeProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const visual = getReputationBadgeVisual(
    trustLevel,
  );

  useEffect(() => {
    console.log(
      'LOG_REPUTATION_BADGE_RENDER',
      {
        context,
        reputationScore,
        trustLevel,
        compact,
      },
    );
  }, [
    context,
    reputationScore,
    trustLevel,
    compact,
  ]);

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          backgroundColor:
            visual.backgroundColor,
          borderColor:
            visual.borderColor,
        },
      ]}
    >
      <View style={styles.levelRow}>
        <Text>{visual.emoji}</Text>
        <Text
          style={[
            styles.levelText,
            compact &&
              styles.levelTextCompact,
            {
              color: visual.textColor,
            },
          ]}
        >
          {t(
            `reputation.levels.${trustLevel}`,
          )}
        </Text>
      </View>

      <Text
        style={[
          styles.scoreText,
          compact &&
            styles.scoreTextCompact,
        ]}
      >
        {t('reputation.badgeScore', {
          score: reputationScore,
        })}
      </Text>
    </View>
  );
}

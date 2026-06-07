import React, {
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useTheme } from '../../context/ThemeContext';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import {
  voteService,
  type AlertVotesSummary,
} from '../../services/vote.service';

import {
  isVoteAuthError,
} from '../../utils/voteError.utils';

import ProfileReputationBadge from '../profile/ProfileReputationBadge';

import type { UserTrustLevel } from '../../types/reputation.types';

type AlertVoteButtonsProps = {
  alertId: string;
  positiveVotes: number;
  negativeVotes: number;
  onVoted?: (
    summary: AlertVotesSummary,
  ) => void;
  creatorReputationScore?: number;
  creatorTrustLevel?: UserTrustLevel;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      marginTop: 10,
    },

    feedbackLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    creatorWrap: {
      marginBottom: 10,
      gap: 6,
    },

    creatorLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },

    counts: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 8,
    },

    actions: {
      flexDirection: 'row',
      gap: 8,
    },

    button: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
    },

    confirmButton: {
      backgroundColor: colors.success,
    },

    rejectButton: {
      backgroundColor: colors.surfaceSecondary,
    },

    buttonText: {
      color: theme.components.buttonPrimaryText,
      fontSize: 13,
      fontWeight: '700',
    },
  });
}

export default function AlertVoteButtons({
  alertId,
  positiveVotes,
  negativeVotes,
  onVoted,
  creatorReputationScore,
  creatorTrustLevel,
}: AlertVoteButtonsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    localPositiveVotes,
    setLocalPositiveVotes,
  ] = useState(positiveVotes);

  const [
    localNegativeVotes,
    setLocalNegativeVotes,
  ] = useState(negativeVotes);

  const [
    voting,
    setVoting,
  ] = useState(false);

  async function handleVote(
    voteType: 'confirm' | 'reject',
  ): Promise<void> {
    if (voting) {
      return;
    }

    console.log(
      voteType === 'confirm'
        ? 'LOG_CONFIRM_BUTTON_PRESS'
        : 'LOG_REJECT_BUTTON_PRESS',
      {
        alertId,
        voteType,
      },
    );

    console.log('LOG_VOTE_START', {
      alertId,
      voteType,
    });

    setVoting(true);

    try {
      const summary =
        await voteService.voteAlert(
          alertId,
          voteType,
        );

      setLocalPositiveVotes(
        summary.totalConfirmations,
      );
      setLocalNegativeVotes(
        summary.totalRejections,
      );

      onVoted?.(summary);
    } catch (error) {
      if (isVoteAuthError(error)) {
        Alert.alert(
          t('vote.loginRequiredTitle'),
          t('vote.loginRequired'),
        );

        return;
      }

      Alert.alert(
        t('common.error'),
        t('vote.failed'),
      );
    } finally {
      setVoting(false);
    }
  }

  const showCreatorBadge =
    typeof creatorReputationScore ===
      'number' &&
    creatorTrustLevel !== undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.feedbackLabel}>
        {t('reputation.alertFeedback')}
      </Text>

      {showCreatorBadge ? (
        <View style={styles.creatorWrap}>
          <Text style={styles.creatorLabel}>
            {t('reputation.creator')}
          </Text>

          <ProfileReputationBadge
            reputationScore={
              creatorReputationScore
            }
            trustLevel={
              creatorTrustLevel
            }
            compact
            context="alert_comments"
          />
        </View>
      ) : null}

      <Text style={styles.counts}>
        👍 {localPositiveVotes}
        {'  '}
        👎 {localNegativeVotes}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
          ]}
          onPress={() => {
            void handleVote('confirm');
          }}
          disabled={voting}
          activeOpacity={0.85}
        >
          {voting ? (
            <ActivityIndicator
              color={
                theme.components.buttonPrimaryText
              }
              size="small"
            />
          ) : (
            <Text
              style={
                styles.buttonText
              }
            >
              {t('vote.confirm')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.rejectButton,
          ]}
          onPress={() => {
            void handleVote('reject');
          }}
          disabled={voting}
          activeOpacity={0.85}
        >
          <Text
            style={styles.buttonText}
          >
            {t('vote.reject')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

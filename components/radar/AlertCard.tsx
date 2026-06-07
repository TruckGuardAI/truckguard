import React from 'react';

import {
  Button,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import AlertCommentsSection from '../../src/components/alerts/AlertCommentsSection';

import AlertVoteButtons from '../../src/components/alerts/AlertVoteButtons';

import {
  useCreatorReputations,
} from '../../src/hooks/useCreatorReputations';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import { navigationService } from '../../src/services/navigation.service';

import type { AlertVotesSummary } from '../../src/services/vote.service';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type {
  Alert,
  AlertAlongRoute,
  AlertType,
} from '../../src/types/alert.types';

type Props = {
  alert: Alert | AlertAlongRoute | null;
  showAheadDistance?: boolean;
  onClose?: () => void;
  onVoted?: (
    summary: AlertVotesSummary,
  ) => void;
};

function isAlongRoute(
  alert: Alert | AlertAlongRoute,
): alert is AlertAlongRoute {
  return 'distanceAheadKm' in alert;
}

const TYPE_EMOJI: Record<AlertType, string> = {
  fuel: '⛽',
  pallet: '📦',
  full_attack: '🚨',
  cargo_theft: '📦',
  cabin_attack: '🚗',
  obstacle: '🚧',
  mechanic: '🔧',
  rest: '🛌',
  sos: '🆘',
};

function getAlertTypeLabel(
  type: AlertType,
  t: (key: string) => string,
  fallback: string,
): string {
  const key = `radar.alertTypes.${type}`;
  const translated = t(key);

  return translated === key ? fallback : translated;
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance)) {
    return '—';
  }

  return `${distance.toFixed(1)}km`;
}

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      marginTop: 0,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        web: {
          boxShadow: `0 12px 32px ${colors.shadow}`,
        },
        default: {
          elevation: 8,
        },
      }),
    },

    cardResolved: {
      opacity: 0.85,
      borderColor: colors.surfaceSecondary,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 10,
    },

    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginRight: 8,
    },

    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },

    closeButtonText: {
      fontSize: 18,
      lineHeight: 20,
      color: colors.textSecondary,
      fontWeight: '700',
    },

    resolvedBadge: {
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },

    resolvedBadgeText: {
      color: colors.success,
      fontSize: 11,
      fontWeight: '700',
    },

    row: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 6,
      lineHeight: 20,
    },

    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 4,
    },

    navigationActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      gap: 8,
    },
  });
}

export default function AlertCard({
  alert,
  showAheadDistance = false,
  onClose,
  onVoted,
}: Props): React.ReactElement | null {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const { reputations } =
    useCreatorReputations([
      alert?.userId,
    ]);

  if (!alert) {
    return null;
  }

  const creatorReputation = alert.userId
    ? reputations.get(alert.userId)
    : undefined;

  const typeLabel = getAlertTypeLabel(
    alert.type,
    t,
    alert.title,
  );
  const typeEmoji = TYPE_EMOJI[alert.type] ?? '🚨';
  const location = alert.locationName ?? t('radar.toBeDetermined');
  const distanceText =
    showAheadDistance && isAlongRoute(alert)
      ? t('radar.ahead', {
          distance: alert.distanceAheadKm.toFixed(1),
        })
      : formatDistance(alert.distance);
  const isResolved = alert.resolved;
  const confirmationLabel =
    alert.confirmations === 1
      ? t('radar.confirmation')
      : t('radar.confirmations');

  console.log('LOG_ALERT_CARD_RENDERED', {
    alertId: alert.id,
    title: alert.title,
    latitude: alert.latitude,
    longitude: alert.longitude,
    platform: Platform.OS,
  });

  return (
    <View
      style={[styles.card, isResolved && styles.cardResolved]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {typeEmoji} {typeLabel}
        </Text>

        <View style={styles.headerActions}>
          {isResolved && (
            <View style={styles.resolvedBadge}>
              <Text style={styles.resolvedBadgeText}>
                {t('radar.resolved')}
              </Text>
            </View>
          )}

          {onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={styles.closeButtonText}>
                ×
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.row}>📍 {location}</Text>
      <Text style={styles.row}>🕒 {alert.time}</Text>
      <Text style={styles.row}>
        👥 {alert.confirmations} {confirmationLabel}
      </Text>

      <Text
        key={`distance-${alert.id}-${distanceText}`}
        style={styles.row}
      >
        📏 {distanceText}
      </Text>

      {alert.title.length > 0 && alert.title !== typeLabel && (
        <Text style={styles.subtitle}>{alert.title}</Text>
      )}

      <AlertVoteButtons
        key={alert.id}
        alertId={alert.id}
        positiveVotes={alert.positiveVotes}
        negativeVotes={alert.negativeVotes}
        onVoted={onVoted}
        creatorReputationScore={
          creatorReputation?.reputationScore
        }
        creatorTrustLevel={
          creatorReputation?.trustLevel
        }
      />

      <AlertCommentsSection
        alertId={alert.id}
        context="alert_detail_modal"
      />

      <View style={styles.navigationActions}>
        <Button
          title={t('radar.googleMaps')}
          onPress={() => {
            navigationService.openGoogleMaps(
              alert.latitude,
              alert.longitude,
            );
          }}
        />
        <Button
          title={t('radar.waze')}
          onPress={() => {
            navigationService.openWaze(
              alert.latitude,
              alert.longitude,
            );
          }}
        />
      </View>
    </View>
  );
}

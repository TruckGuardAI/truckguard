import React, { useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { useTheme } from '../../src/context/ThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { RoutePlannerStatus } from '../../src/hooks/useRadarRoute';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type {
  AlertAlongRoute,
  AlertType,
} from '../../src/types/alert.types';

import type { CalculatedRoute } from '../../src/types/route.types';

import type { RouteRiskResult } from '../../src/services/routeRisk.service';

import type { RiskLevel } from '../../src/types/risk.types';

const TYPE_EMOJI: Record<AlertType, string> = {
  fuel: '🚨',
  pallet: '📦',
  full_attack: '🚨',
  cargo_theft: '📦',
  cabin_attack: '🚗',
  obstacle: '⚠️',
  mechanic: '🔧',
  rest: '🛌',
  sos: '🆘',
};

function getAlertTypeLabel(
  type: AlertType,
  t: TFunction,
  fallback: string,
): string {
  const key = `radar.alertTypes.${type}`;
  const translated = t(key);

  return translated === key ? fallback : translated;
}

type Props = {
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onCalculate: () => void;
  plannerStatus: RoutePlannerStatus;
  route: CalculatedRoute | null;
  routeAlerts: AlertAlongRoute[];
  loading?: boolean;
  error?: string | null;
  warning?: string | null;
  userProgressKm?: number;
  routeRisk?: RouteRiskResult | null;
  routeRiskLoading?: boolean;
};

function getRouteRiskDisplay(
  level: RiskLevel | null | undefined,
  colors: AppThemeTokens['colors'],
  t: TFunction,
): {
  label: string;
  color: string;
} {
  switch (level) {
    case 'high':
      return {
        label: t('radar.highRisk'),
        color: colors.danger,
      };
    case 'medium':
      return {
        label: t('radar.mediumRisk'),
        color: colors.primary,
      };
    case 'low':
      return {
        label: t('radar.lowRisk'),
        color: colors.success,
      };
    default:
      return {
        label: t('radar.safeRoute'),
        color: colors.success,
      };
  }
}

function getSegmentLevelEmoji(
  level: RiskLevel,
): string {
  switch (level) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟠';
    default:
      return '🟡';
  }
}

function getPlannerStatusLabel(
  status: RoutePlannerStatus,
  t: TFunction,
): string {
  switch (status) {
    case 'calculating':
      return t('radar.routeCalculating');
    case 'calculated':
      return t('radar.routeCalculated');
    case 'error':
      return t('radar.routeErrorStatus');
    default:
      return t('radar.noRouteCalculated');
  }
}

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    panel: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },

    plannerTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 12,
    },

    statusText: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 12,
    },

    statusCalculated: {
      color: colors.success,
    },

    statusError: {
      color: colors.danger,
    },

    fieldLabel: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 6,
    },

    input: {
      backgroundColor: components.inputBackground,
      color: components.inputText,
      borderWidth: 1,
      borderColor: components.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      marginBottom: 12,
    },

    calculateButton: {
      backgroundColor: components.buttonPrimaryBg,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 14,
    },

    calculateButtonDisabled: {
      opacity: 0.65,
    },

    calculateButtonText: {
      color: components.buttonPrimaryText,
      fontWeight: '800',
      fontSize: 15,
    },

    riskSection: {
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    riskBadge: {
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 4,
    },

    riskScore: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 8,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 10,
    },

    segmentRow: {
      marginBottom: 8,
    },

    segmentLine: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },

    segmentMeta: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
      marginLeft: 4,
    },

    routeHeader: {
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    routePoint: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },

    routeArrow: {
      color: colors.textMuted,
      fontSize: 18,
      marginVertical: 4,
      textAlign: 'center',
    },

    routeDistance: {
      marginTop: 8,
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },

    progress: {
      marginTop: 10,
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },

    alertRow: {
      marginBottom: 10,
    },

    alertLine: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },

    aheadLine: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
      marginLeft: 4,
    },

    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },

    loadingText: {
      color: colors.textSecondary,
      fontSize: 13,
    },

    errorText: {
      color: colors.danger,
      fontSize: 13,
      marginBottom: 8,
    },

    warningText: {
      color: colors.warning,
      fontSize: 13,
      marginBottom: 8,
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
    },

    alertsCount: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 10,
    },
  });
}

export default function RoutePanel({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onCalculate,
  plannerStatus,
  route,
  routeAlerts,
  loading = false,
  error = null,
  warning = null,
  userProgressKm,
  routeRisk = null,
  routeRiskLoading = false,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const hasValidRiskData =
    routeRisk?.hasSufficientData === true;

  const riskDisplay = getRouteRiskDisplay(
    routeRisk?.riskLevel,
    theme.colors,
    t,
  );

  const showRiskScore =
    hasValidRiskData &&
    routeRisk?.riskScore !== null;

  const analyzedAlerts = useMemo(
    () => routeRisk?.alertsOnRoute ?? [],
    [routeRisk?.alertsOnRoute],
  );

  const listItems = useMemo(() => {
    if (analyzedAlerts.length > 0) {
      return analyzedAlerts.map((alert) => ({
        id: alert.id,
        emoji: TYPE_EMOJI[alert.type] ?? '⚠️',
        label: getAlertTypeLabel(
          alert.type,
          t,
          alert.title,
        ),
        meta: t('radar.distanceFromRoute', {
          distance: alert.distanceToRouteKm.toFixed(1),
        }),
        position: t('radar.atRouteKm', {
          km: alert.distanceAlongRouteKm.toFixed(1),
        }),
      }));
    }

    return routeAlerts.map((alert) => ({
      id: alert.id,
      emoji: TYPE_EMOJI[alert.type] ?? '⚠️',
      label: getAlertTypeLabel(
        alert.type,
        t,
        alert.title,
      ),
      meta: t('radar.ahead', {
        distance: alert.distanceAheadKm.toFixed(1),
      }),
      position: null as string | null,
    }));
  }, [analyzedAlerts, routeAlerts, t]);

  const alertsOnRouteCount =
    analyzedAlerts.length > 0
      ? analyzedAlerts.length
      : routeAlerts.length;

  const isCalculating =
    loading || plannerStatus === 'calculating';

  const canCalculate =
    origin.trim().length > 0 &&
    destination.trim().length > 0 &&
    !isCalculating;

  const statusStyle =
    plannerStatus === 'calculated'
      ? styles.statusCalculated
      : plannerStatus === 'error'
        ? styles.statusError
        : undefined;

  return (
    <View style={styles.panel}>
      <Text style={styles.plannerTitle}>
        {t('radar.routePlanner')}
      </Text>

      <Text
        style={[
          styles.statusText,
          statusStyle,
        ]}
      >
        {getPlannerStatusLabel(
          plannerStatus,
          t,
        )}
      </Text>

      <Text style={styles.fieldLabel}>
        {t('radar.routeOrigin')}
      </Text>
      <TextInput
        value={origin}
        onChangeText={onOriginChange}
        placeholder={t('radar.routeOriginPlaceholder')}
        placeholderTextColor={
          theme.colors.textMuted
        }
        style={styles.input}
        editable={!isCalculating}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <Text style={styles.fieldLabel}>
        {t('radar.routeDestination')}
      </Text>
      <TextInput
        value={destination}
        onChangeText={onDestinationChange}
        placeholder={t('radar.routeDestinationPlaceholder')}
        placeholderTextColor={
          theme.colors.textMuted
        }
        style={styles.input}
        editable={!isCalculating}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[
          styles.calculateButton,
          !canCalculate &&
            styles.calculateButtonDisabled,
        ]}
        onPress={onCalculate}
        disabled={!canCalculate}
      >
        <Text style={styles.calculateButtonText}>
          {isCalculating
            ? t('radar.routeCalculating')
            : t('radar.calculateRoute')}
        </Text>
      </TouchableOpacity>

      {warning !== null && (
        <Text style={styles.warningText}>
          {warning}
        </Text>
      )}

      {error !== null && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      {plannerStatus === 'calculated' &&
        (routeRiskLoading ||
          routeRisk ||
          route) && (
          <View style={styles.riskSection}>
            <Text style={styles.sectionTitle}>
              {t('radar.riskAnalysis')}
            </Text>

            {routeRiskLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                />
                <Text style={styles.loadingText}>
                  {t('radar.analyzingRisk')}
                </Text>
              </View>
            )}

            {!routeRiskLoading && routeRisk && (
              <>
                {!hasValidRiskData ? (
                  <Text style={styles.emptyText}>
                    {t('radar.insufficientRiskData')}
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.riskBadge,
                        {
                          color: riskDisplay.color,
                        },
                      ]}
                    >
                      {riskDisplay.label}
                    </Text>

                    {showRiskScore && (
                      <Text style={styles.riskScore}>
                        {t('radar.score', {
                          score: String(
                            routeRisk.riskScore,
                          ),
                        })}
                      </Text>
                    )}

                    <Text style={styles.alertsCount}>
                      {t('radar.alertsOnRouteCount', {
                        count: analyzedAlerts.length,
                      })}
                    </Text>
                  </>
                )}

                {hasValidRiskData &&
                  routeRisk.criticalSegments.length >
                    0 && (
                    <>
                      <Text
                        style={styles.sectionTitle}
                      >
                        {t('radar.criticalSegments', {
                          count:
                            routeRisk.criticalSegments.length,
                        })}
                      </Text>

                      {routeRisk.criticalSegments.map(
                        (segment, index) => (
                          <View
                            key={segment.id}
                            style={styles.segmentRow}
                          >
                            <Text
                              style={
                                styles.segmentLine
                              }
                            >
                              {getSegmentLevelEmoji(
                                segment.riskLevel,
                              )}{' '}
                              {t(
                                'radar.criticalSegmentItem',
                                {
                                  index: index + 1,
                                  start: segment.startKm.toFixed(
                                    0,
                                  ),
                                  end: segment.endKm.toFixed(
                                    0,
                                  ),
                                  score:
                                    segment.riskScore,
                                },
                              )}
                            </Text>
                            <Text
                              style={
                                styles.segmentMeta
                              }
                            >
                              {t(
                                'radar.criticalSegmentMeta',
                                {
                                  count:
                                    segment.alertCount,
                                  type: segment.dominantAlertType
                                    ? getAlertTypeLabel(
                                        segment.dominantAlertType,
                                        t,
                                        segment.dominantAlertType,
                                      )
                                    : t(
                                        'radar.unknownIncident',
                                      ),
                                },
                              )}
                            </Text>
                          </View>
                        ),
                      )}
                    </>
                  )}
              </>
            )}
          </View>
        )}

      {route !== null && (
        <View style={styles.routeHeader}>
          <Text style={styles.routePoint}>
            📍 {route.origin.name}
          </Text>
          <Text style={styles.routeArrow}>⬇</Text>
          <Text style={styles.routePoint}>
            📍 {route.destination.name}
          </Text>
          <Text style={styles.routeDistance}>
            {t('radar.routeDistance', {
              distance: route.distanceKm.toFixed(1),
            })}
          </Text>
          {userProgressKm !== undefined && (
            <Text style={styles.progress}>
              {t('radar.progress', {
                done: userProgressKm.toFixed(1),
                total: route.distanceKm.toFixed(0),
              })}
            </Text>
          )}
        </View>
      )}

      {plannerStatus === 'calculated' && (
        <>
          <Text style={styles.sectionTitle}>
            {t('radar.alertsOnRouteWithCount', {
              count: alertsOnRouteCount,
            })}
          </Text>

          {isCalculating && (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
              />
              <Text style={styles.loadingText}>
                {t('radar.calculatingRoute')}
              </Text>
            </View>
          )}

          {!isCalculating &&
            listItems.length === 0 && (
              <Text style={styles.emptyText}>
                {t('radar.noAlertsOnRoute')}
              </Text>
            )}

          {listItems.map((item) => (
            <View
              key={item.id}
              style={styles.alertRow}
            >
              <Text style={styles.alertLine}>
                {item.emoji} {item.label}
              </Text>
              <Text style={styles.aheadLine}>
                {item.meta}
              </Text>
              {item.position ? (
                <Text style={styles.aheadLine}>
                  {item.position}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import {
  MaterialIcons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useHomeAlerts } from '../../src/hooks/useHomeAlerts';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { supabase } from '../../src/lib/supabase';
import { profileService } from '../../src/services/profile.service';
import AlertTrustBadge from '../../src/components/alerts/AlertTrustBadge';
import AlertVoteButtons from '../../src/components/alerts/AlertVoteButtons';
import ProfileReputationBadge from '../../src/components/profile/ProfileReputationBadge';
import HomeBrandBlock from '../../src/components/branding/HomeBrandBlock';
import { formatAlertLocationDisplay } from '../../src/utils/locationDescription.utils';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type {
  HomeSafetyStatus,
} from '../../src/services/community.service';

type StatusDisplay = {
  label: string;
  subtitle: string;
  color: string;
};

function getStatusDisplay(
  status: HomeSafetyStatus,
  colors: AppThemeTokens['colors'],
  t: (key: string) => string,
): StatusDisplay {
  switch (status) {
    case 'critical':
      return {
        label: t('home.statusCritical'),
        subtitle: t('home.statusCriticalDesc'),
        color: colors.danger,
      };
    case 'attention':
      return {
        label: t('home.statusAttention'),
        subtitle: t('home.statusAttentionDesc'),
        color: colors.warning,
      };
    default:
      return {
        label: t('home.statusSafe'),
        subtitle: t('home.statusSafeDesc'),
        color: colors.success,
      };
  }
}

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    wrapper: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    container: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: colors.background,
      padding: 20,
    },

    content: {
      paddingTop: 0,
    },

    statusCard: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 20,
      marginBottom: 25,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    statusLabel: {
      color: colors.textSecondary,
    },

    statusValue: {
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 5,
    },

    small: {
      color: colors.textMuted,
    },

    section: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 15,
    },

    loader: {
      marginBottom: 15,
    },

    alertCard: {
      backgroundColor: colors.card,
      padding: 18,
      borderRadius: 15,
      marginBottom: 15,
    },

    alertTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },

    alertText: {
      color: colors.textSecondary,
      marginTop: 8,
    },

    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 30,
    },

    action: {
      backgroundColor: colors.card,
      width: '48%',
      height: 90,
      marginBottom: 15,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },

    actionText: {
      color: colors.textPrimary,
      fontSize: 12,
      marginTop: 8,
    },

    summary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 60,
    },

    summaryCard: {
      backgroundColor: colors.card,
      width: '30%',
      padding: 20,
      borderRadius: 15,
      alignItems: 'center',
    },

    number: {
      fontSize: 25,
      fontWeight: 'bold',
      color: colors.primary,
    },

    summaryText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
    },
  });
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    loading: authLoading,
  } = useAuth();

  const [
    greetingName,
    setGreetingName,
  ] = useState<string | null>(
    null,
  );

  const [
    vehicleSubtitle,
    setVehicleSubtitle,
  ] = useState(
    '',
  );

  const {
    nearbyAlerts,
    safetyStatus,
    stats,
    loading,
    refresh,
  } = useHomeAlerts();

  useFocusEffect(
    useCallback(() => {
      async function loadProfileHeader() {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log('AUTH_USER', user);

        if (!user) {
          router.replace('/login');

          return;
        }

        const displayName =
          (user.user_metadata
            ?.full_name as
            | string
            | undefined) ||
          user.email ||
          '';

        setGreetingName(displayName);

        try {
          const profile =
            await profileService.loadAuthenticatedProfile();

          const tipoVeiculo =
            profile?.tipoVeiculo?.trim() ??
            '';

          setVehicleSubtitle(
            tipoVeiculo.length > 0
              ? tipoVeiculo
              : t('home.defaultName'),
          );
        } catch (error) {
          console.log(
            'HOME_PROFILE_LOAD_ERROR',
            error,
          );

          setVehicleSubtitle(
            t('home.defaultName'),
          );
        }
      }

      void loadProfileHeader();
    }, [router, t]),
  );

  const statusDisplay = useMemo(
    () =>
      getStatusDisplay(
        safetyStatus,
        theme.colors,
        t,
      ),
    [safetyStatus, theme.colors, t],
  );

  useEffect(() => {
    console.log('HOME_RENDER_ITEMS', nearbyAlerts.length);
  }, [nearbyAlerts]);

  const homeGreeting =
    authLoading || greetingName === null
      ? t('home.greeting', {
          name: vehicleSubtitle || t('home.defaultName'),
        })
      : t('home.greeting', {
          name: greetingName,
        });

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeBrandBlock greeting={homeGreeting} />

        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>
              {t('home.currentStatus')}
            </Text>

            <Text
              style={[
                styles.statusValue,
                {
                  color:
                    statusDisplay.color,
                },
              ]}
            >
              {statusDisplay.label}
            </Text>

            <Text style={styles.small}>
              {statusDisplay.subtitle}
            </Text>
          </View>

          <MaterialIcons
            name="security"
            size={45}
            color={statusDisplay.color}
          />
        </View>

        <Text style={styles.section}>
          {t('home.nearbyAlerts')}
        </Text>

        {loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={styles.loader}
          />
        ) : nearbyAlerts.length === 0 ? (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>
              {t('home.noNearbyAlerts')}
            </Text>

            <Text style={styles.alertText}>
              {t('home.noAlertsInRadius')}
            </Text>
          </View>
        ) : (
          nearbyAlerts.map((alert, index) => {
            if (index === 0) {
              console.log('HOME_RENDER_ITEM', alert.id);
            }

            return (
            <View
              key={alert.id}
              style={styles.alertCard}
            >
              <Text style={styles.alertTitle}>
                {alert.title}
              </Text>

              <AlertTrustBadge
                trustLevel={
                  alert.trustLevel
                }
              />

              {alert.creatorTrustLevel !==
                undefined &&
              alert.creatorReputationScore !==
                undefined ? (
                <ProfileReputationBadge
                  reputationScore={
                    alert.creatorReputationScore
                  }
                  trustLevel={
                    alert.creatorTrustLevel
                  }
                  compact
                  context="home_alert"
                />
              ) : null}

              <Text style={styles.alertText}>
                📍{' '}
                {formatAlertLocationDisplay(
                  alert.locationDescription,
                )}
              </Text>

              <Text style={styles.alertText}>
                {alert.distanceKm != null
                  ? `${alert.distanceKm.toFixed(1)} km`
                  : t('home.unknownDistance')}{' '}
                • ⏱ {alert.timeAgo}
              </Text>

              <AlertVoteButtons
                key={alert.id}
                alertId={alert.id}
                positiveVotes={
                  alert.positiveVotes
                }
                negativeVotes={
                  alert.negativeVotes
                }
                onVoted={() => {
                  void refresh();
                }}
                creatorReputationScore={
                  alert.creatorReputationScore
                }
                creatorTrustLevel={
                  alert.creatorTrustLevel
                }
              />
            </View>
            );
          })
        )}

        <Text style={styles.section}>
          {t('home.quickActions')}
        </Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => {
              console.log('ACTION_SOS');
              router.push('/sos');
            }}
          >
            <MaterialIcons
              name="warning"
              size={30}
              color={theme.colors.danger}
            />

            <Text style={styles.actionText}>
              {t('home.actionSos')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => {
              console.log('ACTION_MAP');
              router.push('/(tabs)/radar');
            }}
          >
            <MaterialIcons
              name="map"
              size={30}
              color={theme.colors.primary}
            />

            <Text style={styles.actionText}>
              {t('home.actionMap')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => {
              console.log('ACTION_REPORT');
              router.push('/report-alert');
            }}
          >
            <MaterialIcons
              name="report-problem"
              size={30}
              color={theme.colors.warning}
            />

            <Text style={styles.actionText}>
              {t('home.actionReport')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => {
              console.log('ACTION_HISTORY');
              router.push('/(tabs)/history');
            }}
          >
            <MaterialIcons
              name="history"
              size={30}
              color={theme.colors.textSecondary}
            />

            <Text style={styles.actionText}>
              {t('home.actionHistory')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>
          {t('home.summary')}
        </Text>

        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text style={styles.number}>
              {stats.openCount}
            </Text>

            <Text style={styles.summaryText}>
              {t('home.openAlerts')}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.number}>
              {stats.positiveTotal}
            </Text>

            <Text style={styles.summaryText}>
              {t('home.confirmations')}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.number}>
              {stats.negativeTotal}
            </Text>

            <Text style={styles.summaryText}>
              {t('home.rejections')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

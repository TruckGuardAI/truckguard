/**

 * TRUXAFE — Community & collaborative alerts

 * Tactical mesh view: nearby operators, live corridor signals, quick coordination.

 */



import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {

  Platform,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  View,

  useWindowDimensions,

} from 'react-native';

import { useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { Ionicons } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import TruxafeHeader from '@/src/components/branding/TruxafeHeader';

import { useTheme } from '@/src/context/ThemeContext';

import { useThemedStyles } from '@/src/hooks/useThemedStyles';

import type { AppColorPalette, AppThemeTokens } from '@/src/theme/palettes';

import { truxafeSpacing } from '@/src/theme/spacing';

import { truxafeTypography } from '@/src/theme/typography';

import { truxafeShadows } from '@/src/theme/shadows';



import type { CommunityStats } from '../services/community.service';

import type { AlertSeverity, CommunityAlertItem } from '../types/community.types';

import { useCommunityAlerts } from '../hooks/useCommunityAlerts';

import AlertTrustBadge from '../components/alerts/AlertTrustBadge';

import AlertCommentsSection from '../components/alerts/AlertCommentsSection';

import AlertVoteButtons from '../components/alerts/AlertVoteButtons';

import ProfileReputationBadge from '../components/profile/ProfileReputationBadge';

import { useAuth } from '../context/AuthContext';

import {
  reputationService,
} from '../services/reputation.service';

import type { UserReputation } from '../types/reputation.types';

import { formatAlertLocationDisplay } from '../utils/locationDescription.utils';



// ---------------------------------------------------------------------------

// Types

// ---------------------------------------------------------------------------



export interface CommunityScreenProps {

  alerts?: CommunityAlertItem[];

  stats?: CommunityStats;

  onReportActivity?: () => void;

  onSendCheckIn?: () => void;

  onRequestAssistance?: () => void;

}



export type CommunityGlassCardStyle = {

  backgroundColor: string;

  borderWidth: number;

  borderColor: string;

  borderRadius: number;

};



function createCommunityGlassCardStyle(

  colors: AppColorPalette,

): CommunityGlassCardStyle {

  return {

    backgroundColor: colors.glass.fill,

    borderWidth: StyleSheet.hairlineWidth * 2,

    borderColor: colors.glass.stroke,

    borderRadius: 16,

    ...truxafeShadows.card,

  };

}



export function useCommunityGlassCardStyle(): CommunityGlassCardStyle {

  const { theme } = useTheme();



  return useMemo(

    () => createCommunityGlassCardStyle(theme.colors),

    [theme],

  );

}



function createCommunityStyles(theme: AppThemeTokens) {

  const { colors } = theme;

  const glassCard = createCommunityGlassCardStyle(colors);



  return StyleSheet.create({

    root: {

      flex: 1,

      backgroundColor: colors.background,

    },

    scroll: {

      paddingHorizontal: truxafeSpacing.lg,

      paddingTop: 12,

      gap: truxafeSpacing.md,

    },

    banner: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: truxafeSpacing.sm,

      paddingVertical: truxafeSpacing.sm,

      paddingHorizontal: truxafeSpacing.md,

      borderLeftWidth: 3,

      borderLeftColor: colors.success,

    },

    bannerText: {

      color: colors.textPrimary,

      flex: 1,

    },

    headerCard: {

      marginTop: 16,

      padding: truxafeSpacing.md,

      borderLeftWidth: 3,

      borderLeftColor: 'rgba(184, 107, 58, 0.45)',

    },

    headerTop: {

      flexDirection: 'row',

      gap: truxafeSpacing.md,

      alignItems: 'center',

    },

    headerTextCol: {

      flex: 1,

      minWidth: 0,

    },

    capsMuted: {

      color: colors.textMuted,

      textTransform: 'uppercase',

      letterSpacing: 0.55,

      marginBottom: 2,

    },

    textPrimary: { color: colors.textPrimary },

    textSecondary: { color: colors.textSecondary },

    textMuted: { color: colors.textMuted },

    liveRow: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: truxafeSpacing.sm,

      marginTop: truxafeSpacing.sm,

    },

    liveDot: {

      width: 8,

      height: 8,

      borderRadius: 4,

    },

    liveLabel: {

      color: colors.textSecondary,

      letterSpacing: 0.3,

    },

    myReputationWrap: {
      marginTop: truxafeSpacing.md,
      gap: truxafeSpacing.xs,
    },

    headerMetrics: {

      flexDirection: 'row',

      marginTop: truxafeSpacing.lg,

      alignItems: 'stretch',

    },

    metricCell: {

      flex: 1,

      minWidth: 0,

    },

    metricOrange: {

      color: colors.primary,

      fontSize: 26,

      lineHeight: 30,

      fontWeight: '600',

    },

    metricDivider: {

      width: StyleSheet.hairlineWidth * 2,

      backgroundColor: colors.border,

      marginHorizontal: truxafeSpacing.sm,

    },

    safetyPill: {

      alignSelf: 'flex-start',

      paddingHorizontal: truxafeSpacing.sm,

      paddingVertical: 4,

      borderRadius: 8,

      marginTop: 4,

    },

    radarHost: {

      justifyContent: 'center',

      alignItems: 'center',

    },

    radarRing: {

      position: 'absolute',

      borderWidth: 1,

      backgroundColor: 'transparent',

    },

    sectionTitle: {

      color: colors.textPrimary,

      marginTop: truxafeSpacing.sm,

    },

    sectionSub: {

      color: colors.textSecondary,

      marginTop: -truxafeSpacing.xs,

      marginBottom: truxafeSpacing.xs,

    },

    alertCard: {

      padding: truxafeSpacing.md,

    },

    alertTop: {

      flexDirection: 'row',

      gap: truxafeSpacing.md,

      alignItems: 'flex-start',

    },

    alertIconWrap: {

      width: 40,

      height: 40,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent: 'center',

      backgroundColor: colors.surfaceSecondary,

      borderWidth: 1,

    },

    alertHeadText: {

      flex: 1,

      minWidth: 0,

    },

    alertMetaRow: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: truxafeSpacing.sm,

      marginTop: 4,

    },

    severityPill: {

      fontWeight: '700',

      letterSpacing: 0.4,

    },

    alertBody: {

      marginTop: truxafeSpacing.sm,

      paddingTop: truxafeSpacing.sm,

      borderTopWidth: StyleSheet.hairlineWidth * 2,

      borderTopColor: colors.border,

    },

    alertRow: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: truxafeSpacing.sm,

    },

    driverPanel: {

      padding: truxafeSpacing.md,

      gap: truxafeSpacing.sm,

    },

    driverPanelHead: {

      flexDirection: 'row',

      justifyContent: 'space-between',

      alignItems: 'center',

      marginBottom: truxafeSpacing.xs,

    },

    meshLive: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

    },

    meshLiveText: {

      color: colors.primary,

      fontWeight: '600',

      letterSpacing: 0.3,

    },

    driverRow: {

      flexDirection: 'row',

      alignItems: 'center',

      paddingVertical: truxafeSpacing.sm,

      borderBottomWidth: StyleSheet.hairlineWidth,

      borderBottomColor: colors.border,

    },

    driverRowLast: {

      borderBottomWidth: 0,

    },

    driverAvatar: {

      width: 40,

      height: 40,

      borderRadius: 12,

      backgroundColor: 'rgba(184, 107, 58, 0.1)',

      alignItems: 'center',

      justifyContent: 'center',

      marginRight: truxafeSpacing.md,

      borderWidth: 1,

      borderColor: 'rgba(184, 107, 58, 0.22)',

    },

    driverText: {

      flex: 1,

      minWidth: 0,

    },

    protectedTag: {

      padding: truxafeSpacing.xs,

    },

    quickRow: {

      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: truxafeSpacing.md,

      justifyContent: 'space-between',

      marginBottom: truxafeSpacing.lg,

    },

    quickRowStacked: {

      flexDirection: 'column',

    },

    quickSlotFull: {

      width: '100%',

    },

    quickTile: {

      ...glassCard,

      flex: 1,

      minHeight: 88,

      paddingVertical: truxafeSpacing.md,

      paddingHorizontal: truxafeSpacing.sm,

      alignItems: 'center',

      justifyContent: 'center',

      gap: truxafeSpacing.sm,

    },

    quickTilePressed: {

      opacity: 0.88,

      borderColor: 'rgba(184, 107, 58, 0.35)',

    },

    quickLabel: {

      color: colors.textPrimary,

      textAlign: 'center',

      fontWeight: '600',

      letterSpacing: 0.15,

    },

  });

}



export function useCommunityStyles() {

  const styles = useThemedStyles(createCommunityStyles);

  const glassCard = useCommunityGlassCardStyle();



  return { styles, glassCard };

}



// ---------------------------------------------------------------------------

// Helpers

// ---------------------------------------------------------------------------



function severityColors(

  sev: AlertSeverity,

  colors: AppColorPalette,

): { fg: string; bg: string; border: string } {

  switch (sev) {

    case 'critical':

      return {

        fg: colors.danger,

        bg: 'rgba(211, 47, 54, 0.1)',

        border: 'rgba(211, 47, 54, 0.35)',

      };

    case 'urgent':

      return {

        fg: colors.primary,

        bg: 'rgba(184, 107, 58, 0.1)',

        border: 'rgba(184, 107, 58, 0.35)',

      };

    case 'watch':

      return {

        fg: colors.warning,

        bg: 'rgba(158, 122, 58, 0.12)',

        border: 'rgba(158, 122, 58, 0.3)',

      };

    default:

      return {

        fg: colors.textSecondary,

        bg: 'rgba(154, 161, 174, 0.08)',

        border: colors.border,

      };

  }

}



function hapticLight() {

  if (Platform.OS !== 'web') {

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  }

}



// ---------------------------------------------------------------------------

// Subcomponents

// ---------------------------------------------------------------------------



interface ProtectionHeaderProps {

  stats: CommunityStats;

  myReputation: UserReputation | null;

}



function ProtectionHeader({
  stats,
  myReputation,
}: ProtectionHeaderProps) {

  const { t } = useTranslation();
  const { theme } = useTheme();

  const { styles, glassCard } = useCommunityStyles();



  return (

    <View style={[glassCard, styles.headerCard]}>

      <View style={styles.headerTop}>

        <View style={styles.headerTextCol}>

          <Text style={[truxafeTypography.caption, styles.capsMuted]}>

            {t('community.protection')}

          </Text>

          <Text style={[truxafeTypography.subheading, styles.textPrimary]}>

            {t('community.communityAlerts')}

          </Text>

          <View style={styles.liveRow}>

            <View

              style={[

                styles.liveDot,

                { backgroundColor: theme.colors.success },

              ]}

            />

            <Text style={[truxafeTypography.caption, styles.liveLabel]}>

              {t('community.activeMonitoring')}

            </Text>

          </View>

        </View>

      </View>

      {myReputation ? (
        <View style={styles.myReputationWrap}>
          <Text
            style={[
              truxafeTypography.caption,
              styles.capsMuted,
            ]}
          >
            {t('reputation.myReputation')}
          </Text>

          <ProfileReputationBadge
            reputationScore={
              myReputation.reputationScore
            }
            trustLevel={
              myReputation.trustLevel
            }
            compact
            context="community_header"
          />
        </View>
      ) : null}

      <View style={styles.headerMetrics}>

        <View style={styles.metricCell}>

          <Text style={[truxafeTypography.caption, styles.capsMuted]}>{t('community.active')}</Text>

          <Text style={[truxafeTypography.heading, styles.metricOrange]}>

            {stats.openCount}

          </Text>

          <Text style={[truxafeTypography.caption, styles.textMuted]}>{t('community.alerts')}</Text>

        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCell}>

          <Text style={[truxafeTypography.caption, styles.capsMuted]}>{t('community.confirmations')}</Text>

          <Text style={[truxafeTypography.heading, styles.metricOrange]}>

            {stats.positiveTotal}

          </Text>

          <Text style={[truxafeTypography.caption, styles.textMuted]}>{t('community.votes')}</Text>

        </View>

        <View style={styles.metricDivider} />

        <View style={[styles.metricCell, { flex: 1.2 }]}>

          <Text style={[truxafeTypography.caption, styles.capsMuted]}>{t('community.rejections')}</Text>

          <Text style={[truxafeTypography.heading, styles.metricOrange]}>

            {stats.negativeTotal}

          </Text>

          <Text style={[truxafeTypography.caption, styles.textMuted]} numberOfLines={2}>

            {t('community.negativeVotes')}

          </Text>

        </View>

      </View>

    </View>

  );

}



interface AlertFeedCardProps {

  alert: CommunityAlertItem;

  onVoted?: () => void;

}



function AlertFeedCard({

  alert,

  onVoted,

}: AlertFeedCardProps) {

  const { theme } = useTheme();

  const { styles, glassCard } = useCommunityStyles();

  const sev = severityColors(alert.severity, theme.colors);



  return (

    <View style={[glassCard, styles.alertCard]}>

      <View style={styles.alertTop}>

        <View style={[styles.alertIconWrap, { borderColor: sev.border }]}>

          <Ionicons name={alert.icon} size={20} color={sev.fg} />

        </View>

        <View style={styles.alertHeadText}>

          <Text style={[truxafeTypography.subheading, styles.textPrimary]} numberOfLines={1}>

            {alert.title}

          </Text>

          <Text

            style={[truxafeTypography.bodySmall, styles.textSecondary]}

            numberOfLines={2}

          >

            📍 {formatAlertLocationDisplay(alert.locationLabel)}

          </Text>

          <AlertTrustBadge

            trustLevel={alert.trustLevel}

            style={styles.textSecondary}

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
              context="community_alert"
            />
          ) : null}

          <View style={styles.alertMetaRow}>

            <Text style={[truxafeTypography.caption, styles.severityPill, { color: sev.fg }]}>

              {alert.severity.toUpperCase()}

            </Text>

            <Text style={[truxafeTypography.caption, styles.textMuted]}>{alert.timeAgo}</Text>

          </View>

        </View>

      </View>

      <View style={styles.alertBody}>

        <View style={styles.alertRow}>

          <Ionicons name="navigate-outline" size={14} color={theme.colors.textMuted} />

          <Text style={[truxafeTypography.bodySmall, styles.textSecondary]}>

            {alert.distanceKm.toFixed(1)} km

          </Text>

        </View>

        <AlertVoteButtons

          alertId={alert.id}

          positiveVotes={alert.positiveVotes}

          negativeVotes={alert.negativeVotes}

          onVoted={onVoted}

          creatorReputationScore={
            alert.creatorReputationScore
          }

          creatorTrustLevel={
            alert.creatorTrustLevel
          }

        />

        <AlertCommentsSection
          alertId={alert.id}
          context="community_feed"
        />

      </View>

    </View>

  );

}



interface QuickActionProps {

  label: string;

  icon: keyof typeof Ionicons.glyphMap;

  onPress: () => void;

}



function QuickActionTile({ label, icon, onPress }: QuickActionProps) {

  const { theme } = useTheme();

  const { styles } = useCommunityStyles();



  return (

    <Pressable

      accessibilityRole="button"

      accessibilityLabel={label}

      onPress={onPress}

      style={({ pressed }) => [

        styles.quickTile,

        pressed && styles.quickTilePressed,

      ]}

    >

      <Ionicons name={icon} size={22} color={theme.colors.primary} />

      <Text style={[truxafeTypography.bodySmall, styles.quickLabel]} numberOfLines={2}>

        {label}

      </Text>

    </Pressable>

  );

}



// ---------------------------------------------------------------------------

// Screen

// ---------------------------------------------------------------------------



export function CommunityScreen({

  alerts: propsAlerts,

  stats: propsStats,

  onReportActivity,

  onSendCheckIn,

  onRequestAssistance,

}: CommunityScreenProps) {

  const { t } = useTranslation();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();

  const [banner, setBanner] = useState<string | null>(null);

  const [
    myReputation,
    setMyReputation,
  ] = useState<UserReputation | null>(
    null,
  );

  const { user } = useAuth();

  const { theme } = useTheme();

  const { styles, glassCard } = useCommunityStyles();



  const {

    alerts: realAlerts,

    stats: realStats,

    refresh,

  } = useCommunityAlerts();



  const alertList = propsAlerts ?? realAlerts;

  const stats = propsStats ?? realStats;



  useEffect(() => {

    console.log('COMMUNITY_RENDER_ITEMS', alertList.length);

  }, [alertList]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let mounted = true;

    void reputationService
      .getUserReputation(user.id)
      .then((data) => {
        if (mounted) {
          setMyReputation(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setMyReputation(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);



  const quickMin = useMemo(() => {

    const gap = truxafeSpacing.md;

    const horizontal = width - truxafeSpacing.lg * 2;

    const perThree = Math.floor((horizontal - gap * 2) / 3);

    return Math.max(96, Math.min(perThree, 140));

  }, [width]);



  const stackedQuick = width < 360;



  const bottomPad = Math.max(insets.bottom, truxafeSpacing.md) + 112;



  const defaultReport = useCallback(() => {

    hapticLight();

    onReportActivity?.() ?? router.push({ pathname: '/(tabs)/sos', params: { intent: 'report' } });

  }, [onReportActivity, router]);



  const defaultCheckIn = useCallback(() => {

    hapticLight();

    if (onSendCheckIn) {

      onSendCheckIn();

      return;

    }

    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    setBanner(t('community.checkinSent', { time }));

  }, [onSendCheckIn, t]);



  const defaultAssist = useCallback(() => {

    hapticLight();

    onRequestAssistance?.() ?? router.push('/(tabs)/sos');

  }, [onRequestAssistance, router]);



  return (

    <View style={styles.root}>

      <TruxafeHeader
        title={t('tabs.community')}
      />

      <ScrollView

        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}

        showsVerticalScrollIndicator={false}

        keyboardShouldPersistTaps="handled"

      >

        {banner ? (

          <View style={[glassCard, styles.banner]}>

            <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.success} />

            <Text style={[truxafeTypography.bodySmall, styles.bannerText]}>{banner}</Text>

          </View>

        ) : null}



        <ProtectionHeader
          stats={stats}
          myReputation={
            user?.id
              ? myReputation
              : null
          }
        />



        <Text style={[truxafeTypography.subheading, styles.sectionTitle]}>{t('community.liveFeed')}</Text>

        <Text style={[truxafeTypography.bodySmall, styles.sectionSub]}>

          {t('community.verifiedSignals')}

        </Text>



        {alertList.length === 0 ? (

          <View style={[glassCard, styles.alertCard]}>

            <Text style={[truxafeTypography.bodySmall, styles.textSecondary]}>

              {t('community.empty')}

            </Text>

          </View>

        ) : (

          alertList.map((a, index) => {

            if (index === 0) {

              console.log('COMMUNITY_RENDER_ITEM', a.id);

            }



            return (

              <AlertFeedCard

                key={a.id}

                alert={a}

                onVoted={() => {

                  void refresh();

                }}

              />

            );

          })

        )}



        <Text style={[truxafeTypography.subheading, styles.sectionTitle]}>{t('community.quickActions')}</Text>

        <View

          style={[

            styles.quickRow,

            stackedQuick && styles.quickRowStacked,

          ]}

        >

          <View style={stackedQuick ? styles.quickSlotFull : { minWidth: quickMin, flex: 1 }}>

            <QuickActionTile label={t('community.reportActivity')} icon="alert-circle-outline" onPress={defaultReport} />

          </View>

          <View style={stackedQuick ? styles.quickSlotFull : { minWidth: quickMin, flex: 1 }}>

            <QuickActionTile label={t('community.sendCheckin')} icon="hand-left-outline" onPress={defaultCheckIn} />

          </View>

          <View style={stackedQuick ? styles.quickSlotFull : { minWidth: quickMin, flex: 1 }}>

            <QuickActionTile label={t('community.requestAssistance')} icon="call-outline" onPress={defaultAssist} />

          </View>

        </View>

      </ScrollView>

    </View>

  );

}



export default CommunityScreen;



/**
 * TRUXAFE — Community & collaborative alerts
 * Tactical mesh view: nearby operators, live corridor signals, quick coordination.
 */

import React, { useCallback, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { truxafeColors } from '@/src/theme/colors';
import { truxafeSpacing } from '@/src/theme/spacing';
import { truxafeTypography } from '@/src/theme/typography';
import { truxafeShadows } from '@/src/theme/shadows';

import type { AlertSeverity, CommunityAlertItem } from '../types/community.types';
import { useCommunityAlerts } from '../hooks/useCommunityAlerts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AreaSafetyLevel = 'optimal' | 'elevated' | 'restricted';

export interface NearbyDriverModel {
  id: string;
  label: string;
  distanceKm: number;
  corridor: string;
}

export interface CommunityProtectionSnapshot {
  nearbyOnline: number;
  safetyLevel: AreaSafetyLevel;
  monitoringLive: boolean;
  protectedRadiusKm: number;
  communityActiveLabel: string;
}

export interface CommunityScreenProps {
  protection?: Partial<CommunityProtectionSnapshot>;
  alerts?: CommunityAlertItem[];
  nearbyDrivers?: NearbyDriverModel[];
  onReportActivity?: () => void;
  onSendCheckIn?: () => void;
  onRequestAssistance?: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PROTECTION: CommunityProtectionSnapshot = {
  nearbyOnline: 31,
  safetyLevel: 'elevated',
  monitoringLive: true,
  protectedRadiusKm: 42,
  communityActiveLabel: 'Corridor mesh · encrypted',
};

const MOCK_ALERTS: CommunityAlertItem[] = [
  {
    id: '1',
    type: 'diesel_theft_attempt',
    title: 'Diesel theft attempt',
    distanceKm: 2.1,
    locationLabel: 'A2 · Rest sector North',
    timeAgo: '4 min ago',
    severity: 'urgent',
    icon: 'flame-outline',
  },
  {
    id: '2',
    type: 'suspicious_activity',
    title: 'Suspicious activity',
    distanceKm: 5.8,
    locationLabel: 'B481 · Loading apron',
    timeAgo: '12 min ago',
    severity: 'watch',
    icon: 'eye-outline',
  },
  {
    id: '3',
    type: 'cargo_alert',
    title: 'Cargo alert',
    distanceKm: 8.4,
    locationLabel: 'Depot gate C',
    timeAgo: '18 min ago',
    severity: 'urgent',
    icon: 'cube-outline',
  },
  {
    id: '4',
    type: 'driver_sos',
    title: 'Driver SOS',
    distanceKm: 11.2,
    locationLabel: 'E40 · Lane merge',
    timeAgo: '22 min ago',
    severity: 'critical',
    icon: 'shield-outline',
  },
  {
    id: '5',
    type: 'security_check_in',
    title: 'Security check-in',
    distanceKm: 0.6,
    locationLabel: 'Your corridor',
    timeAgo: '26 min ago',
    severity: 'info',
    icon: 'checkmark-circle-outline',
  },
];

const MOCK_DRIVERS: NearbyDriverModel[] = [
  { id: 'd1', label: 'Unit DE-441', distanceKm: 1.2, corridor: 'A2 eastbound' },
  { id: 'd2', label: 'Unit NL-902', distanceKm: 3.4, corridor: 'Ring sync' },
  { id: 'd3', label: 'Unit PL-118', distanceKm: 6.0, corridor: 'B48 merge' },
];

export const communityGlassCardStyle = {
  backgroundColor: truxafeColors.glass.fill,
  borderWidth: StyleSheet.hairlineWidth * 2,
  borderColor: truxafeColors.glass.stroke,
  borderRadius: 16,
  ...truxafeShadows.card,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityColors(sev: AlertSeverity): { fg: string; bg: string; border: string } {
  switch (sev) {
    case 'critical':
      return {
        fg: truxafeColors.danger,
        bg: 'rgba(211, 47, 54, 0.1)',
        border: 'rgba(211, 47, 54, 0.35)',
      };
    case 'urgent':
      return {
        fg: truxafeColors.primary,
        bg: 'rgba(184, 107, 58, 0.1)',
        border: 'rgba(184, 107, 58, 0.35)',
      };
    case 'watch':
      return {
        fg: truxafeColors.warning,
        bg: 'rgba(158, 122, 58, 0.12)',
        border: 'rgba(158, 122, 58, 0.3)',
      };
    default:
      return {
        fg: truxafeColors.textSecondary,
        bg: 'rgba(154, 161, 174, 0.08)',
        border: truxafeColors.border,
      };
  }
}

function safetyBadge(level: AreaSafetyLevel): { label: string; fg: string; bg: string } {
  switch (level) {
    case 'optimal':
      return {
        label: 'OPTIMAL',
        fg: truxafeColors.success,
        bg: 'rgba(79, 125, 98, 0.14)',
      };
    case 'restricted':
      return {
        label: 'RESTRICTED',
        fg: truxafeColors.danger,
        bg: 'rgba(211, 47, 54, 0.12)',
      };
    default:
      return {
        label: 'ELEVATED',
        fg: truxafeColors.warning,
        bg: 'rgba(158, 122, 58, 0.14)',
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

function RadarGlyph({ size = 72 }: { size?: number }) {
  const rings = [1, 0.72, 0.48];
  return (
    <View style={[communityScreenStyles.radarHost, { width: size, height: size }]}>
      {rings.map((scale, i) => (
        <View
          key={i}
          style={[
            communityScreenStyles.radarRing,
            {
              width: size * scale,
              height: size * scale,
              borderRadius: (size * scale) / 2,
              opacity: 0.14 + i * 0.06,
              borderColor: truxafeColors.primaryMuted,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface ProtectionHeaderProps {
  snapshot: CommunityProtectionSnapshot;
}

function ProtectionHeader({ snapshot }: ProtectionHeaderProps) {
  const badge = safetyBadge(snapshot.safetyLevel);
  return (
    <View style={[communityGlassCardStyle, communityScreenStyles.headerCard]}>
      <View style={communityScreenStyles.headerTop}>
        <RadarGlyph size={64} />
        <View style={communityScreenStyles.headerTextCol}>
          <Text style={[truxafeTypography.caption, communityScreenStyles.capsMuted]}>
            Community protection
          </Text>
          <Text style={[truxafeTypography.subheading, communityScreenStyles.textPrimary]}>
            Collaborative corridor
          </Text>
          <View style={communityScreenStyles.liveRow}>
            <View
              style={[
                communityScreenStyles.liveDot,
                { backgroundColor: snapshot.monitoringLive ? truxafeColors.success : truxafeColors.textMuted },
              ]}
            />
            <Text style={[truxafeTypography.caption, communityScreenStyles.liveLabel]}>
              {snapshot.monitoringLive ? 'Active monitoring' : 'Standby'}
            </Text>
          </View>
        </View>
      </View>

      <View style={communityScreenStyles.headerMetrics}>
        <View style={communityScreenStyles.metricCell}>
          <Text style={[truxafeTypography.caption, communityScreenStyles.capsMuted]}>Nearby</Text>
          <Text style={[truxafeTypography.heading, communityScreenStyles.metricOrange]}>
            {snapshot.nearbyOnline}
          </Text>
          <Text style={[truxafeTypography.caption, communityScreenStyles.textMuted]}>online</Text>
        </View>
        <View style={communityScreenStyles.metricDivider} />
        <View style={communityScreenStyles.metricCell}>
          <Text style={[truxafeTypography.caption, communityScreenStyles.capsMuted]}>Safety</Text>
          <View style={[communityScreenStyles.safetyPill, { backgroundColor: badge.bg }]}>
            <Text style={[truxafeTypography.caption, { color: badge.fg, fontWeight: '700' }]}>
              {badge.label}
            </Text>
          </View>
        </View>
        <View style={communityScreenStyles.metricDivider} />
        <View style={[communityScreenStyles.metricCell, { flex: 1.2 }]}>
          <Text style={[truxafeTypography.caption, communityScreenStyles.capsMuted]}>Protected</Text>
          <Text style={[truxafeTypography.status, communityScreenStyles.textSecondary]}>
            {snapshot.protectedRadiusKm} km radius
          </Text>
          <Text style={[truxafeTypography.caption, communityScreenStyles.textMuted]} numberOfLines={2}>
            {snapshot.communityActiveLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface AlertFeedCardProps {
  alert: CommunityAlertItem;
}

function AlertFeedCard({ alert }: AlertFeedCardProps) {
  const sev = severityColors(alert.severity);
  return (
    <View style={[communityGlassCardStyle, communityScreenStyles.alertCard]}>
      <View style={communityScreenStyles.alertTop}>
        <View style={[communityScreenStyles.alertIconWrap, { borderColor: sev.border }]}>
          <Ionicons name={alert.icon} size={20} color={sev.fg} />
        </View>
        <View style={communityScreenStyles.alertHeadText}>
          <Text style={[truxafeTypography.subheading, communityScreenStyles.textPrimary]} numberOfLines={1}>
            {alert.title}
          </Text>
          <View style={communityScreenStyles.alertMetaRow}>
            <Text style={[truxafeTypography.caption, communityScreenStyles.severityPill, { color: sev.fg }]}>
              {alert.severity.toUpperCase()}
            </Text>
            <Text style={[truxafeTypography.caption, communityScreenStyles.textMuted]}>{alert.timeAgo}</Text>
          </View>
        </View>
      </View>
      <View style={communityScreenStyles.alertBody}>
        <View style={communityScreenStyles.alertRow}>
          <Ionicons name="navigate-outline" size={14} color={truxafeColors.textMuted} />
          <Text style={[truxafeTypography.bodySmall, communityScreenStyles.textSecondary]}>
            {alert.distanceKm.toFixed(1)} km · {alert.locationLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface NearbyDriverRowProps {
  driver: NearbyDriverModel;
  isLast?: boolean;
}

function NearbyDriverRow({ driver, isLast }: NearbyDriverRowProps) {
  return (
    <View style={[communityScreenStyles.driverRow, isLast && communityScreenStyles.driverRowLast]}>
      <View style={communityScreenStyles.driverAvatar}>
        <Ionicons name="radio-outline" size={18} color={truxafeColors.primary} />
      </View>
      <View style={communityScreenStyles.driverText}>
        <Text style={[truxafeTypography.body, communityScreenStyles.textPrimary]}>{driver.label}</Text>
        <Text style={[truxafeTypography.caption, communityScreenStyles.textMuted]}>
          {driver.distanceKm.toFixed(1)} km · {driver.corridor}
        </Text>
      </View>
      <View style={communityScreenStyles.protectedTag}>
        <Ionicons name="shield-checkmark-outline" size={14} color={truxafeColors.success} />
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        communityScreenStyles.quickTile,
        pressed && communityScreenStyles.quickTilePressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={truxafeColors.primary} />
      <Text style={[truxafeTypography.bodySmall, communityScreenStyles.quickLabel]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function CommunityScreen({
  protection,
  alerts: propsAlerts,
  nearbyDrivers,
  onReportActivity,
  onSendCheckIn,
  onRequestAssistance,
}: CommunityScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [banner, setBanner] = useState<string | null>(null);

  const snapshot = useMemo(
    () => ({ ...DEFAULT_PROTECTION, ...protection }),
    [protection],
  );

  const { alerts: realAlerts } = useCommunityAlerts(MOCK_ALERTS);

  const alertList = propsAlerts ?? realAlerts;
  const driverList = nearbyDrivers ?? MOCK_DRIVERS;

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
    const t = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    setBanner(`Check-in sent · ${t}`);
  }, [onSendCheckIn]);

  const defaultAssist = useCallback(() => {
    hapticLight();
    onRequestAssistance?.() ?? router.push('/(tabs)/sos');
  }, [onRequestAssistance, router]);

  return (
    <View style={[communityScreenStyles.root, { paddingTop: insets.top + truxafeSpacing.sm }]}>
      <ScrollView
        contentContainerStyle={[communityScreenStyles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {banner ? (
          <View style={[communityGlassCardStyle, communityScreenStyles.banner]}>
            <Ionicons name="checkmark-done-outline" size={18} color={truxafeColors.success} />
            <Text style={[truxafeTypography.bodySmall, communityScreenStyles.bannerText]}>{banner}</Text>
          </View>
        ) : null}

        <ProtectionHeader snapshot={snapshot} />

        <Text style={[truxafeTypography.subheading, communityScreenStyles.sectionTitle]}>Live feed</Text>
        <Text style={[truxafeTypography.bodySmall, communityScreenStyles.sectionSub]}>
          Verified community signals in your operational radius.
        </Text>

        {alertList.map((a) => (
          <AlertFeedCard key={a.id} alert={a} />
        ))}

        <Text style={[truxafeTypography.subheading, communityScreenStyles.sectionTitle]}>Nearby drivers</Text>
        <View style={[communityGlassCardStyle, communityScreenStyles.driverPanel]}>
          <View style={communityScreenStyles.driverPanelHead}>
            <Text style={[truxafeTypography.caption, communityScreenStyles.capsMuted]}>Online mesh</Text>
            <View style={communityScreenStyles.meshLive}>
              <Ionicons name="pulse-outline" size={14} color={truxafeColors.primary} />
              <Text style={[truxafeTypography.caption, communityScreenStyles.meshLiveText]}>Active</Text>
            </View>
          </View>
          {driverList.map((d, i) => (
            <NearbyDriverRow key={d.id} driver={d} isLast={i === driverList.length - 1} />
          ))}
        </View>

        <Text style={[truxafeTypography.subheading, communityScreenStyles.sectionTitle]}>Quick actions</Text>
        <View
          style={[
            communityScreenStyles.quickRow,
            stackedQuick && communityScreenStyles.quickRowStacked,
          ]}
        >
          <View style={stackedQuick ? communityScreenStyles.quickSlotFull : { minWidth: quickMin, flex: 1 }}>
            <QuickActionTile label="Report activity" icon="alert-circle-outline" onPress={defaultReport} />
          </View>
          <View style={stackedQuick ? communityScreenStyles.quickSlotFull : { minWidth: quickMin, flex: 1 }}>
            <QuickActionTile label="Send check-in" icon="hand-left-outline" onPress={defaultCheckIn} />
          </View>
          <View style={stackedQuick ? communityScreenStyles.quickSlotFull : { minWidth: quickMin, flex: 1 }}>
            <QuickActionTile label="Request assistance" icon="call-outline" onPress={defaultAssist} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default CommunityScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const communityScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: truxafeColors.background,
  },
  scroll: {
    paddingHorizontal: truxafeSpacing.lg,
    gap: truxafeSpacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: truxafeSpacing.sm,
    paddingVertical: truxafeSpacing.sm,
    paddingHorizontal: truxafeSpacing.md,
    borderLeftWidth: 3,
    borderLeftColor: truxafeColors.success,
  },
  bannerText: {
    color: truxafeColors.textPrimary,
    flex: 1,
  },
  headerCard: {
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
    color: truxafeColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
    marginBottom: 2,
  },
  textPrimary: { color: truxafeColors.textPrimary },
  textSecondary: { color: truxafeColors.textSecondary },
  textMuted: { color: truxafeColors.textMuted },
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
    color: truxafeColors.textSecondary,
    letterSpacing: 0.3,
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
    color: truxafeColors.primary,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: truxafeColors.border,
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
    color: truxafeColors.textPrimary,
    marginTop: truxafeSpacing.sm,
  },
  sectionSub: {
    color: truxafeColors.textSecondary,
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
    backgroundColor: truxafeColors.surfaceSecondary,
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
    borderTopColor: truxafeColors.border,
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
    color: truxafeColors.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: truxafeSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: truxafeColors.border,
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
    ...communityGlassCardStyle,
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
    color: truxafeColors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});

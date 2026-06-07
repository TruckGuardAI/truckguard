import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import AlertDetailModal from './AlertDetailModal';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type { Alert } from '../../src/types/alert.types';
import type { UserCoordinates } from '../../src/services/location.service';

import type { AlertVotesSummary } from '../../src/services/vote.service';
import { findAlertById } from '../../src/utils/alertRadar.utils';

type Props = {
  alerts?: Alert[];
  userLocation: UserCoordinates;
  routeCoordinates?: import('../../src/types/route.types').RouteCoordinate[];
  connectionStatus?: import('../../src/types/alert.types').AlertsConnectionStatus;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      height: 520,
      marginTop: 25,
      borderRadius: 30,
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 12,
    },

    locationBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },

    locationText: {
      color: colors.textSecondary,
      marginBottom: 4,
    },

    alertsContainer: {
      flex: 1,
    },

    alertItem: {
      backgroundColor: colors.surfaceSecondary,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },

    alertTitle: {
      color: colors.textPrimary,
      fontWeight: '700',
    },

    alertType: {
      color: colors.primary,
      marginTop: 4,
    },

    alertCoords: {
      color: colors.textMuted,
      marginTop: 4,
      fontSize: 12,
    },
  });
}

export default function RadarMap({
  alerts = [],
  userLocation,
  routeCoordinates = [],
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const [
    selectedAlertId,
    setSelectedAlertId,
  ] = useState<string | null>(null);

  const [
    modalAlert,
    setModalAlert,
  ] = useState<Alert | null>(null);

  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) {
      return null;
    }

    if (
      modalAlert &&
      modalAlert.id === selectedAlertId
    ) {
      return modalAlert;
    }

    return (
      findAlertById(
        alerts,
        selectedAlertId,
      ) ?? null
    );
  }, [alerts, selectedAlertId, modalAlert]);

  const handleVoteUpdated = useCallback(
    (summary: AlertVotesSummary) => {
      setModalAlert((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          positiveVotes:
            summary.totalConfirmations,
          negativeVotes:
            summary.totalRejections,
        };
      });
    },
    [],
  );

  const validAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      return (
        typeof alert.latitude === 'number' &&
        typeof alert.longitude === 'number' &&
        !Number.isNaN(alert.latitude) &&
        !Number.isNaN(alert.longitude) &&
        !alert.resolved
      );
    });
  }, [alerts]);

  const hasValidUserLocation =
    typeof userLocation?.latitude === 'number' &&
    typeof userLocation?.longitude === 'number';

  if (!hasValidUserLocation) {
    return <View style={styles.container} />;
  }

  return (
    <>
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('radar.communityRadar')}
      </Text>

      <View style={styles.locationBox}>
        <Text style={styles.locationText}>
          {t('radar.latitude')} {userLocation.latitude.toFixed(6)}
        </Text>

        <Text style={styles.locationText}>
          {t('radar.longitude')} {userLocation.longitude.toFixed(6)}
        </Text>

        <Text style={styles.locationText}>
          {t('radar.activeAlerts')} {validAlerts.length}
        </Text>

        <Text style={styles.locationText}>
          {t('radar.routePoints')} {routeCoordinates.length}
        </Text>
      </View>

      <ScrollView
        style={styles.alertsContainer}
        showsVerticalScrollIndicator={false}
      >
        {validAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={styles.alertItem}
            onPress={() => {
              setSelectedAlertId(alert.id);
              setModalAlert(alert);
            }}
          >
            <Text style={styles.alertTitle}>
              {alert.title}
            </Text>

            <Text style={styles.alertType}>
              {alert.type}
            </Text>

            <Text style={styles.alertCoords}>
              {Number(alert.latitude).toFixed(5)}
              {' | '}
              {Number(alert.longitude).toFixed(5)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    <AlertDetailModal
      visible={Boolean(selectedAlert)}
      alert={selectedAlert}
      showAheadDistance={
        routeCoordinates.length > 0
      }
      onClose={() => {
        setSelectedAlertId(null);
        setModalAlert(null);
      }}
      onVoted={handleVoteUpdated}
    />
    </>
  );
}
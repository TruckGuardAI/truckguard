import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import AlertCard from './AlertCard';

import type { Alert } from '../../src/types/alert.types';
import type { UserCoordinates } from '../../src/services/location.service';

import { findAlertById } from '../../src/utils/alertRadar.utils';

type Props = {
  alerts?: Alert[];
  userLocation: UserCoordinates;
  routeCoordinates?: import('../../src/types/route.types').RouteCoordinate[];
  connectionStatus?: import('../../src/types/alert.types').AlertsConnectionStatus;
  onConfirmAlert?: (id: string) => Promise<void>;
  onResolveAlert?: (id: string) => Promise<void>;
};

export default function RadarMap({
  alerts = [],
  userLocation,
  routeCoordinates = [],
  onConfirmAlert,
  onResolveAlert,
}: Props) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    if (!selectedAlert) {
      return;
    }

    const updatedAlert = findAlertById(
      alerts,
      selectedAlert.id
    );

    if (updatedAlert) {
      setSelectedAlert(updatedAlert);
    } else {
      setSelectedAlert(null);
    }
  }, [alerts, selectedAlert]);

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
    <View style={styles.container}>
      <Text style={styles.title}>
        Radar Comunitário
      </Text>

      <View style={styles.locationBox}>
        <Text style={styles.locationText}>
          Latitude: {userLocation.latitude.toFixed(6)}
        </Text>

        <Text style={styles.locationText}>
          Longitude: {userLocation.longitude.toFixed(6)}
        </Text>

        <Text style={styles.locationText}>
          Alertas ativos: {validAlerts.length}
        </Text>

        <Text style={styles.locationText}>
          Pontos da rota: {routeCoordinates.length}
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
            onPress={() => setSelectedAlert(alert)}
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

      {selectedAlert && (
        <AlertCard
          alert={selectedAlert}
          showAheadDistance={routeCoordinates.length > 0}
          onConfirm={async () => {
            if (!onConfirmAlert) {
              return;
            }

            try {
              await onConfirmAlert(selectedAlert.id);
            } catch (error) {
              console.error(
                'Erro ao confirmar alerta:',
                error
              );
            }
          }}
          onResolve={async () => {
            if (!onResolveAlert) {
              return;
            }

            try {
              await onResolveAlert(selectedAlert.id);
              setSelectedAlert(null);
            } catch (error) {
              console.error(
                'Erro ao resolver alerta:',
                error
              );
            }
          }}
          onDetails={() => {
            console.log(
              'Detalhes alerta:',
              selectedAlert
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 520,
    marginTop: 25,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },

  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },

  locationBox: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  locationText: {
    color: '#cbd5e1',
    marginBottom: 4,
  },

  alertsContainer: {
    flex: 1,
  },

  alertItem: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  alertTitle: {
    color: '#ffffff',
    fontWeight: '700',
  },

  alertType: {
    color: '#f97316',
    marginTop: 4,
  },

  alertCoords: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 12,
  },
});
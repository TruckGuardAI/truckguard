import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import RadarMap from '../components/radar/RadarMap';
import { useAlertProximity } from '../hooks/useAlertProximity';
import { useRadarAlerts } from '../hooks/useRadarAlerts';

import { alertsApiService } from '../services/alertsApi.service';

import type { Alert } from '../types/alert.types';

export default function RadarScreen() {
  const [rawAlerts, setRawAlerts] =
    useState<Alert[]>([]);

  useEffect(() => {
    const unsubscribe =
      alertsApiService.subscribeAlerts(
        (data) => {
          console.log(
            'SUPABASE ALERTS:',
            data.length
          );

          console.log(
            'SUPABASE COORDS:',
            JSON.stringify(
              data.map(alert => ({
                id: alert.id,
                title: alert.title,
                latitude: alert.latitude,
                longitude: alert.longitude,
              })),
              null,
              2
            )
          );

          setRawAlerts(data);
        }
      );

    return unsubscribe;
  }, []);

  const {
    alerts,
    userLocation,
    locationReady,
  } = useRadarAlerts(rawAlerts);

  useAlertProximity(
    alerts,
    userLocation,
    locationReady,
  );

  console.log(
    'GPS:',
    userLocation.latitude,
    userLocation.longitude
  );

  console.log(
    'ALERTS:',
    alerts.length
  );

  console.log(
    'ALERTS COORDS:',
    JSON.stringify(
      alerts.map(alert => ({
        id: alert.id,
        latitude: alert.latitude,
        longitude: alert.longitude,
      })),
      null,
      2
    )
  );

  if (!locationReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadarMap
        latitude={userLocation.latitude}
        longitude={userLocation.longitude}
        alerts={alerts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
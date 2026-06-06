import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import type { RadarMapProps } from './RadarMap.types';

export default function RadarMap({
  latitude,
  longitude,
  alerts,
}: RadarMapProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        Radar Comunitário
      </Text>

      <Text style={styles.location}>
        Latitude: {latitude.toFixed(6)}
      </Text>

      <Text style={styles.location}>
        Longitude: {longitude.toFixed(6)}
      </Text>

      <Text style={styles.counter}>
        Alertas: {alerts.length}
      </Text>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {alerts.map((item) => (
          <View
            key={String(item.id)}
            style={styles.alertCard}
          >
            <Text style={styles.alertTitle}>
              {item.title}
            </Text>

            <Text style={styles.alertCoords}>
              {item.latitude.toFixed(5)} ,
              {' '}
              {item.longitude.toFixed(5)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 260,
    borderRadius: 24,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  location: {
    color: '#cbd5e1',
    marginBottom: 4,
  },

  counter: {
    color: '#60a5fa',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },

  list: {
    flex: 1,
  },

  alertCard: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  alertTitle: {
    color: '#ffffff',
    fontWeight: '600',
  },

  alertCoords: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 12,
  },
});